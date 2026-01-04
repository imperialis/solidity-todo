require('dotenv').config();

const app = require('./app/app');
const initDb = require('./db/init');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await initDb(); // ⬅️ IMPORTANT: wait for schema creation

    app.listen(PORT, () => {
      console.log(`🚀 Steganography API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize server:', err);
    process.exit(1);
  }
})();
