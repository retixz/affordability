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

### `applicants`

Stores information about the rental applicants who are undergoing an affordability check.

| Column              | Type                      | Description                                                                 |
| ------------------- | ------------------------- | --------------------------------------------------------------------------- |
| `id`                | `SERIAL PRIMARY KEY`      | Unique identifier for each applicant.                                       |
| `landlord_id`       | `INTEGER`                 | A foreign key that links to the `landlords.id` who initiated the check.     |
| `full_name`         | `VARCHAR(255)`            | The full name of the applicant.                                             |
| `email`             | `VARCHAR(255)`            | The email address of the applicant.                                         |
| `secure_link_token` | `VARCHAR(255) UNIQUE`     | A single-use, cryptographically secure token sent to the applicant.         |
| `status`            | `VARCHAR(50)`             | The current status of the check (e.g., `pending`, `in_progress`, `complete`, `expired`). |
| `created_at`        | `TIMESTAMP WITH TIME ZONE`| Timestamp of when the applicant record was created.                         |

### `affordability_reports`

Stores the results of the affordability checks.

| Column                      | Type                      | Description                                                              |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------ |
| `id`                        | `SERIAL PRIMARY KEY`      | Unique identifier for each report.                                       |
| `applicant_id`              | `INTEGER`                 | A foreign key that links to the `applicants.id` this report belongs to.  |
| `affordability_score`       | `NUMERIC(4, 2)`           | The final calculated affordability score, from 0.00 to 10.00.            |
| `verified_income_monthly`   | `NUMERIC(10, 2)`          | The applicant's verified average monthly income.                         |
| `verified_expenses_monthly` | `NUMERIC(10, 2)`          | The applicant's verified average monthly recurring expenses.             |
| `report_data`               | `JSONB`                   | The raw, categorized data from the bank data aggregator (e.g., Tink).    |
| `created_at`                | `TIMESTAMP WITH TIME ZONE`| Timestamp of when the report was generated.                              |

## Relationships

-   A `landlord` can have many `applicants`. (`landlords.id` -> `applicants.landlord_id`)
-   An `applicant` has one `affordability_report`. (`applicants.id` -> `affordability_reports.applicant_id`)
