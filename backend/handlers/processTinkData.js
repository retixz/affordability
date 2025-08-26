'use strict';

const db = require('../utils/db');

// Helper function to handle database interaction
async function saveReport(applicantId, score, income, expenses, rawData) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const reportQuery = `
      INSERT INTO affordability_reports (applicant_id, affordability_score, verified_income_monthly, verified_expenses_monthly, report_data)
      VALUES ($1, $2, $3, $4, $5)
    `;
    // Ensure rawData is correctly structured for the JSONB column
    const reportData = rawData ? { rawTinkData: rawData } : null;
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Analysis and database update complete",
        applicantId,
        affordability_score: score
      }),
    };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database transaction failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error during database operation.' }),
    };
  } finally {
    client.release();
  }
}


module.exports.processTinkData = async (event) => {
  const { applicantId, transactions, rawTinkData } = event;

  // V2 - Refactored Data Analysis Logic
  const incomeCategoryCodes = [
    'income:salary',
    'income:government-benefits',
    'income:pension'
  ];
  const expenseCategoryCodes = [
    'expenses:rent',
    'expenses:mortgage',
    'expenses:utilities',
    'expenses:insurance',
    'expenses:loan-repayment',
    'expenses:childcare'
  ];

  // --- Stability Analysis ---

  if (!transactions || transactions.length === 0) {
    // If there are no transactions, save a report with a score of 0.
    return saveReport(applicantId, 0, 0, 0, rawTinkData);
  }

  // Find the most recent transaction date to establish the 3-month window
  // Ensure we filter out any invalid date values before using Math.max
  const validDates = transactions.map(t => new Date(t.dates?.booked)).filter(d => !isNaN(d));
  if (validDates.length === 0) {
      return saveReport(applicantId, 0, 0, 0, rawTinkData);
  }
  const mostRecentDate = new Date(Math.max.apply(null, validDates));

  const threeMonths = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(mostRecentDate);
    d.setMonth(d.getMonth() - i);
    // Use slice to get YYYY-MM format
    threeMonths.push(d.toISOString().slice(0, 7));
  }

  const categoryMonthlyPresence = {};

  for (const transaction of transactions) {
    // Use optional chaining for safety
    const categoryId = transaction.categoryCode;
    const transactionDate = transaction.dates?.booked;

    if (categoryId && transactionDate && (incomeCategoryCodes.includes(categoryId) || expenseCategoryCodes.includes(categoryId))) {
      const transactionMonth = new Date(transactionDate).toISOString().slice(0, 7); // YYYY-MM

      if (!categoryMonthlyPresence[categoryId]) {
        categoryMonthlyPresence[categoryId] = new Set();
      }
      categoryMonthlyPresence[categoryId].add(transactionMonth);
    }
  }

  const stableCategoryCodes = new Set();
  for (const categoryId in categoryMonthlyPresence) {
    const months = Array.from(categoryMonthlyPresence[categoryId]);
    // Check for presence in the calculated three-month window
    const recentMonthsCount = months.filter(m => threeMonths.includes(m)).length;

    if (recentMonthsCount >= 2) {
      stableCategoryCodes.add(categoryId);
    }
  }

  // --- Calculate Totals from Stable Categories ---
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const transaction of transactions) {
    const categoryId = transaction.categoryCode;
    const transactionDate = transaction.dates?.booked;

    if (!categoryId || !transactionDate) continue;

    const transactionMonth = new Date(transactionDate).toISOString().slice(0, 7); // YYYY-MM

    // Only include transactions from the last 3 months and from stable categories
    if (threeMonths.includes(transactionMonth) && stableCategoryCodes.has(categoryId)) {
      const amount = transaction.amount?.value;

      if (typeof amount !== 'number') continue;

      if (incomeCategoryCodes.includes(categoryId)) {
        totalIncome += amount;
      } else if (expenseCategoryCodes.includes(categoryId)) {
        // Expenses from Tink are typically negative values
        totalExpenses += Math.abs(amount);
      }
    }
  }

  // Calculate monthly averages
  const verified_income_monthly = totalIncome / 3;
  const verified_expenses_monthly = totalExpenses / 3;

  // --- Calculate Affordability Score (same logic as before) ---
  let affordability_score;
  if (verified_income_monthly <= 0) {
    affordability_score = 0.00;
  } else {
    const disposable_ratio = (verified_income_monthly - verified_expenses_monthly) / verified_income_monthly;
    affordability_score = disposable_ratio * 10;
  }

  affordability_score = Math.max(0, Math.min(10, affordability_score));
  affordability_score = parseFloat(affordability_score.toFixed(2));

  // --- Save Report ---
  return saveReport(applicantId, affordability_score, verified_income_monthly, verified_expenses_monthly, rawTinkData);
};
