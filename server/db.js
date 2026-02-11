const { Pool } = require('pg');

const pool = new Pool({
user: 'postgres',
host: 'localhost',
database: 'chagitickets_db',
password: 'hiroshi',
port: 5432,
});

module.exports = pool;