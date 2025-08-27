# Affordability API

Affordability API is a B2B micro-SaaS designed to provide real-time income and expense verification for niche lenders and property managers. It leverages Open Banking APIs to offer a fast, secure, and modern alternative to traditional credit scoring, answering the critical question: "Can this applicant afford the monthly payments right now?"

---

## Tech Stack

This project is a monorepo containing two main packages orchestrated by a root `package.json` file:

* **Frontend:** A React single-page application.
* **Backend:** A serverless API built with Node.js and the Serverless Framework.
* **Database:** PostgreSQL, run via Docker for local development.

---

## Getting Started: The Streamlined Local Development Workflow

This project is configured for a simple, one-command startup process.

### Step 1: First-Time Setup

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/retixz/affordability.git]
    cd affordability-api
    ```

2.  **Configure Environment Variables:**
    This project uses `.env` files for environment-specific configuration. Example files are provided in both the `backend` and `frontend` directories. **These `.env` files are included in `.gitignore` and should never be committed to version control.**

    *   **Backend:** Copy `backend/.env.example` to `backend/.env`.
        ```bash
        cp backend/.env.example backend/.env
        ```
        Then, fill in the required values in `backend/.env`. The `FRONTEND_URL` should be set to `http://localhost:3000` for local development. You will also need to provide your `SALTEDGE_APP_ID`, `SALTEDGE_SECRET`, `SALTEDGE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET`.

    *   **Frontend:** Copy `frontend/.env.example` to `frontend/.env`.
        ```bash
        cp frontend/.env.example frontend/.env
        ```
        Then, fill in the required `REACT_APP_STRIPE_PUBLIC_KEY` in `frontend/.env`.

3.  **Install All Dependencies:**
    From the **root directory** of the project, run:
    ```bash
    npm install
    ```
    *This single command will install the root dependencies and automatically trigger the installation for both the `backend` and `frontend` workspaces.*

4.  **Seed the Database:**
    * The application requires at least one landlord to exist for testing. First, ensure Docker is running. Then, start the database container manually for the first time to apply the schema.
    ```bash
    # In the root directory, start the database
    npm run start:db
    ```
    * Connect to the database (running on `localhost:5432`) with any SQL client and execute the contents of `Database_Schema.sql`.
    * Then, run the following command to create a test landlord:
    ```sql
    INSERT INTO landlords (id, email, company_name, password_hash) VALUES (1, 'test@landlord.com', 'Test Properties Inc.', 'some_dummy_hash');
    ```

### Step 2: Daily Development

1.  **Start the Entire Environment:**
    From the **root directory**, run the single command:
    ```bash
    npm run dev
    ```
    *This will concurrently start the database container, the backend serverless API, and the frontend React app. You will see the logs for all services in one terminal.*

2.  **Stop Everything:**
    Press `Ctrl + C` in the terminal where `npm run dev` is running to stop all services.

---

## End-to-End Testing with Payments & Webhooks
To test the complete user subscription flow, you need to simulate Stripe sending webhook events to your local server. This requires the Stripe CLI.

### 1. First-Time Setup for Testing
**Install Stripe CLI:** Follow the [official guide](https://stripe.com/docs/stripe-cli) to install the Stripe CLI for your operating system.

**Login to Stripe:** Connect the CLI to your Stripe account by running:
```bash
stripe login
```

### 2. Running the Test Environment
You will need two separate terminals running simultaneously.

**Terminal 1: Start the Application**

In the project's root directory, run the standard development command:
```bash
npm run dev
```
This will start the database, backend API, and frontend application.

**Terminal 2: Start the Webhook Forwarding**

In the project's root directory, run the new webhook command:
```bash
npm run start:webhooks
```
When this command runs for the first time, Stripe will provide a webhook signing secret (it looks like `whsec_...`). You must copy this secret.

Add the secret to your `backend/.env` file:
```
# backend/.env
STRIPE_WEBHOOK_SECRET=whsec_...
```
**Important:** You must restart your main application (Terminal 1) after adding the secret for it to be loaded.

You are now ready to perform a full end-to-end test. When you complete a test payment in the frontend, you will see the event logs appear in Terminal 2.

---

## Project Documentation

This project includes detailed documentation to assist developers and stakeholders. All documentation is located in the `/docs` directory.

- **[ADR-001: Technology Stack Selection](./docs/ADR-001_Tech_Stack.md):** An Architectural Decision Record explaining the choices for the frontend, backend, and database technologies.
- **[Database Schema](./docs/Database_Schema.md):** A detailed description of the PostgreSQL database schema, including table structures and relationships.
- **[API Endpoints](./docs/API_Endpoints.md):** Comprehensive documentation for all available API endpoints.

---

## Deployment

To deploy the backend to your configured AWS account:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Deploy the service:**
    ```bash
    serverless deploy
    ```