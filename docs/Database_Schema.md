# Database Schema

This document outlines the structure of the PostgreSQL database used by the Affordability API.

## Tables

### `landlords`

Stores information about our business clients (the landlords).

| Column              | Type                      | Description                                                 |
| ------------------- | ------------------------- | ----------------------------------------------------------- |
| `id`                | `SERIAL PRIMARY KEY`      | Unique identifier for each landlord.                        |
| `email`             | `VARCHAR(255) UNIQUE`     | The landlord's login email address.                         |
| `company_name`      | `VARCHAR(255)`            | The name of the landlord's company or business.             |
| `password_hash`     | `VARCHAR(255)`            | The hashed password for the landlord's account.             |
| `subscription_plan` | `VARCHAR(50)`             | The subscription plan the landlord is on (e.g., 'starter'). |
| `created_at`        | `TIMESTAMP WITH TIME ZONE`| Timestamp of when the landlord account was created.         |
| `stripe_customer_id`| `VARCHAR(255)`            | The landlord's Stripe Customer ID.                          |
| `stripe_subscription_id`| `VARCHAR(255)`        | The landlord's Stripe Subscription ID.                      |
| `subscription_status`| `VARCHAR(50)`            | The status of the landlord's subscription (e.g. 'active', 'canceled', 'past_due'). |

### `applicants`

Stores information about the rental applicants who are undergoing an affordability check.

| Column                   | Type                      | Description                                                                 |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------- |
| `id`                     | `SERIAL PRIMARY KEY`      | Unique identifier for each applicant.                                       |
| `landlord_id`            | `INTEGER`                 | A foreign key that links to the `landlords.id` who initiated the check.     |
| `full_name`              | `VARCHAR(255)`            | The full name of the applicant.                                             |
| `email`                  | `VARCHAR(255)`            | The email address of the applicant.                                         |
| `secure_link_token`      | `VARCHAR(255) UNIQUE`     | A single-use, cryptographically secure token sent to the applicant.         |
| `status`                 | `VARCHAR(50)`             | The current status of the check (e.g., `pending`, `in_progress`, `complete`, `expired`). |
| `created_at`             | `TIMESTAMP WITH TIME ZONE`| Timestamp of when the applicant record was created.                         |
| `saltedge_customer_id`   | `VARCHAR(255)`            | The customer ID from Salt Edge.                                             |
| `saltedge_connection_id` | `VARCHAR(255)`            | The connection ID from Salt Edge.                                           |
| `saltedge_connect_url`   | `TEXT`                    | The Salt Edge Connect URL.                                                  |

### `affordability_reports`

Stores the results of the affordability checks.

| Column                      | Type                      | Description                                                              |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| `id`                        | `SERIAL PRIMARY KEY`      | Unique identifier for each report.                                       |
| `applicant_id`              | `INTEGER`                 | A foreign key that links to the `applicants.id` this report belongs to.  |
| `affordability_score`       | `NUMERIC(4, 2)`           | The final calculated affordability score, from 0.00 to 10.00.            |
| `verified_income_monthly`   | `NUMERIC(10, 2)`          | The applicant's verified average monthly income.                         |
| `verified_expenses_monthly` | `NUMERIC(10, 2)`          | The applicant's verified average monthly recurring expenses.             |
| `income_stability_score`    | `NUMERIC(5, 2)`           | A 0-100 score indicating the stability of the applicant's income.        |
| `enhanced_dti_ratio`        | `NUMERIC(5, 2)`           | A transaction-verified debt-to-income ratio as a percentage.             |
| `behavioral_savings_rate`   | `NUMERIC(5, 2)`           | The percentage of net income the applicant saves, as a percentage.       |
| `financial_cushion_months`  | `NUMERIC(5, 2)`           | How many months of essential expenses the applicant's buffer can cover.  |
| `flags`                     | `JSONB`                   | An array of objects detailing positive (green) or negative (red) financial behaviors. |
| `report_data`               | `JSONB`                   | The raw, categorized data from the bank data aggregator (e.g., Salt Edge).|
| `created_at`                | `TIMESTAMP WITH TIME ZONE`| Timestamp of when the report was generated.                              |

### `usage_records`

This table is essential for tracking monthly usage of the affordability check service.

| Column        | Type                 | Description                                                                 |
|---------------|----------------------|-----------------------------------------------------------------------------|
| `id`          | `SERIAL PRIMARY KEY` | Unique identifier for each usage record.                                    |
| `landlord_id` | `INTEGER`            | A foreign key that links to the `landlords.id`.                             |
| `check_count` | `INTEGER`            | The number of checks performed by the landlord in the given month/year.     |
| `month`       | `INTEGER`            | The month of the usage record (1-12).                                       |
| `year`        | `INTEGER`            | The year of the usage record.                                               |

## Relationships

-   A `landlord` can have many `applicants`. (`landlords.id` -> `applicants.landlord_id`)
-   An `applicant` has one `affordability_report`. (`applicants.id` -> `affordability_reports.applicant_id`)
-   A `landlord` has many `usage_records`. (`landlords.id` -> `usage_records.landlord_id`)
