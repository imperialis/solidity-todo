const router = require('express').Router();
const auth = require('../auth/auth.middleware');
const crypto = require('crypto');
const encRepo = require('../db/repos/encryptionKeys.repo');
const encService = require('../security/services/encryption.service');

router.post('/key', auth, async (req, res) => {
  const key = crypto.randomBytes(32);
  const master = crypto.createHash('sha256')
    .update(req.user.username)
    .digest();

  const { encrypted, iv } = encService.encrypt(key, master);

  await encRepo.store(
    req.user.id,
    req.body.name || 'default',
    encrypted.toString('hex'),
    iv.toString('hex')
  );

  res.json({ status: 'key stored' });
});

router.get('/keys', auth, async (req, res) => {
  res.json(await encRepo.list(req.user.id));
});

module.exports = router;
