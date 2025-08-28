'use strict';

const db = require('../utils/db');
const axios = require('axios');

// Helper function to handle database interaction
async function saveReport(applicantId, score, income, expenses, rawData) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const reportQuery = `
      INSERT INTO affordability_reports (applicant_id, affordability_score, verified_income_monthly, verified_expenses_monthly, report_data)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const reportData = rawData ? { rawSaltEdgeData: rawData } : null;
    const reportValues = [applicantId, score, income, expenses, reportData];
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
        const accountsResponse = await axios.get(`https://www.saltedge.com/api/v5/accounts?connection_id=${connectionId}`, {
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
            const transactionsResponse = await axios.get(`https://www.saltedge.com/api/v5/transactions?connection_id=${connectionId}&account_id=${account.id}`, {
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

        // Step 3: Process the data
        const incomeCategories = ['Salary', 'Government Benefits', 'Pension'];
        const expenseCategories = ['Rent', 'Mortgage', 'Utilities', 'Insurance', 'Loan Repayment', 'Childcare'];

        let totalIncome = 0;
        let totalExpenses = 0;

        for (const transaction of allTransactions) {
            if (incomeCategories.includes(transaction.category)) {
                totalIncome += transaction.amount;
            } else if (expenseCategories.includes(transaction.category)) {
                totalExpenses += Math.abs(transaction.amount);
            }
        }

        const verified_income_monthly = totalIncome / 3;
        const verified_expenses_monthly = totalExpenses / 3;

        let affordability_score;
        if (verified_income_monthly <= 0) {
            affordability_score = 0.00;
        } else {
            const disposable_ratio = (verified_income_monthly - verified_expenses_monthly) / verified_income_monthly;
            affordability_score = disposable_ratio * 10;
        }

        affordability_score = Math.max(0, Math.min(10, affordability_score));
        affordability_score = parseFloat(affordability_score.toFixed(2));

        // Step 4: Find applicantId from customerId
        const applicantResult = await db.query('SELECT id FROM applicants WHERE saltedge_customer_id = $1', [customerId]);
        if (applicantResult.rows.length === 0) {
            throw new Error(`Applicant not found for customer_id: ${customerId}`);
        }
        const applicantId = applicantResult.rows[0].id;

        // Step 5: Save the report
        await saveReport(applicantId, affordability_score, verified_income_monthly, verified_expenses_monthly, { transactions: allTransactions });

    } catch (error) {
        console.error('Error in processSaltEdgeData:', error.response ? error.response.data : error.message);
    }
};
