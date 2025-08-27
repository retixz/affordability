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
    // ... (omitted for brevity, no changes here)

    // Salt Edge API Integration
    const customerResponse = await axios.post('https://www.saltedge.com/api/v5/customers', {
      data: { identifier: email }
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'App-id': process.env.SALTEDGE_APP_ID,
        'Secret': process.env.SALTEDGE_SECRET
      }
    });

    const customerId = customerResponse.data.data.id;

    const connectSessionResponse = await axios.post('https://www.saltedge.com/api/v5/connect_sessions/create', {
      data: {
        customer_id: customerId,
        consent: { scopes: ['account_details', 'transactions_details'] },
        attempt: { fetch_scopes: ['accounts', 'transactions'] },
        return_to: `${process.env.FRONTEND_URL}/saltedge-return`
      }
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'App-id': process.env.SALTEDGE_APP_ID,
        'Secret': process.env.SALTEDGE_SECRET
      }
    });

    const connectUrl = connectSessionResponse.data.data.connect_url;
    const token = crypto.randomBytes(32).toString('hex');

    const query = `
      INSERT INTO applicants (full_name, email, landlord_id, secure_link_token, status, saltedge_customer_id, saltedge_connect_url)
      VALUES ($1, $2, $3, $4, 'pending', $5, $6)
      RETURNING id;
    `;
    const values = [fullName, email, landlordId, token, customerId, connectUrl];
    await db.query(query, values);

    // ... (omitted for brevity, no changes here)

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
