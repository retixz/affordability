const express = require('express');
const serverless = require('serverless-http');
const rateLimit = require('express-rate-limit');
const app = express();

// Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use(generalLimiter);

// Import handlers and middleware
const { register, login } = require('./handlers/auth');
const { createCheck } = require('./handlers/createCheck');
const { validate, registerSchema, loginSchema, createCheckSchema } = require('./middleware/validation');
const { authorize } = require('./middleware/auth');
const { getApplicants } = require('./handlers/getApplicants');
const { getReport } = require('./handlers/getReport');
const { handleTinkCallback } = require('./handlers/handleTinkCallback');
const { createCheckoutSession, stripeWebhook, getSubscription, createPortalSession, getAccountStatus } = require('./handlers/stripe');
const { validateCheck } = require('./handlers/validateCheck');


// Routes
app.post('/stripe-webhook', express.raw({type: 'application/json'}), stripeWebhook);

app.post('/register', express.json(), authLimiter, validate(registerSchema), register);
app.post('/login', express.json(), authLimiter, validate(loginSchema), login);
app.post('/checks', express.json(), authorize, validate(createCheckSchema), createCheck);
app.get('/checks/:token', validate(require('./middleware/validation').validateCheckSchema, 'params'), validateCheck);
app.get('/applicants', authorize, getApplicants);
app.get('/reports/:applicantId', authorize, validate(require('./middleware/validation').getReportSchema, 'params'), getReport);
app.get('/callback/tink', validate(require('./middleware/validation').handleTinkCallbackSchema, 'query'), handleTinkCallback);
app.post('/create-checkout-session', express.json(), authorize, validate(require('./middleware/validation').createCheckoutSessionSchema), createCheckoutSession);
app.get('/subscription', authorize, getSubscription);
app.post('/create-portal-session', authorize, createPortalSession);
app.get('/account/status', authorize, getAccountStatus);

module.exports.handler = serverless(app);
