'use strict';

const crypto = require('crypto');
const db = require('../utils/db');
const axios = require('axios');

const createCheck = async (req, res) => {
  const { fullName, email } = req.body;
  const { landlordId } = req;

  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Usage Metering Logic
    const landlordRes = await db.query('SELECT subscription_status, usage_limit FROM landlords WHERE id = $1', [landlordId]);
    if (landlordRes.rows.length === 0) {
      return res.status(404).json({ error: 'Landlord not found.' });
    }

    const { subscription_status, usage_limit } = landlordRes.rows[0];

    if (subscription_status !== 'active') {
      return res.status(403).json({ error: 'Subscription not active.' });
    }

    const limit = usage_limit;

    const usageRes = await db.query('SELECT check_count FROM usage_records WHERE landlord_id = $1 AND month = $2 AND year = $3', [landlordId, month, year]);

    let check_count = 0;
    if (usageRes.rows.length > 0) {
      check_count = usageRes.rows[0].check_count;
    }

    if (check_count >= limit) {
      return res.status(403).json({ error: 'Usage limit reached.' });
    }
    // End of Usage Metering Logic

    // Salt Edge API Integration
    const customerResponse = await axios.post('https://www.saltedge.com/api/v6/customers', {
      data: { identifier: email }
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'App-id': process.env.SALTEDGE_APP_ID,
        'Secret': process.env.SALTEDGE_SECRET
      }
    });

    const customerId = customerResponse.data.data.customer_id;
    const connectSessionResponse = await axios.post('https://www.saltedge.com/api/v6/connections/connect', {
      data: {
        customer_id: customerId,
        consent: {
          scopes: ['accounts', 'transactions']
        },
        attempt: {
          fetch_scopes: ['accounts', 'transactions'],
          return_to: `${process.env.FRONTEND_URL}/saltedge-return`
        }
      }
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'App-id': process.env.SALTEDGE_APP_ID,
        'Secret': process.env.SALTEDGE_SECRET
      }
    });
    console.log('Created Salt Edge connect session.');

    const connectUrl = connectSessionResponse.data.data.connect_url;
    const token = crypto.randomBytes(32).toString('hex');

    const query = `
      INSERT INTO applicants (full_name, email, landlord_id, secure_link_token, status, saltedge_customer_id, saltedge_connect_url)
      VALUES ($1, $2, $3, $4, 'pending', $5, $6)
      RETURNING id;
    `;
    const values = [fullName, email, landlordId, token, customerId, connectUrl];
    await db.query(query, values);

    // Increment usage record
    const upsertUsageQuery = `
      INSERT INTO usage_records (landlord_id, month, year, check_count)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (landlord_id, month, year)
      DO UPDATE SET check_count = usage_records.check_count + 1;
    `;
    await db.query(upsertUsageQuery, [landlordId, month, year]);

    const secureLink = `${process.env.FRONTEND_URL}/check/${token}`;

    return res.status(201).json({ secureLink });
  } catch (error) {
    console.error('Error in createCheck:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
    createCheck,
};
