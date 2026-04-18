const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');

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

module.exports = router;
