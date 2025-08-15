# Affordability API

Affordability API is a B2B micro-SaaS designed to provide real-time income and expense verification for niche lenders and property managers. It leverages Open Banking APIs to offer a fast, secure, and modern alternative to traditional credit scoring, answering the critical question: "Can this applicant afford the monthly payments right now?"

---

## Tech Stack

This project is a monorepo containing two main packages:

* **Frontend:** A React single-page application that provides the user interface for our clients (landlords) and their applicants.
* **Backend:** A serverless API built with Node.js and the Serverless Framework, running on AWS Lambda.
* **Database:** PostgreSQL, chosen for its reliability and robust support for JSONB data types.

---

## Getting Started: Local Development

Follow these instructions to get the entire application running on your local machine for development and testing purposes.

### 1. Prerequisites

Ensure you have the following tools installed on your system:

* **Node.js & npm:** [Download here](https://nodejs.org/)
* **Docker:** [Download here](https://www.docker.com/products/docker-desktop) (for running the database)
* **AWS CLI:** [Installation Guide](https://aws.amazon.com/cli/)
* **Serverless Framework:** `npm install -g serverless`

### 2. Database Setup

We use Docker to run a local PostgreSQL instance.

1.  **Start the PostgreSQL container:**
    ```bash
    docker run --name affordability-db -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
    ```
    *This command will start a PostgreSQL server on `localhost:5432` with the password `mysecretpassword`.*

2.  **Create the Database Schema:**
    * Using a database client of your choice (DBeaver, TablePlus, etc.), connect to the local PostgreSQL instance.
    * Execute the contents of the `Database_Schema.sql` file to create the necessary tables.

### 3. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create environment file:**
    Create a file named `.env` in the `backend` directory. This file will hold your local secrets and should **not** be committed to Git.
    ```
    # backend/.env

    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=mysecretpassword
    DB_NAME=postgres

    # Add other secrets like Tink API keys here later
    ```

4.  **Run the local server:**
    The Serverless Framework has a plugin to simulate the API Gateway and Lambda environment locally.
    ```bash
    serverless offline start
    ```
    *Your backend API should now be running at `http://localhost:3000`.*

### 4. Frontend Setup

1.  **Navigate to the frontend directory (from the root):**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm start
    ```
    *The React application will open and run at `http://localhost:3001` (or another available port).*

---

## Deployment

The frontend can be deployed to any static hosting provider (AWS S3, Vercel, Netlify). The backend is designed for serverless deployment to AWS.

To deploy the backend:

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Deploy the service:**
    Ensure your AWS credentials are configured correctly, then run:
    ```bash
    serverless deploy
    ```