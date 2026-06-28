const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.PG_SQL_CONNECTION_STRING);

module.exports = { sql };