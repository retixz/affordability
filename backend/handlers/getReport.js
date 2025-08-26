'use strict';

const db = require('../db');

const getReport = async (req, res) => {
  const { applicantId } = req.params;
  const { landlordId } = req;

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
      WHERE a.id = $1 AND a.landlord_id = $2;
    `;
    const values = [applicantId, landlordId];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found or you do not have permission to view it.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (client) {
      await client.end();
    }
  }
};

module.exports = {
    getReport,
};
