const express = require('express');

const authRoutes = require('../routes/auth.routes');
const encryptionRoutes = require('../routes/encryption.routes');
const textRoutes = require('../routes/text.routes');
const imageRoutes = require('../routes/image.routes');
const audioRoutes = require('../routes/audio.routes');
const reciprocalRoutes = require('../routes/reciprocal.routes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/encryption', encryptionRoutes);
app.use('/api/text', textRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/reciprocal', reciprocalRoutes);

app.get('/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

module.exports = app;
