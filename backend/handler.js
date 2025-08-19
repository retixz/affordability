'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');
const crypto = require('crypto');
const { Client } = require('pg');
const axios = require('axios');

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

module.exports.processTinkData = async (event) => {
  const { applicantId, transactions, rawTinkData } = event;

  // Version 1: Data Analysis Logic
  const incomeKeywords = ["salary", "wages", "payroll", "deposit", "income"];
  const expenseKeywords = ["rent", "utility", "loan", "payment", "debit", "purchase"];

  let totalIncome = 0;
  let totalExpenses = 0;

  // Assuming 'transactions' is an array of transaction objects
  for (const transaction of transactions) {
    const description = (transaction.description || '').toLowerCase();
    // Assuming the amount is a simple number, positive for income, negative for expenses
    const amount = transaction.amount;

    if (amount > 0 && incomeKeywords.some(keyword => description.includes(keyword))) {
      totalIncome += amount;
    }

    if (amount < 0 && expenseKeywords.some(keyword => description.includes(keyword))) {
      totalExpenses += Math.abs(amount);
    }
  }

  // Calculate monthly averages, assuming a 90-day period for the data
  const verified_income_monthly = totalIncome / 3;
  const verified_expenses_monthly = totalExpenses / 3;

  // Calculate Affordability Score
  let affordability_score;

  if (verified_income_monthly <= 0) {
    affordability_score = 0.00;
  } else {
    const disposable_ratio = (verified_income_monthly - verified_expenses_monthly) / verified_income_monthly;
    affordability_score = disposable_ratio * 10;
  }

  // Clamp the score between 0.00 and 10.00
  affordability_score = Math.max(0, Math.min(10, affordability_score));

  // Round to two decimal places
  affordability_score = parseFloat(affordability_score.toFixed(2));

  // Database Operations
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  };

  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query('BEGIN');

    // Insert the report
    const reportQuery = `
      INSERT INTO affordability_reports (applicant_id, affordability_score, verified_income_monthly, verified_expenses_monthly, report_data)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const reportValues = [applicantId, affordability_score, verified_income_monthly, verified_expenses_monthly, { rawTinkData }];
    await client.query(reportQuery, reportValues);

    // Update the applicant's status
    const updateQuery = `
      UPDATE applicants
      SET status = 'complete'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [applicantId]);

    await client.query('COMMIT');

    console.log(`Successfully saved report and updated status for applicant ${applicantId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Analysis and database update complete",
        applicantId,
        affordability_score
      }),
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database transaction failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error during database operation.' }),
    };
  } finally {
    await client.end();
  }
};

module.exports.createCheck = async (event) => {

  const { fullName, email } = JSON.parse(event.body);

  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Full name is required.' }),
    };
  }

  if (!email || typeof email !== 'string' || !validateEmail(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Email is required and must be valid.' }),
    };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const landlordId = 1; // Hardcoded for MVP

  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  };

  const client = new Client(dbConfig);

  try {
    await client.connect();

    const query = `
      INSERT INTO applicants (full_name, email, landlord_id, secure_link_token, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id;
    `;
    const values = [fullName, email, landlordId, token];
    await client.query(query, values);

    const secureLink = `https://${process.env.PORTAL_HOST}/check/${token}`;

    return {
      statusCode: 201,
      body: JSON.stringify({ secureLink }),
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  } finally {
    await client.end();
  }
};

module.exports.handleTinkCallback = async (event) => {
  const { code, state: secureLinkToken } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Tink callback error: No code provided.' }),
    };
  }

  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  };

  const client = new Client(dbConfig);
  const lambda = new AWS.Lambda();

  try {
    await client.connect();

    // Step 1: Retrieve the applicant's ID using the secure token.
    const applicantResult = await client.query(
      "SELECT id FROM applicants WHERE secure_link_token = $1 AND status = 'pending'",
      [secureLinkToken]
    );

    if (applicantResult.rows.length === 0) {
      // This prevents re-processing and handles invalid tokens.
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Applicant not found or check already processed.' }),
      };
    }
    const applicantId = applicantResult.rows[0].id;

    // Step 2: Exchange the authorization code for a Tink access token.
    const tokenResponse = await axios.post('https://api.tink.com/api/v1/oauth/token', new URLSearchParams({
      code: code,
      client_id: process.env.TINK_CLIENT_ID,
      client_secret: process.env.TINK_CLIENT_SECRET,
      grant_type: 'authorization_code'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const accessToken = tokenResponse.data.access_token;

    // Step 3: Fetch the raw transaction data from Tink's API.
    // Note: In a real-world scenario, you might want to fetch more than the default number of transactions.
    const transactionsResponse = await axios.get('https://api.tink.com/data/v2/transactions', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const transactions = transactionsResponse.data.transactions; // Assuming the API returns { transactions: [...] }

    // Step 4: Asynchronously invoke our data processing Lambda function.
    const payload = {
      applicantId: applicantId,
      transactions: transactions.map(t => ({ description: t.description, amount: t.amount.value })), // Transform to simpler structure
      rawTinkData: transactions, // Also pass the original raw data
    };

    const invokeParams = {
      FunctionName: `affordability-api-backend-dev-processTinkData`, // Adjust stage 'dev' as needed
      InvocationType: 'Event', // Ensures the function is invoked asynchronously
      Payload: JSON.stringify(payload),
    };

    await lambda.invoke(invokeParams).promise();
    console.log(`Successfully queued processing for applicant ID: ${applicantId}`);

    // Immediately update the applicant's status to 'in_progress'
    await client.query("UPDATE applicants SET status = 'in_progress' WHERE id = $1", [applicantId]);

    // Step 5: Redirect the user to a success page.
    const successUrl = `https://${process.env.PORTAL_HOST}/check/success`;
    return {
      statusCode: 302,
      headers: { Location: successUrl },
    };

  } catch (error) {
    console.error('Error in Tink callback handler:', error.response ? error.response.data : error.message);
    // Consider redirecting to a failure page
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred during the Tink flow.' }),
    };
  } finally {
    await client.end();
  }
};

module.exports.validateCheck = async (event) => {
  const { token } = event.pathParameters;

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Token is required.' }),
    };
  }

  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  };

  const client = new Client(dbConfig);

  try {
    await client.connect();

    const query = `
      SELECT a.full_name, l.company_name
      FROM applicants a
      JOIN landlords l ON a.landlord_id = l.id
      WHERE a.secure_link_token = $1 AND a.status = 'pending';
    `;
    const values = [token];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'This link is invalid or has expired.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  } finally {
    await client.end();
  }
};
