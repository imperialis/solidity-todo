const jwtService = require('./services/jwt.service');
const apiKeyService = require('./services/apiKey.service');

module.exports = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers.authorization;

    if (apiKey) {
      const user = await apiKeyService.verify(apiKey);
      if (!user) return res.status(401).json({ error: 'Invalid API key' });
      req.user = user;
      return next();
    }

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      req.user = jwtService.verify(token);
      return next();
    }

    return res.status(401).json({ error: 'Authentication required' });
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
