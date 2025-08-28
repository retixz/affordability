'use strict';

const crypto = require('crypto');
const db = require('../utils/db');
const { processSaltEdgeData } = require('./processSaltEdgeData');

const saltedgeWebhook = async (req, res) => {
  const signature = req.headers['signature'];
  const expiresAt = req.headers['expires-at'];
  const body = req.rawBody;

  // Verify the signature
  const publicKey = process.env.SALTEDGE_PUBLIC_KEY; // This needs to be added to .env
  const signatureString = `${expiresAt}|${req.method}|${req.originalUrl}|${body}`;

  const verifier = crypto.createVerify('sha256');
  verifier.update(signatureString);
  const isVerified = verifier.verify(publicKey, signature, 'base64');

  if (!isVerified) {
    return res.status(400).json({ error: 'Signature verification failed' });
  }

  const { event, data } = req.body;

  try {
    if (event === 'connection_success') {
      const { customer_id, connection_id } = data;
      // Update applicant with connection_id
      await db.query(
        'UPDATE applicants SET saltedge_connection_id = $1, status = \'in_progress\' WHERE saltedge_customer_id = $2',
        [connection_id, customer_id]
      );

      // Asynchronously trigger data fetching and processing
      processSaltEdgeData(connection_id, customer_id);
      console.log(`Connection success for customer ${customer_id}. Triggering data fetch for connection ${connection_id}.`);

    } else if (event === 'connection_fail') {
      const { customer_id } = data;
      // Update applicant status to 'failed'
      await db.query(
        'UPDATE applicants SET status = \'failed\' WHERE saltedge_customer_id = $1',
        [customer_id]
      );
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
