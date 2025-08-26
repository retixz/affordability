# Security Measures

This document outlines the security measures implemented in the backend of the affordability API.

## 1. Input Validation

All incoming requests to the API are validated against a strict schema to prevent malformed or malicious data from reaching the business logic.

- **Implementation:** We use the `joi` library for schema validation.
- **Location of Schemas:** All Joi validation schemas are defined in `backend/middleware/validation.js`.
- **Enforcement:** Validation is enforced as a middleware in `backend/app.js` for each route. If validation fails, the API immediately returns a `400 Bad Request` error with a descriptive message.

## 2. API Rate Limiting

To protect against brute-force attacks, denial-of-service attacks, and other forms of abuse, we have implemented API rate limiting.

- **Implementation:** We use the `express-rate-limit` middleware.
- **Configuration:** The rate limiters are configured in `backend/app.js`.

### Limits

- **General Limit:** A general rate limit of **100 requests per 15 minutes** is applied to all API endpoints for each IP address.
- **Authentication Limit:** A stricter rate limit of **10 requests per 15 minutes** is applied to the `/login` and `/register` endpoints to mitigate brute-force attacks.

## 3. Cross-Origin Resource Sharing (CORS)

To ensure that only authorized frontend applications can make requests to our API, we have a CORS policy in place.

- **Implementation:** CORS is enabled for all HTTP API endpoints.
- **Configuration:** The CORS policy is configured in `backend/serverless.yaml` under the `provider.httpApi` section with `cors: true`. This setting instructs API Gateway to allow cross-origin requests. For enhanced security in a production environment, this should be configured to a specific origin.
