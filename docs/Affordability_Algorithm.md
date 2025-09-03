# Affordability Algorithm v4.0 - Advanced Behavioral Analytics

## Overview

Version 4.0 builds upon the foundational metrics of income and debt by introducing a layer of advanced behavioral analysis. This version analyzes raw transaction data from Salt Edge to understand an applicant's financial habits, providing a more holistic view of their financial health. It introduces three key metrics: Behavioral Savings Rate, Financial Cushion, and a unified `flags` system.

### Behavioral Savings Rate

This metric calculates the percentage of net income that an applicant proactively saves. It identifies recurring outbound transfers that occur shortly after primary income deposits, indicating a disciplined savings habit.

-   **Logic**: A transaction is considered a "savings" action if it is a recurring outbound transfer within 3 days of a primary income deposit.
-   **Formula**: `(total_monthly_savings / average_net_monthly_income) * 100`

### Financial Cushion

This metric estimates an applicant's financial resilience by calculating how many months of essential expenses their stable cash buffer could cover.

-   **Monthly Burn Rate**: Calculated by summing the monthly average of essential, non-discretionary expenses (e.g., rent, utilities, groceries).
-   **Baseline Buffer**: The average end-of-month balance of all current accounts over the last 6 months.
-   **Formula**: `baseline_buffer / monthly_burn_rate`

### Financial Health Flags

This system scans for and flags specific financial behaviors, categorized as 'red' for risks and 'green' for positive indicators. These are stored in the `flags` array.

-   **Green Flags**:
    -   `CONSISTENT_SAVINGS`: Generated if the `behavioral_savings_rate` is greater than 10%.
-   **Red Flags (High Severity)**:
    -   `PAYDAY_LOAN_USAGE`: Use of known payday lenders.
    -   `HIGH_GAMBLING_SPEND`: Gambling spend exceeding 10% of net monthly income in any month.
-   **Red Flags (Medium Severity)**:
    -   `FREQUENT_OVERDRAFTS`: More than two overdraft-related events in the last 3 months.

---

# Affordability Algorithm v3.0

## Overview

The Affordability Algorithm v3.0 is the latest iteration, designed for maximum reliability, speed, and maintainability. This version moves away from manual transaction processing (V1 and V2) and instead consumes standardized, pre-processed reports from Tink's **Income Check** and **Expense Check** products.

This new approach eliminates the complexity and potential inaccuracies of analyzing raw transaction data. Instead, we rely on Tink's purpose-built engines to verify income and categorize expenses, resulting in a more robust and trustworthy assessment.

## Core Logic: Report-Based Analysis

The V3 algorithm directly ingests two key reports:

1.  **Tink Income Check Report**: A JSON report containing verified income sources, amounts, and stability assessments.
2.  **Tink Expense Check Report**: A JSON report containing a detailed breakdown of expenses, categorized by Tink's engine.

### Key Data Points

The algorithm extracts the following top-level figures from the reports:

-   **Total Verified Monthly Income**: Sourced from the Income Check report (`report.income.summary.total.amount`). This represents the net monthly income that Tink has verified with high confidence.
-   **Total Monthly Expenses**: Sourced from the Expense Check report (`report.expense.summary.totalExpenses.amount`). This represents the sum of all categorized recurring and non-recurring expenses.

## Score Calculation

The scoring formula remains consistent with previous versions to ensure continuity in assessment, but it is now calculated using the highly reliable, pre-processed totals from the Tink reports.

1.  **Define Inputs**:
    - `verified_income_monthly` = The total verified monthly income from the Income Check report.
    - `verified_expenses_monthly` = The total monthly expenses from the Expense Check report.

2.  **Calculate Disposable Income Ratio**:
    - `disposable_ratio` = (`verified_income_monthly` - `verified_expenses_monthly`) / `verified_income_monthly`

3.  **Final Score**:
    - `affordability_score` = `disposable_ratio` * 10

The score is clamped to a range of **0.00 to 10.00**. A higher score indicates a greater ability for the applicant to comfortably cover their expenses.

---

<details>
<summary>Archived: Algorithm v2.0</summary>

## Overview

The Affordability Algorithm v2.0 represents a significant architectural shift from the initial version. The V1 algorithm relied on a basic keyword search of transaction descriptions, which proved to be unreliable for production use due to the variance in transaction descriptions and languages.

Version 2.0 has been completely rebuilt to leverage the standardized transaction categorization provided by the Salt Edge API. This provides a much more accurate and robust foundation for assessing an applicant's financial stability.

## Core Logic: Category-Based Analysis

Instead of searching for keywords like "salary" or "rent", the V2 algorithm analyzes transactions based on their assigned `category` from Salt Edge.

### Income Categories

The following Salt Edge categories are defined as stable sources of income:

- `Salary`
- `Government Benefits`
- `Pension`

*(Note: These are initial placeholder categories and may be subject to change based on the most common categories returned by the Salt Edge API for the target market.)*

### Expense Categories

The following Salt Edge categories are defined as essential, recurring expenses:

- `Rent`
- `Mortgage`
- `Utilities`
- `Insurance`
- `Loan Repayment`
- `Childcare`

*(Note: These are initial placeholder categories and may be subject to change.)*

## Key Feature: Stability Analysis

A major improvement in V2 is the introduction of a stability check. Financial stability is best measured by recurring patterns, not one-off events. The algorithm filters out one-time windfalls (e.g., a large gift) or unusual, large purchases to get a clearer picture of an applicant's typical monthly cash flow.

The stability logic is as follows:
1.  **Identify Time Window**: The algorithm first determines the most recent transaction date and establishes a 3-month period leading up to that date.
2.  **Track Monthly Presence**: It then scans all transactions and tracks in which of the three months each income or expense category appears.
3.  **Filter for Stability**: A category is deemed "stable" only if transactions belonging to it appear in **at least two of the last three months**.
4.  **Calculate Totals**: The final calculation only sums the amounts from transactions that belong to these stable categories and fall within the 3-month window.

## Score Calculation

The final affordability score is calculated using the same formula as V1, but is now fed with much higher-quality, verified data.

1.  **Calculate Monthly Averages**:
    - `verified_income_monthly` = (Total stable income over 3 months) / 3
    - `verified_expenses_monthly` = (Total stable expenses over 3 months) / 3

2.  **Calculate Disposable Income Ratio**:
    - `disposable_ratio` = (`verified_income_monthly` - `verified_expenses_monthly`) / `verified_income_monthly`

3.  **Final Score**:
    - `affordability_score` = `disposable_ratio` * 10

The score is clamped to be within a range of 0.00 to 10.00. A higher score indicates a greater ability to comfortably cover expenses.

</details>
