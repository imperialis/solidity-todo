const db = require('../index');

exports.get = (keyHash) =>
  db.get(
    `SELECT * FROM rate_limits WHERE api_key_hash = ?`,
    [keyHash]
  );

exports.upsert = (keyHash, count, resetTime) =>
  db.run(
    `INSERT INTO rate_limits (api_key_hash, request_count, reset_time)
     VALUES (?, ?, ?)
     ON CONFLICT(api_key_hash)
     DO UPDATE SET request_count=?, reset_time=?`,
    [keyHash, count, resetTime, count, resetTime]
  );
