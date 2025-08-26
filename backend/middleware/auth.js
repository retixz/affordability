'use strict';

const jwt = require('jsonwebtoken');

const authorize = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token not found.' });
    }

    const tokenValue = token.split(' ')[1];
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);

    req.landlordId = decoded.landlordId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    console.error('Authorization error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  authorize,
};
