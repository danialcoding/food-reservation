const path = require('path');
const dotenv = require('dotenv');

// code/.env overrides the repository-root .env. Existing process
// environment variables are left unchanged. quiet keeps command output
// the same when a file is missing or loaded.
const dotenvOptions = { quiet: true };
dotenv.config({ ...dotenvOptions, path: path.join(__dirname, '.env') });
dotenv.config({ ...dotenvOptions, path: path.join(__dirname, '..', '.env') });

const { Client } = require('pg');

function setting(name, fallback) {
    const value = process.env[name];
    if (value === undefined || value === '') {
        return fallback;
    }
    return value;
}

const port = parseInt(setting('DB_PORT', '5432'), 10);

const client = new Client({
    host: setting('DB_HOST', 'localhost'),
    port: Number.isNaN(port) ? 5432 : port,
    user: setting('DB_USER', 'postgres'),
    password: process.env.DB_PASSWORD,
    database: setting('DB_NAME', 'school')
});

module.exports = client;
