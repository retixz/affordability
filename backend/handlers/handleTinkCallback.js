'use strict';

const AWS = require('aws-sdk');
const axios = require('axios');
const db = require('../db');
const { processTinkData } = require('./processTinkData');

module.exports.handleTinkCallback = async (event) => {
  const { code, state: secureLinkToken } = event.queryStringParameters;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Tink callback error: No code provided.' }),
    };
  }

  let client;
  const lambda = new AWS.Lambda();

  try {
    client = await db.getClient();

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
    const transactionsResponse = await axios.get('https://api.tink.com/data/v2/transactions', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const transactions = transactionsResponse.data.transactions;

    // Step 4: Asynchronously invoke our data processing Lambda function.
    const payload = {
      applicantId: applicantId,
      transactions: transactions.map(t => ({ description: t.description, amount: t.amount.value })),
      rawTinkData: transactions,
    };

    // In the original code, this was invoking a lambda.
    // For simplicity in this refactoring, we'll call the function directly.
    // In a production system, async invocation would be preferred.
    await processTinkData(payload);
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred during the Tink flow.' }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
