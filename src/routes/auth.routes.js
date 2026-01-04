const router = require('express').Router();
const usersRepo = require('../db/repos/users.repo');
const passwordService = require('../security/services/password.service');
const jwtService = require('../auth/services/jwt.service');
const apiKeyService = require('../auth/services/apiKey.service');
const authMiddleware = require('../auth/auth.middleware');



router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await passwordService.hash(password);
  await usersRepo.create(username, email, hash);
  res.json({ status: 'registered' });
});

router.post('/login', async (req, res) => {
  const user = await usersRepo.findByIdentifier(req.body.identifier);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await passwordService.verify(
    req.body.password,
    user.password_hash
  );

  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({
    token: jwtService.sign({ id: user.id, username: user.username })
  });
});

router.post('/api-key', authMiddleware, async (req, res) => {
  const key = await apiKeyService.generate(req.user.id);
  res.json({ apiKey: key });
});

module.exports = router;
