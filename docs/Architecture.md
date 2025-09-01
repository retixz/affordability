# **System Architecture: Affordability API**

This document provides a high-level overview of the technical architecture for the Affordability API. The system is designed as a modern, decoupled web application that prioritizes security, scalability, and low operational cost.

## **Core Components**

The application is composed of four primary components:

1. **Frontend (Client Tier):** A **React Single-Page Application (SPA)** that serves as the user interface for both landlords and their applicants. It is responsible for all rendering and user interaction. It is a "dumb" client in that it contains no sensitive business logic.  
2. **Backend (Application Tier):** A **serverless API built with Node.js and the Serverless Framework**, running on **AWS Lambda**. This is the core of the application, handling all business logic, data processing, authentication, and communication with external services. Each function is an independent, stateless unit.  
3. **Database (Data Tier):** A managed **PostgreSQL** instance. This serves as our single source of truth, securely storing all application data, including user accounts, applicant information, and the final affordability reports.  
4. **External Services (Third-Party Tier):** We integrate with two critical third-party services:  
   * **Salt Edge:** Our licensed Open Banking aggregator, used to securely connect to applicants' bank accounts and retrieve financial data. The integration uses **Salt Edge API V6**.
   * **Stripe:** Our payment gateway, used to manage all aspects of landlord subscriptions and billing.

## **High-Level Data Flow Diagram**

The following diagram illustrates the key interactions between the system's components during the most critical user flows.

graph TD  
    subgraph User Browser  
        A\[React Frontend App\]  
    end

    subgraph AWS Cloud  
        B\[API Gateway\]  
        C\[Lambda Functions\]  
        D\[PostgreSQL Database\]  
    end

    subgraph Third Parties  
        E\[Salt Edge API\]
        F\[Stripe API\]  
    end

    A \-- HTTPS API Calls \--\> B  
    B \-- Invokes \--\> C  
    C \-- CRUD Operations \--\> D  
    C \-- API Calls \--\> E  
    C \-- API Calls \--\> F  
    E \-- Webhook \--\> B
    F \-- Webhook \--\> B

    style A fill:\#cde4ff  
    style E fill:\#ffdfba  
    style F fill:\#d2ffd2

### **Key User Flows:**

* **Landlord Registration/Login:** The **React App** sends credentials to the **API Gateway**, which triggers an authentication **Lambda Function**. This function hashes/compares the password and interacts with the **PostgreSQL Database** to create or verify the user, returning a JWT to the client.  
* **Creating a Check:** An authenticated landlord on the **React App** submits applicant details. The request hits a protected endpoint on the **API Gateway**, which invokes a **Lambda Function**. This function calls the **Salt Edge API** to create a customer and a connect session, then saves the applicant's details and the Salt Edge data to the **Database**. It returns a secure link to the frontend.
* **Applicant Data Connection:** The applicant, using the **React App**, is redirected to the Salt Edge Connect widget. Upon successful connection, Salt Edge sends a **Webhook** to our backend. A **Lambda Function** then securely fetches the raw transaction data from the **Salt Edge API**.
* **Subscription Payment:** The landlord selects a plan on the **React App**. The backend **Lambda Function** creates a checkout session with the **Stripe API**. After the user pays on Stripe's hosted page, Stripe sends a **Webhook** to a dedicated endpoint on our **API Gateway**. A **Lambda Function** processes this webhook, verifies it, and updates the landlord's subscription status in the **Database**.