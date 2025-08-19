'use strict';

const crypto = require('crypto');
const { Client } = require('pg');

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

    // This is hardcoded for now, but should be replaced with a dynamic domain
    const secureLink = `https://[YOUR_APP_DOMAIN]/check/${token}`;

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
