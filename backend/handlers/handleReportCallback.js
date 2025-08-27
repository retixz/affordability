'use strict';

const axios = require('axios');
const db = require('../utils/db');
const { processAffordabilityV3 } = require('./processAffordabilityV3');

const handleReportCallback = async (req, res) => {
  const { incomeCheckReportId, expenseCheckReportId, state: secureLinkToken } = req.body;

  if (!incomeCheckReportId || !expenseCheckReportId || !secureLinkToken) {
    return res.status(400).json({ error: 'Missing required report IDs or state token.' });
  }

  try {
    // Step 1: Retrieve the applicant's ID using the secure token.
    const applicantResult = await db.query(
      "SELECT id FROM applicants WHERE secure_link_token = $1 AND status = 'pending'",
      [secureLinkToken]
    );

    if (applicantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found or check already processed.' });
    }
    const applicantId = applicantResult.rows[0].id;

    await db.query("UPDATE applicants SET status = 'in_progress' WHERE id = $1", [applicantId]);

    // Step 2: Get a client access token from Tink.
    const tokenResponse = await axios.post('https://api.tink.com/api/v1/oauth/token', new URLSearchParams({
      client_id: process.env.TINK_CLIENT_ID,
      client_secret: process.env.TINK_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'income-checks:readonly,expense-checks:readonly'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const accessToken = tokenResponse.data.access_token;

    // Step 3: Fetch the Income Check and Expense Check reports.
    const fetchIncomeReport = axios.get(`https://api.tink.com/risk/v1/income-checks/${incomeCheckReportId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const fetchExpenseReport = axios.get(`https://api.tink.com/risk/v1/expense-checks/${expenseCheckReportId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const [incomeResponse, expenseResponse] = await Promise.all([fetchIncomeReport, fetchExpenseReport]);

    // Step 4: Asynchronously invoke the V3 processing function.
    const payload = {
      applicantId: applicantId,
      incomeReport: incomeResponse.data,
      expenseReport: expenseResponse.data,
    };

    await processAffordabilityV3(payload);
    console.log(`Successfully queued V3 processing for applicant ID: ${applicantId}`);

    // Step 5: Send a success response to the frontend.
    return res.status(200).json({ message: 'Affordability reports received and processing started.' });

  } catch (error) {
    console.error('Error in report callback handler:', error.response ? error.response.data : error.message);
    // TODO: Add logic to revert applicant status if something fails here.
    return res.status(500).json({ error: 'An error occurred while processing the reports.' });
  }
};

module.exports = {
    handleReportCallback,
};
