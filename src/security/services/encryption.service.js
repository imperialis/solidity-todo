const crypto = require('crypto');
const ALG = 'aes-256-gcm';

exports.encrypt = (data, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALG, key, iv);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  return {
    encrypted,
    iv,
    authTag: cipher.getAuthTag()
  };
};

exports.decrypt = (encrypted, key, iv, authTag) => {
  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};
