'use strict';

const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
};

module.exports.getClient = async () => {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
};
