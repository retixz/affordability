'use strict';

const db = require('../db');

const getApplicants = async (req, res) => {
  const { landlordId } = req;

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

    return res.status(200).json(result.rows);
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
    getApplicants,
};
