'use strict';

const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  const { email, password, companyName } = req.body;

  let client;
  try {
    client = await db.getClient();

    const userExistsQuery = 'SELECT * FROM landlords WHERE email = $1';
    const existingUser = await client.query(userExistsQuery, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO landlords (email, company_name, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    const values = [email, companyName, passwordHash];
    await client.query(insertQuery, values);

    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (client) {
      await client.end();
    }
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  let client;
  try {
    client = await db.getClient();

    const query = 'SELECT * FROM landlords WHERE email = $1';
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ landlordId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION_TIME || '8h' });

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (client) {
      await client.end();
    }
  }
};

module.exports = {
  register,
  login,
};
