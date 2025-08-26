'use strict';

const axios = require('axios');
const db = require('../db');
const { processTinkData } = require('./processTinkData');

const handleTinkCallback = async (req, res) => {
  const { code, state: secureLinkToken } = req.query;

  let client;
  try {
    client = await db.getClient();

    // Step 1: Retrieve the applicant's ID using the secure token.
    const applicantResult = await client.query(
      "SELECT id FROM applicants WHERE secure_link_token = $1 AND status = 'pending'",
      [secureLinkToken]
    );

    if (applicantResult.rows.length === 0) {
      // This prevents re-processing and handles invalid tokens.
      return res.status(404).json({ error: 'Applicant not found or check already processed.' });
    }
    const applicantId = applicantResult.rows[0].id;

    // Step 2: Exchange the authorization code for a Tink access token.
    const tokenResponse = await axios.post('https://api.tink.com/api/v1/oauth/token', new URLSearchParams({
      code: code,
      client_id: process.env.TINK_CLIENT_ID,
      client_secret: process.env.TINK_CLIENT_SECRET,
      grant_type: 'authorization_code'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const accessToken = tokenResponse.data.access_token;

    // Step 3: Fetch the raw transaction data from Tink's API.
    const transactionsResponse = await axios.get('https://api.tink.com/data/v2/transactions', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const transactions = transactionsResponse.data.transactions;

    // Step 4: Asynchronously invoke our data processing Lambda function.
    const payload = {
      applicantId: applicantId,
      transactions: transactions.map(t => ({ description: t.description, amount: t.amount.value })),
      rawTinkData: transactions,
    };

    await processTinkData(payload);
    console.log(`Successfully queued processing for applicant ID: ${applicantId}`);

    // Immediately update the applicant's status to 'in_progress'
    await client.query("UPDATE applicants SET status = 'in_progress' WHERE id = $1", [applicantId]);

    // Step 5: Redirect the user to a success page.
    const successUrl = `https://${process.env.PORTAL_HOST}/check/success`;
    return res.redirect(successUrl);

  } catch (error) {
    console.error('Error in Tink callback handler:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'An error occurred during the Tink flow.' });
  } finally {
    if (client) {
      await client.end();
    }
  }
};

module.exports = {
    handleTinkCallback,
};
