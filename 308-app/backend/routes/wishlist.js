const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { requireAuth, requireSelf } = require('../middleware/auth');

// Get user's wishlist with full product details
router.get('/users/:userId/wishlist', requireAuth, requireSelf, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a product to wishlist (idempotent)
router.post('/users/:userId/wishlist', requireAuth, requireSelf, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $addToSet: { wishlist: productId } },
      { new: true }
    ).populate('wishlist');

    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a product from wishlist
router.delete('/users/:userId/wishlist/:productId', requireAuth, requireSelf, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { wishlist: req.params.productId } },
      { new: true }
    ).populate('wishlist');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
