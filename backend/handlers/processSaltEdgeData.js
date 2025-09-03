'use strict';

const db = require('../utils/db');
const axios = require('axios');
const {
    processAffordability
} = require('./processAffordability');

// Helper function to handle database interaction
async function saveReport(
    applicantId,
    score,
    income,
    expenses,
    flags,
    rawData,
    incomeStabilityScore,
    enhancedDtiRatio,
    behavioralSavingsRate,
    financialCushionMonths
) {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const reportQuery = `
      INSERT INTO affordability_reports (
        applicant_id,
        affordability_score,
        verified_income_monthly,
        verified_expenses_monthly,
        flags,
        report_data,
        income_stability_score,
        enhanced_dti_ratio,
        behavioral_savings_rate,
        financial_cushion_months
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
        const reportData = rawData ? {
            rawSaltEdgeData: rawData
        } : null;
        const reportValues = [
            applicantId,
            score,
            income,
            expenses,
            JSON.stringify(flags),
            reportData,
            incomeStabilityScore,
            enhancedDtiRatio,
            behavioralSavingsRate,
            financialCushionMonths
        ];
        await client.query(reportQuery, reportValues);

        const updateQuery = `
      UPDATE applicants
      SET status = 'complete'
      WHERE id = $1;
    `;
        await client.query(updateQuery, [applicantId]);

        await client.query('COMMIT');

        console.log(`Successfully saved report and updated status for applicant ${applicantId}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database transaction failed:', error);
    } finally {
        client.release();
    }
}

module.exports.processSaltEdgeData = async (connectionId, customerId) => {
    try {
        // Step 1: Fetch accounts for the connection
        const accountsResponse = await axios.get(`https://www.saltedge.com/api/v6/accounts?connection_id=${connectionId}`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'App-id': process.env.SALTEDGE_APP_ID,
                'Secret': process.env.SALTEDGE_SECRET,
                'Customer-secret': customerId
            }
        });
        const accounts = accountsResponse.data.data;

        // Step 2: Fetch transactions for each account
        let allTransactions = [];
        for (const account of accounts) {
            const transactionsResponse = await axios.get(`https://www.saltedge.com/api/v6/transactions?connection_id=${connectionId}&account_id=${account.id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'App-id': process.env.SALTEDGE_APP_ID,
                    'Secret': process.env.SALTEDGE_SECRET,
                    'Customer-secret': customerId
                }
            });
            allTransactions = allTransactions.concat(transactionsResponse.data.data);
        }

        // Step 3: Process the data using V4 logic
        const {
            income_stability_score,
            enhanced_dti_ratio,
            average_monthly_income,
            behavioral_savings_rate,
            financial_cushion_months,
            flags
        } = processAffordability(allTransactions, accounts);

        // The old affordability score is no longer the primary metric, but we can keep it for now.
        // Or we can create a new one based on the new metrics. For now, let's use a simplified version.
        // A score of 10 minus the DTI ratio, capped at 0 and 10.
        let affordability_score = 10 - (enhanced_dti_ratio / 10);
        affordability_score = Math.max(0, Math.min(10, affordability_score));
        affordability_score = parseFloat(affordability_score.toFixed(2));


        // Step 4: Find applicantId from customerId
        const applicantResult = await db.query('SELECT id FROM applicants WHERE saltedge_customer_id = $1', [customerId]);
        if (applicantResult.rows.length === 0) {
            throw new Error(`Applicant not found for customer_id: ${customerId}`);
        }
        const applicantId = applicantResult.rows[0].id;

        // Step 5: Save the report
        await saveReport(
            applicantId,
            affordability_score,
            average_monthly_income,
            0, // Old expenses field, no longer used
            flags,
            {
                transactions: allTransactions,
                summary: {
                    connectedAccounts: accounts.length,
                    totalTransactions: allTransactions.length
                }
            },
            income_stability_score,
            enhanced_dti_ratio,
            behavioral_savings_rate,
            financial_cushion_months
        );

    } catch (error) {
        console.error('Error in processSaltEdgeData:', error.response ? error.response.data : error.message);
    }
};
