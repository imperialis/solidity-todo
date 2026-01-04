const crypto = require('crypto');
const apiKeysRepo = require('../../db/repos/apiKeys.repo');

const hashKey = (key) =>
  crypto.createHash('sha256').update(key).digest('hex');

exports.generate = async (userId) => {
  const rawKey = crypto.randomBytes(32).toString('hex');
  const prefix = rawKey.slice(0, 6);
  const keyHash = hashKey(rawKey);

  await apiKeysRepo.create(userId, keyHash, prefix);
  return `${prefix}.${rawKey}`;
};

exports.verify = async (providedKey) => {
  const [, raw] = providedKey.split('.');
  if (!raw) return null;

  const keyHash = hashKey(raw);
  return apiKeysRepo.findUserByKeyHash(keyHash);
};
