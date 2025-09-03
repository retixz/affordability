'use strict';

const crypto = require('crypto');
const db = require('../utils/db');
const { processSaltEdgeData } = require('./processSaltEdgeData');

// --- Constants ---
const APPLICANT_STATUS = {
  IN_PROGRESS: 'in_progress',
  FAILED: 'failed',
};

// Correctly identifies 'finish' as the successful completion of the initial connection
const SALTEDGE_STAGES = {
  FINISH: 'finish',
  FAIL: 'fail',
};

// --- Helper Functions ---

/**
 * Verifies the integrity and authenticity of the incoming webhook request from Salt Edge.
 * Throws an error if verification fails.
 * @param {object} req - The Express request object.
 */
const verifySignature = (req) => {
  if (process.env.IS_OFFLINE === 'true') {
    console.log('--- OFFLINE MODE: SKIPPING SIGNATURE VERIFICATION ---');
    return;
  }
  const signature = req.headers['signature'];
  if (!signature) {
    throw new Error('Missing "Signature" header.');
  }
  const publicKeyPem = process.env.SALTEDGE_PUBLIC_KEY;
  if (!publicKeyPem) {
    throw new Error('Server configuration error: Missing public key.');
  }
  const callbackUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const dataToVerify = `${callbackUrl}|${req.body.toString()}`;
  const verifier = crypto.createVerify('sha256');
  verifier.update(dataToVerify);
  const formattedPublicKey = publicKeyPem.replace(/\\n/g, '\n');
  const isVerified = verifier.verify(formattedPublicKey, signature, 'base64');
  if (!isVerified) {
    throw new Error('Signature verification failed.');
  }
  console.log('Signature verified successfully.');
};

// --- Stage Handlers ---

/**
 * Handles the 'finish' stage of the Salt Edge connection.
 * This indicates the user has successfully completed the initial connection flow.
 * @param {object} data - The payload data from the webhook.
 */
const handleFinish = async ({ connection_id, customer_id }) => {
  if (!connection_id || !customer_id) {
    console.warn('Received finish stage without connection_id or customer_id. Skipping.', { customer_id, connection_id });
    return;
  }
  console.log(`Connection flow finished for customer ${customer_id}. Triggering data fetch for connection ${connection_id}.`);
  await db.query(
    "UPDATE applicants SET saltedge_connection_id = $1, status = $2 WHERE saltedge_customer_id = $3",
    [connection_id, APPLICANT_STATUS.IN_PROGRESS, customer_id]
  );
  processSaltEdgeData(connection_id, customer_id);
};

/**
 * Handles the 'fail' stage of the Salt Edge connection.
 * @param {object} data - The payload data from the webhook.
 */
const handleFail = async ({ customer_id, error_class }) => {
  console.log(`Connection failed for customer ${customer_id} with error: ${error_class || 'Unknown Error'}.`);
  await db.query(
    "UPDATE applicants SET status = $1 WHERE saltedge_customer_id = $2",
    [APPLICANT_STATUS.FAILED, customer_id]
  );
};

/**
 * Handles intermediate stages by logging them for visibility.
 * @param {object} data - The payload data from the webhook.
 */
const handleIntermediate = ({ stage, customer_id }) => {
  console.log(`Received intermediate stage '${stage}' for customer ${customer_id}. Acknowledging.`);
};

/**
 * Routes the webhook payload to the appropriate handler based on its stage.
 * @param {object} payloadData - The 'data' object from the Salt Edge webhook.
 */
const handleWebhookPayload = async (payloadData) => {
  const { stage, error_class } = payloadData;

  // An error_class can appear at any stage and should be treated as a failure.
  if (error_class) {
    return await handleFail(payloadData);
  }

  switch (stage) {
    case SALTEDGE_STAGES.FINISH:
      await handleFinish(payloadData);
      break;
    case SALTEDGE_STAGES.FAIL:
      await handleFail(payloadData);
      break;
    default:
      // This will gracefully handle 'start', 'fetch_transactions', etc.
      handleIntermediate(payloadData);
      break;
  }
};


// --- Main Webhook Handler ---

/**
 * The main Express handler for receiving Salt Edge webhooks.
 */
const saltedgeWebhook = async (req, res) => {
  try {
    verifySignature(req);
    const payload = JSON.parse(req.body.toString());
    const { data } = payload;
    console.log(`Received Salt Edge webhook with stage: ${data?.stage || 'not specified'}`);
    await handleWebhookPayload(data);
    return res.status(200).json({ message: 'Webhook received and acknowledged.' });
  } catch (error) {
    console.error('Error processing Salt Edge webhook:', error.message);
    if (error.message.includes('Signature')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('configuration')) {
      return res.status(500).json({ error: 'Server configuration error.' });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  saltedgeWebhook,
};