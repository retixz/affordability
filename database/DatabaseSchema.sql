-- Table for our business clients (landlords)
CREATE TABLE landlords (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    usage_limit INTEGER DEFAULT 5, -- Default to starter plan's limit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50)
);

-- Table for the rental applicants being checked
CREATE TABLE applicants (
    id SERIAL PRIMARY KEY,
    landlord_id INTEGER REFERENCES landlords(id),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    secure_link_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- e.g., pending, complete, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    saltedge_customer_id VARCHAR(255),
    saltedge_connection_id VARCHAR(255),
    saltedge_connect_url TEXT
);

-- Table to store the results of the affordability checks
CREATE TABLE affordability_reports (
    id SERIAL PRIMARY KEY,
    applicant_id INTEGER REFERENCES applicants(id),
    affordability_score NUMERIC(4, 2), -- The final score [cite: 62]
    verified_income_monthly NUMERIC(10, 2),
    verified_expenses_monthly NUMERIC(10, 2),
    income_stability_score NUMERIC(5, 2),
    enhanced_dti_ratio NUMERIC(5, 2),
    flags JSONB,
    report_data JSONB, -- To store the raw categorized data from the aggregator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create usage_records Table: This table is essential for tracking monthly usage.
CREATE TABLE usage_records (
    id SERIAL PRIMARY KEY,
    landlord_id INTEGER REFERENCES landlords(id),
    check_count INTEGER DEFAULT 0,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    UNIQUE (landlord_id, month, year)
);