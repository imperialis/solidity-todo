const db = require('./index');

module.exports = async () => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      key_hash TEXT,
      key_prefix TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used DATETIME
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      api_key_hash TEXT PRIMARY KEY,
      request_count INTEGER,
      reset_time INTEGER
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS encryption_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      key_name TEXT,
      encrypted_key TEXT,
      iv TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};
