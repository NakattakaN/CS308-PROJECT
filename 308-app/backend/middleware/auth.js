const User = require('../models/User');

// Reads bearer token, looks up the user, sets req.userId + req.userRole.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ message: 'Missing auth token' });

    const user = await User.findOne({ authToken: token }).select('_id role');
    if (!user) return res.status(401).json({ message: 'Invalid auth token' });

    req.userId = user._id.toString();
    req.userRole = user.role || 'user';
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed', details: err.message });
  }
}

// Same as requireAuth but doesn't 401 when the token is missing or bad.
// Used for endpoints where auth is optional but changes the response.
async function attachAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return next();

    const user = await User.findOne({ authToken: token }).select('_id role');
    if (user) {
      req.userId = user._id.toString();
      req.userRole = user.role || 'user';
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed', details: err.message });
  }
}

// For routes with :userId in the path. Token's user must match.
function requireSelf(req, res, next) {
  if (req.userId !== req.params.userId) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

// Run requireAuth before this.
function requireAdmin(req, res, next) {
  if (!req.userId) return res.status(401).json({ message: 'Missing auth token' });
  if (req.userRole !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}

// Allows product_manager or admin. Run requireAuth before this.
function requireProductManager(req, res, next) {
  if (!req.userId) return res.status(401).json({ message: 'Missing auth token' });
  if (req.userRole !== 'product_manager' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Product manager only' });
  }
  next();
}

// Allows sales_manager or admin. Run requireAuth before this.
function requireSalesManager(req, res, next) {
  if (!req.userId) return res.status(401).json({ message: 'Missing auth token' });
  if (req.userRole !== 'sales_manager' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Sales manager only' });
  }
  next();
}

module.exports = { requireAuth, attachAuth, requireSelf, requireAdmin, requireProductManager, requireSalesManager };
