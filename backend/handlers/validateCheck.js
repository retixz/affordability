'use strict';

const db = require('../db');

module.exports.validateCheck = async (event) => {
  const { token } = event.pathParameters;

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Token is required.' }),
    };
  }

  let client;
  try {
    client = await db.getClient();
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
    if (client) {
      await client.end();
    }
  }
};
