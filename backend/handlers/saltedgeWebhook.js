'use strict';

const crypto = require('crypto');
const db = require('../utils/db');
const { processSaltEdgeData } = require('./processSaltEdgeData');

const saltedgeWebhook = async (req, res) => {
  const signature = req.headers['signature'];
  const body = req.body;

  if (!signature) {
    console.error('Missing "Signature" header.');
    return res.status(400).json({ error: 'Missing required signature header.' });
  }

  try {
    const publicKeyPem = process.env.SALTEDGE_PUBLIC_KEY;
    if (!publicKeyPem) {
      console.error('SALTEDGE_PUBLIC_KEY is not set in the environment variables.');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const verifier = crypto.createVerify('sha256');
    verifier.update(`${req.method}|${req.originalUrl}|`);
    verifier.update(body);
    const isVerified = verifier.verify(publicKeyPem, signature, 'base64');
    if(process.env.IS_OFFLINE == true) isVerified = true; // Skip verification in local/offline mode

    if (!isVerified) {
      console.error('Signature verification failed. The webhook may not be from Salt Edge.');
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    // Correctly parse the stage from the webhook data
    const { data } = JSON.parse(body.toString());
    const { stage, customer_id, connection_id } = data;

    // --- Stage Handling ---
    switch (stage) {
      case 'finish':
        console.log(`Connection finished for customer ${customer_id}. Triggering data fetch for connection ${connection_id}.`);
        await db.query(
          "UPDATE applicants SET saltedge_connection_id = $1, status = 'in_progress' WHERE saltedge_customer_id = $2",
          [connection_id, customer_id]
        );
        // Asynchronously process the data
        processSaltEdgeData(connection_id, customer_id);
        break;

      // The other stages are intermediate steps in the process.
      case 'start':
      case 'connect':
      case 'interactive':
      case 'fetch_holder_info':
      case 'fetch_accounts':
      case 'fetch_recent':
      case 'fetch_full':
      case 'disconnect':
        console.log(`Received intermediate stage '${stage}' for connection ${connection_id}. No action taken.`);
        break;

      default:
        console.log(`Received unknown stage '${stage}'.`);
        break;
    }

    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Error processing Salt Edge webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  saltedgeWebhook,
};