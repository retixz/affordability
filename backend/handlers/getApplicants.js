'use strict';

const db = require('../utils/db');

const getApplicants = async (req, res) => {
  const { landlordId } = req;

  try {
    const queryText = `
      SELECT id, full_name, status
      FROM applicants
      WHERE landlord_id = $1;
    `;
    const values = [landlordId];
    const { rows } = await db.query(queryText, values);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
    getApplicants,
};
