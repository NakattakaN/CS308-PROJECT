const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');
const { requireAuth, requireSalesManager } = require('../middleware/auth');

// Returns a Map<productIdString, { averageRating, reviewCount }> covering
// every approved review. Products absent from the map have no approved reviews.
async function loadAggregates(productIds) {
  const match = productIds ? { product: { $in: productIds }, status: 'APPROVED' } : { status: 'APPROVED' };
  const rows = await Review.aggregate([
    { $match: match },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, n: { $sum: 1 } } }
  ]);
  const out = new Map();
  for (const r of rows) {
    out.set(r._id.toString(), {
      averageRating: Math.round(r.avg * 10) / 10,
      reviewCount: r.n
    });
  }
  return out;
}

// TÜM SAATLERİ GETİR (GET) - Ana sayfa için
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    const aggregates = await loadAggregates(products.map(p => p._id));
    const enriched = products.map(p => {
      const a = aggregates.get(p._id.toString()) || { averageRating: 0, reviewCount: 0 };
      return { ...p, ...a };
    });
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({
      error: 'Saatler getirilirken hata oluştu',
      details: error.message
    });
  }
});

// TEK BİR SAATİ GETİR (GET) - Details sayfası için
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Saat bulunamadı!' });
    }
    const aggregates = await loadAggregates([product._id]);
    const agg = aggregates.get(product._id.toString()) || { averageRating: 0, reviewCount: 0 };
    res.status(200).json({ ...product, ...agg });
  } catch (error) {
    res.status(500).json({
      error: 'Saat detayı getirilirken hata oluştu',
      details: error.message
    });
  }
});

// Apply discount to a product — sales manager only
router.patch('/products/:id/discount', requireAuth, requireSalesManager, async (req, res) => {
  try {
    const { discountRate } = req.body;
    const rate = Number(discountRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ message: 'Discount rate must be between 0 and 100' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (rate === 0) {
      product.price = product.originalPrice || product.price;
      product.originalPrice = null;
      product.discountRate = 0;
    } else {
      if (!product.originalPrice) product.originalPrice = product.price;
      product.discountRate = rate;
      product.price = Math.round(product.originalPrice * (1 - rate / 100));
    }

    await product.save();

    // Notify wishlist users — find users who have this product in their wishlist
    const affectedUsers = await User.find({ wishlist: product._id }).select('_id');
    // Notification stored in-app: for now just logged (email notifications out of scope)
    if (affectedUsers.length > 0) {
      console.log(`Discount applied: ${affectedUsers.length} wishlist user(s) would be notified for product ${product._id}`);
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
