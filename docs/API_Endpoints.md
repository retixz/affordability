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
