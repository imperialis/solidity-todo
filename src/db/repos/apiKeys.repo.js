const db = require('../index');

exports.create = (userId, keyHash, prefix) =>
  db.run(
    `INSERT INTO api_keys (user_id, key_hash, key_prefix)
     VALUES (?, ?, ?)`,
    [userId, keyHash, prefix]
  );

exports.findUserByKeyHash = (hash) =>
  db.get(
    `SELECT users.*
     FROM api_keys
     JOIN users ON users.id = api_keys.user_id
     WHERE api_keys.key_hash = ?`,
    [hash]
  );
