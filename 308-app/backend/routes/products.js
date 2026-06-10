const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');
const User = require('../models/User');
const { requireAuth, requireSalesManager } = require('../middleware/auth');
const { sendDiscountNotificationEmail } = require('../services/emailService');

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
    const expiredProducts = await Product.find({ campaignEnd: { $lt: new Date() }, discountRate: { $gt: 0 } });
    for (const p of expiredProducts) {
      p.price = p.originalPrice || p.price;
      p.originalPrice = null;
      p.discountRate = 0;
      p.campaignEnd = null;
      await p.save();
    }

    const products = await Product.find().lean();
    const aggregates = await loadAggregates(products.map(p => p._id));
    const enriched = products.map(p => {
      const a = aggregates.get(p._id.toString()) || { averageRating: 0, reviewCount: 0 };
      return { ...p, ...a };
    });
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching products',
      details: error.message
    });
  }
});

// TEK BİR SAATİ GETİR (GET) - Details sayfası için
router.get('/products/:id', async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found!' });
    }

    if (product.campaignEnd && new Date(product.campaignEnd) < new Date() && product.discountRate > 0) {
      product.price = product.originalPrice || product.price;
      product.originalPrice = null;
      product.discountRate = 0;
      product.campaignEnd = null;
      await product.save();
    }

    product = product.toObject();

    const aggregates = await loadAggregates([product._id]);
    const agg = aggregates.get(product._id.toString()) || { averageRating: 0, reviewCount: 0 };
    res.status(200).json({ ...product, ...agg });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching product details',
      details: error.message
    });
  }
});

// Apply discount to a product — sales manager only
router.patch('/products/:id/discount', requireAuth, requireSalesManager, async (req, res) => {
  try {
    const { discountRate, campaignEnd } = req.body;
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
      product.campaignEnd = null;
    } else {
      if (!product.originalPrice) product.originalPrice = product.price;
      product.discountRate = rate;
      product.price = Math.round(product.originalPrice * (1 - rate / 100));
      if (campaignEnd) product.campaignEnd = new Date(campaignEnd);
      else product.campaignEnd = null;
    }

    await product.save();

    // Notify wishlist users by email when a discount is applied
    if (rate > 0) {
      const wishlistUsers = await User.find({ wishlist: product._id }).select('firstName email');
      wishlistUsers.forEach(user => {
        sendDiscountNotificationEmail(
          user.email,
          user.firstName || 'Customer',
          `${product.brand} ${product.name}`,
          product.originalPrice,
          product.price,
          rate
        ).catch(err => console.error('Discount notification email failed:', err.message));
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product price directly — sales manager only
router.patch('/products/:id/price', requireAuth, requireSalesManager, async (req, res) => {
  try {
    const { price } = req.body;
    const newPrice = Number(price);
    if (isNaN(newPrice) || newPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.discountRate > 0) {
      // If there's an active discount, the provided price becomes the new originalPrice,
      // and the discounted price is recalculated automatically.
      product.originalPrice = newPrice;
      product.price = Math.round(newPrice * (1 - product.discountRate / 100));
    } else {
      product.originalPrice = null;
      product.price = newPrice;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
