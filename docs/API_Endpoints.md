# API Endpoints

This document provides details on the available API endpoints for the Affordability API.

---

### 1. Initiate a New Affordability Check

-   **Method & Path:** `POST /checks`
-   **Purpose:** Initiates a new affordability check for an applicant. It generates a unique, secure link that can be sent to the applicant to begin the process.
-   **Request Body:**
    ```json
    {
      "fullName": "string",
      "email": "string"
    }
    ```
-   **Success Response:**
    -   **Code:** `201 Created`
    -   **Body:**
        ```json
        {
          "secureLink": "string"
        }
        ```
-   **Error Responses:**
    -   `400 Bad Request`: If `fullName` or `email` is missing or invalid.

---

### 2. Validate Secure Link

-   **Method & Path:** `GET /checks/{token}`
-   **Purpose:** Called by the frontend applicant portal to validate the secure link token. It returns the applicant's name and the landlord's company name to display on the portal.
-   **URL Parameters:**
    -   `token`: The secure link token from the URL.
-   **Success Response:**
    -   **Code:** `200 OK`
    -   **Body:**
        ```json
        {
          "full_name": "string",
          "company_name": "string"
        }
        ```
-   **Error Responses:**
    -   `404 Not Found`: If the token is invalid, has expired, or has already been used.

---

### 3. Get Affordability Report

-   **Method & Path:** `GET /reports/{applicantId}`
-   **Purpose:** Retrieves the completed affordability report for a specific applicant. This is used by the landlord dashboard to display the results.
-   **URL Parameters:**
    -   `applicantId`: The unique ID of the applicant.
-   **Success Response:**
    -   **Code:** `200 OK`
    -   **Body:**
        ```json
        {
          "full_name": "string",
          "affordability_score": "number",
          "verified_income_monthly": "number",
          "verified_expenses_monthly": "number"
        }
        ```
-   **Error Responses:**
    -   `404 Not Found`: If no report is found for the given `applicantId`.

---

### 4. Handle Bank Data Callback

-   **Method & Path:** `GET /callback/tink`
-   **Purpose:** This is the redirect URI that the bank data aggregator (Tink) calls after the user has successfully authenticated. It handles the exchange of the authorization code for an access token and queues the data processing. The user is then redirected to a success page.
-   **Query Parameters:**
    -   `code`: The authorization code from the aggregator.
    -   `state`: The original `secure_link_token` for the applicant.
-   **Success Response:**
    -   **Code:** `302 Found` (Redirect)
    -   **Headers:** `Location: https://<your-portal-domain>/check/success`
-   **Error Responses:**
    -   `400 Bad Request`: If the `code` is missing.
    -   `500 Internal Server Error`: For failures during the token exchange or data fetching process.

---

### 5. Create Stripe Checkout Session

-   **Method & Path:** `POST /create-checkout-session`
-   **Purpose:** Creates a new Stripe Checkout session for a landlord to subscribe to a plan.
-   **Authentication:** Required (Bearer Token).
-   **Request Body:**
    ```json
    {
      "priceId": "string"
    }
    ```
-   **Success Response:**
    -   **Code:** `200 OK`
    -   **Body:**
        ```json
        {
          "sessionId": "string"
        }
        ```
-   **Error Responses:**
    -   `404 Not Found`: If the landlord is not found.
    -   `500 Internal Server Error`: For any other errors.

---

### 6. Stripe Webhook

-   **Method & Path:** `POST /stripe-webhook`
-   **Purpose:** Handles incoming webhooks from Stripe to update subscription statuses. This endpoint is public but secured by verifying the Stripe signature.
-   **Request Body:**
    -   The request body is a Stripe event object.
-   **Success Response:**
    -   **Code:** `200 OK`
-   **Error Responses:**
    -   `400 Bad Request`: If the Stripe signature is invalid.

---

### 7. Get Subscription Details

-   **Method & Path:** `GET /subscription`
-   **Purpose:** Retrieves the current subscription plan and status for the authenticated landlord.
-   **Authentication:** Required (Bearer Token).
-   **Success Response:**
    -   **Code:** `200 OK`
    -   **Body:**
        ```json
        {
          "plan": "string",
          "status": "string"
        }
        ```
-   **Error Responses:**
    -   `404 Not Found`: If the landlord is not found.

---

### 8. Create Stripe Billing Portal Session

-   **Method & Path:** `POST /create-portal-session`
-   **Purpose:** Creates a new Stripe Billing Portal session for a landlord to manage their subscription.
-   **Authentication:** Required (Bearer Token).
-   **Success Response:**
    -   **Code:** `200 OK`
    -   **Body:**
        ```json
        {
          "url": "string"
        }
        ```
-   **Error Responses:**
    -   `404 Not Found`: If the landlord's Stripe customer ID is not found.
