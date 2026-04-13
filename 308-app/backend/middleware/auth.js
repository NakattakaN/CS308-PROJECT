const User = require('../models/User');

// Verifies the caller via `Authorization: Bearer <token>`.
// Populates req.userId on success; responds 401 otherwise.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ message: 'Missing auth token' });

    const user = await User.findOne({ authToken: token }).select('_id');
    if (!user) return res.status(401).json({ message: 'Invalid auth token' });

    req.userId = user._id.toString();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed', details: err.message });
  }
}

// For routes that carry :userId in the path — ensures the token's user matches.
function requireSelf(req, res, next) {
  if (req.userId !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

module.exports = { requireAuth, requireSelf };
