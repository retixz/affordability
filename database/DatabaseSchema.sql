-- Table for our business clients (landlords)
CREATE TABLE landlords (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for the rental applicants being checked
CREATE TABLE applicants (
    id SERIAL PRIMARY KEY,
    landlord_id INTEGER REFERENCES landlords(id),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    secure_link_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- e.g., pending, complete, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to store the results of the affordability checks
CREATE TABLE affordability_reports (
    id SERIAL PRIMARY KEY,
    applicant_id INTEGER REFERENCES applicants(id),
    affordability_score NUMERIC(4, 2), -- The final score [cite: 62]
    verified_income_monthly NUMERIC(10, 2),
    verified_expenses_monthly NUMERIC(10, 2),
    report_data JSONB, -- To store the raw categorized data from the aggregator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);