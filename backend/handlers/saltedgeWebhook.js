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
    if(process.env.IS_OFFLINE == true) isVerified = true;

    if (!isVerified) {
      console.error('Signature verification failed. The webhook may not be from Salt Edge.');
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    const { data } = JSON.parse(body.toString());
    const { event_type, connection_id, customer_id } = data;

    switch (event_type) {
      case 'success':
        console.log(`Connection successful for customer ${customer_id}. Triggering data fetch for connection ${connection_id}.`);
        await db.query(
          "UPDATE applicants SET saltedge_connection_id = $1, status = 'in_progress' WHERE saltedge_customer_id = $2",
          [connection_id, customer_id]
        );
        processSaltEdgeData(connection_id, customer_id);
        break;

      case 'fail':
        console.log(`Connection failed for connection ${connection_id}.`);
        // Optionally, update applicant status to 'failed'
        await db.query(
          "UPDATE applicants SET status = 'failed' WHERE saltedge_connection_id = $1",
          [connection_id]
        );
        break;

      default:
        console.log(`Received unhandled event type '${event_type}'.`);
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