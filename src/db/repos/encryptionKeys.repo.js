const db = require('../index');

exports.store = (userId, name, encryptedKey, iv) =>
  db.run(
    `INSERT INTO encryption_keys (user_id, key_name, encrypted_key, iv)
     VALUES (?, ?, ?, ?)`,
    [userId, name, encryptedKey, iv]
  );

exports.list = (userId) =>
  db.all(
    `SELECT id, key_name, created_at
     FROM encryption_keys WHERE user_id = ?`,
    [userId]
  );
