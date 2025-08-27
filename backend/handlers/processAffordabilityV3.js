'use strict';

const db = require('../utils/db');

async function saveV3Report(applicantId, score, income, expenses, incomeReport, expenseReport) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const reportQuery = `
      INSERT INTO affordability_reports (applicant_id, affordability_score, verified_income_monthly, verified_expenses_monthly, report_data)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const reportData = { incomeReport, expenseReport };
    const reportValues = [applicantId, score, income, expenses, reportData];
    await client.query(reportQuery, reportValues);

    const updateQuery = `
      UPDATE applicants
      SET status = 'complete'
      WHERE id = $1;
    `;
    await client.query(updateQuery, [applicantId]);

    await client.query('COMMIT');
    console.log(`Successfully saved V3 report and updated status for applicant ${applicantId}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database transaction failed for V3 report:', error);
    // This function is async, so we don't return a http response here. We let the caller handle errors.
    throw error;
  } finally {
    client.release();
  }
}

module.exports.processAffordabilityV3 = async (event) => {
  const { applicantId, incomeReport, expenseReport } = event;

  if (!incomeReport || !expenseReport) {
    console.error(`Missing income or expense report for applicantId: ${applicantId}`);
    // Save a report with a score of 0 if data is missing.
    return saveV3Report(applicantId, 0, 0, 0, incomeReport || {}, expenseReport || {});
  }

  // Extracting total verified monthly income.
  // Path: report.income.summary.total.amount
  const verified_income_monthly = incomeReport.income?.summary?.total?.amount || 0;

  // Extracting total monthly expenses.
  // Path: report.expense.summary.totalExpenses.amount
  const verified_expenses_monthly = expenseReport.expense?.summary?.totalExpenses?.amount || 0;

  // --- Calculate Affordability Score ---
  let affordability_score;
  if (verified_income_monthly <= 0) {
    affordability_score = 0.00;
  } else {
    // The original formula was (income - expenses) / income, which gives a ratio.
    // The previous implementation multiplied this ratio by 10 to get a score from 0-10.
    // We will continue with that logic.
    const disposable_ratio = (verified_income_monthly - verified_expenses_monthly) / verified_income_monthly;
    affordability_score = disposable_ratio * 10;
  }

  affordability_score = Math.max(0, Math.min(10, affordability_score));
  affordability_score = parseFloat(affordability_score.toFixed(2));

  // --- Save Report ---
  return saveV3Report(
    applicantId,
    affordability_score,
    verified_income_monthly,
    verified_expenses_monthly,
    incomeReport,
    expenseReport
  );
};
