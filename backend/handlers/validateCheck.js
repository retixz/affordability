'use strict';

const db = require('../utils/db');

const validateCheck = async (req, res) => {
  const { token } = req.params;

  try {
    const query = `
      SELECT a.full_name, l.company_name
      FROM applicants a
      JOIN landlords l ON a.landlord_id = l.id
      WHERE a.secure_link_token = $1 AND a.status = 'pending';
    `;
    const values = [token];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'This link is invalid or has expired.' });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
    validateCheck,
};
