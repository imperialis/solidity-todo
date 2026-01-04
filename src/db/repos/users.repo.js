const db = require('../index');

exports.create = (username, email, passwordHash) =>
  db.run(
    `INSERT INTO users (username, email, password_hash)
     VALUES (?, ?, ?)`,
    [username, email, passwordHash]
  );

exports.findByIdentifier = (identifier) =>
  db.get(
    `SELECT * FROM users WHERE username = ? OR email = ?`,
    [identifier, identifier]
  );

exports.findById = (id) =>
  db.get(`SELECT * FROM users WHERE id = ?`, [id]);
