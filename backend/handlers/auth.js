'use strict';

const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

module.exports.register = async (event) => {
  const { email, password, companyName } = JSON.parse(event.body);

  if (!email || !validateEmail(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Valid email is required.' }),
    };
  }

  if (!password || !validatePassword(password)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Password must be at least 8 characters long.' }),
    };
  }

  if (!companyName || typeof companyName !== 'string' || companyName.trim() === '') {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Company name is required.' }),
    };
  }

  let client;
  try {
    client = await db.getClient();

    const userExistsQuery = 'SELECT * FROM landlords WHERE email = $1';
    const existingUser = await client.query(userExistsQuery, [email]);

    if (existingUser.rows.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'User with this email already exists.' }),
      };
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

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'User registered successfully.' }),
    };
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};

module.exports.login = async (event) => {
  const { email, password } = JSON.parse(event.body);

  if (!email || !validateEmail(email)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Valid email is required.' }),
    };
  }

  if (!password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Password is required.' }),
    };
  }

  let client;
  try {
    client = await db.getClient();

    const query = 'SELECT * FROM landlords WHERE email = $1';
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials.' }),
      };
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials.' }),
      };
    }

    const token = jwt.sign({ landlordId: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });

    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
