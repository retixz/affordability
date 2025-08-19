'use strict';

const jwt = require('jsonwebtoken');

const authorize = (handler) => async (event, context) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;

    if (!token || !token.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authorization token not found.' }),
      };
    }

    const tokenValue = token.split(' ')[1];
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);

    // Attach landlordId to the event for downstream use
    event.landlordId = decoded.landlordId;

    return handler(event, context);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Invalid or expired token.' }),
      };
    }

    console.error('Authorization error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

module.exports = {
  authorize,
};
