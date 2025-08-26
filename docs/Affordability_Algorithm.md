# Affordability Algorithm v2.0

## Overview

The Affordability Algorithm v2.0 represents a significant architectural shift from the initial version. The V1 algorithm relied on a basic keyword search of transaction descriptions, which proved to be unreliable for production use due to the variance in transaction descriptions and languages.

Version 2.0 has been completely rebuilt to leverage the standardized transaction categorization provided by the Tink API. This provides a much more accurate and robust foundation for assessing an applicant's financial stability.

## Core Logic: Category-Based Analysis

Instead of searching for keywords like "salary" or "rent", the V2 algorithm analyzes transactions based on their assigned `categoryCode` from Tink.

### Income Categories

The following Tink category codes are defined as stable sources of income:

- `income:salary`
- `income:government-benefits`
- `income:pension`

### Expense Categories

The following Tink category codes are defined as essential, recurring expenses:

- `expenses:rent`
- `expenses:mortgage`
- `expenses:utilities`
- `expenses:insurance`
- `expenses:loan-repayment`
- `expenses:childcare`

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
