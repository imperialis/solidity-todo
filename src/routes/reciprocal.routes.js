const router = require('express').Router();
const auth = require('../auth/auth.middleware');
const reciprocal = require('../steganography/reciprocal/reciprocal.service');

router.post('/split', auth, (req, res) => {
  const { secretMessage, parts } = req.body;

  const chunks = reciprocal.split(
    Buffer.from(secretMessage),
    parts || 2
  );

  res.json({
    chunks: chunks.map(c => c.toString('base64'))
  });
});

router.post('/combine', auth, (req, res) => {
  const buffers = req.body.chunks.map(c =>
    Buffer.from(c, 'base64')
  );

  const combined = reciprocal.combine(buffers);
  res.json({ secretMessage: combined.toString() });
});

module.exports = router;
