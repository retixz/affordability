'use strict';

const crypto = require('crypto');
const db = require('../db');
const { authorize } = require('../middleware/auth');

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const createCheckHandler = async (event) => {
  const { fullName, email } = JSON.parse(event.body);
  const { landlordId } = event;

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

  let client;
  try {
    client = await db.getClient();
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
    if (client) {
      await client.end();
    }
  }
};

module.exports.createCheck = authorize(createCheckHandler);
