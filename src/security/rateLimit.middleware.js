const rateRepo = require('../db/repos/rateLimits.repo');
const crypto = require('crypto');

const WINDOW_MS = 60_000;
const MAX_REQ = 100;

module.exports = async (req, res, next) => {
  const key =
    req.headers['x-api-key'] ||
    crypto.createHash('sha1').update(req.ip).digest('hex');

  const now = Date.now();
  const record = await rateRepo.get(key);

  if (!record || now > record.reset_time) {
    await rateRepo.upsert(key, 1, now + WINDOW_MS);
    return next();
  }

  if (record.request_count >= MAX_REQ)
    return res.status(429).json({ error: 'Rate limit exceeded' });

  await rateRepo.upsert(
    key,
    record.request_count + 1,
    record.reset_time
  );

  next();
};
