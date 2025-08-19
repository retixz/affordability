'use strict';

const db = require('../db');
const { authorize } = require('../middleware/auth');

const getApplicantsHandler = async (event) => {
  const { landlordId } = event;

  let client;
  try {
    client = await db.getClient();
    const query = `
      SELECT id, full_name, status
      FROM applicants
      WHERE landlord_id = $1;
    `;
    const values = [landlordId];
    const result = await client.query(query, values);

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
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

module.exports.getApplicants = authorize(getApplicantsHandler);
