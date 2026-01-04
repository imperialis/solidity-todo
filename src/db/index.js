const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const db = new sqlite3.Database('./steganography.db', (err) => {
  if (err) console.error('Database error:', err);
  else console.log('Connected to SQLite database');
});
// Ensure serialized execution
db.serialize();
// Export promisified versions
module.exports = {
  run: promisify(db.run.bind(db)),
  get: promisify(db.get.bind(db)),
  all: promisify(db.all.bind(db)),
};