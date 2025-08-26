'use strict';

const crypto = require('crypto');
const USAGE_LIMITS = {
    starter: 5,
    pro: 20,
    business: 100,
};
const db = require('../utils/db');

const createCheck = async (req, res) => {
  const { fullName, email } = req.body;
  const { landlordId } = req;

  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Usage Metering Logic
    const landlordRes = await db.query('SELECT subscription_plan, subscription_status FROM landlords WHERE id = $1', [landlordId]);
    if (landlordRes.rows.length === 0) {
      return res.status(404).json({ error: 'Landlord not found.' });
    }

    const { subscription_plan, subscription_status } = landlordRes.rows[0];

    if (subscription_status !== 'active') {
      return res.status(403).json({ error: 'Subscription not active.' });
    }

    const plan = subscription_plan || 'starter';
    const limit = USAGE_LIMITS[plan];

    const usageRes = await db.query('SELECT check_count FROM usage_records WHERE landlord_id = $1 AND month = $2 AND year = $3', [landlordId, month, year]);

    let check_count = 0;
    if (usageRes.rows.length > 0) {
      check_count = usageRes.rows[0].check_count;
    }

    if (check_count >= limit) {
      return res.status(403).json({ error: 'Usage limit reached.' });
    }
    // End of Usage Metering Logic

    const token = crypto.randomBytes(32).toString('hex');

    const query = `
      INSERT INTO applicants (full_name, email, landlord_id, secure_link_token, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id;
    `;
    const values = [fullName, email, landlordId, token];
    await db.query(query, values);

    // Increment usage record
    const upsertUsageQuery = `
      INSERT INTO usage_records (landlord_id, month, year, check_count)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (landlord_id, month, year)
      DO UPDATE SET check_count = usage_records.check_count + 1;
    `;
    await db.query(upsertUsageQuery, [landlordId, month, year]);

    const secureLink = `https://${process.env.PORTAL_HOST}/check/${token}`;

    return res.status(201).json({ secureLink });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
    createCheck,
};
