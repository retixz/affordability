'use strict';

const db = require('../utils/db');

const getApplicants = async (req, res) => {
  const { landlordId } = req;
  const { search, status, page = 1, limit = 10 } = req.query;

  try {
    let whereClauses = ['landlord_id = $1'];
    let values = [landlordId];
    let paramIndex = 2;

    if (search) {
      whereClauses.push(`(full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      whereClauses.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query to get the total count of matching applicants
    const countQueryText = `SELECT COUNT(*) FROM applicants ${whereCondition};`;
    const countResult = await db.query(countQueryText, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Query to get the paginated list of applicants
    const offset = (page - 1) * limit;
    const applicantsQueryText = `
      SELECT id, full_name, status
      FROM applicants
      ${whereCondition}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;
    const applicantsValues = [...values, limit, offset];
    const { rows: applicants } = await db.query(applicantsQueryText, applicantsValues);

    return res.status(200).json({
      applicants,
      totalCount,
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
    getApplicants,
};
