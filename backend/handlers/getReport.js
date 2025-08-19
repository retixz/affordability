'use strict';

const db = require('../db');

module.exports.getReport = async (event) => {
  const { applicantId } = event.pathParameters;

  if (!applicantId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Applicant ID is required.' }),
    };
  }

  let client;
  try {
    client = await db.getClient();
    const query = `
      SELECT
        a.full_name,
        ar.affordability_score,
        ar.verified_income_monthly,
        ar.verified_expenses_monthly
      FROM applicants a
      JOIN affordability_reports ar ON a.id = ar.applicant_id
      WHERE a.id = $1;
    `;
    const values = [applicantId];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Report not found.' }),
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
