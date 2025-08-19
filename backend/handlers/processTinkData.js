'use strict';

const db = require('../db');

module.exports.processTinkData = async (event) => {
  const { applicantId, transactions, rawTinkData } = event;

  // Version 1: Data Analysis Logic
  const incomeKeywords = ["salary", "wages", "payroll", "deposit", "income"];
  const expenseKeywords = ["rent", "utility", "loan", "payment", "debit", "purchase"];

  let totalIncome = 0;
  let totalExpenses = 0;

  // Assuming 'transactions' is an array of transaction objects
  for (const transaction of transactions) {
    const description = (transaction.description || '').toLowerCase();
    // Assuming the amount is a simple number, positive for income, negative for expenses
    const amount = transaction.amount;

    if (amount > 0 && incomeKeywords.some(keyword => description.includes(keyword))) {
      totalIncome += amount;
    }

    if (amount < 0 && expenseKeywords.some(keyword => description.includes(keyword))) {
      totalExpenses += Math.abs(amount);
    }
  }

  // Calculate monthly averages, assuming a 90-day period for the data
  const verified_income_monthly = totalIncome / 3;
  const verified_expenses_monthly = totalExpenses / 3;

  // Calculate Affordability Score
  let affordability_score;

  if (verified_income_monthly <= 0) {
    affordability_score = 0.00;
  } else {
    const disposable_ratio = (verified_income_monthly - verified_expenses_monthly) / verified_income_monthly;
    affordability_score = disposable_ratio * 10;
  }

  // Clamp the score between 0.00 and 10.00
  affordability_score = Math.max(0, Math.min(10, affordability_score));

  // Round to two decimal places
  affordability_score = parseFloat(affordability_score.toFixed(2));

  let client;
  try {
    client = await db.getClient();
    await client.query('BEGIN');

    // Insert the report
    const reportQuery = `
      INSERT INTO affordability_reports (applicant_id, affordability_score, verified_income_monthly, verified_expenses_monthly, report_data)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const reportValues = [applicantId, affordability_score, verified_income_monthly, verified_expenses_monthly, { rawTinkData }];
    await client.query(reportQuery, reportValues);

    // Update the applicant's status
    const updateQuery = `
      UPDATE applicants
      SET status = 'complete'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [applicantId]);

    await client.query('COMMIT');

    console.log(`Successfully saved report and updated status for applicant ${applicantId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Analysis and database update complete",
        applicantId,
        affordability_score
      }),
    };

  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Database transaction failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error during database operation.' }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
