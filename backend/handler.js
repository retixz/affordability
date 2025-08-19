'use strict';

require('dotenv').config();
const crypto = require('crypto');
const { Client } = require('pg');
const axios = require('axios');

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
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
  await client.connect();

  try {
    // Exchange the authorization code for an access token
    const response = await axios.post('https://api.tink.com/api/v1/oauth/token', new URLSearchParams({
      code: code,
      client_id: process.env.TINK_CLIENT_ID,
      client_secret: process.env.TINK_CLIENT_SECRET,
      grant_type: 'authorization_code'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = response.data.access_token;
    console.log('Successfully received Tink access token:', accessToken);

    // Update the applicant's status to 'in_progress'
    const updateQuery = `
      UPDATE applicants
      SET status = 'in_progress'
      WHERE secure_link_token = $1;
    `;
    await client.query(updateQuery, [secureLinkToken]);

    // Redirect the user to the success page
    const successUrl = `https://${process.env.PORTAL_HOST}/check/success`;
    return {
      statusCode: 302,
      headers: {
        Location: successUrl,
      },
    };

  } catch (error) {
    console.error('Error in Tink callback handler:', error.response ? error.response.data : error.message);
    // TODO: Redirect to a failure page
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
