const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { requireAuth } = require('../middleware/auth');

// Submit an offer on a product
router.post('/products/:productId/offers', requireAuth, async (req, res) => {
  try {
    const { offerPrice, message, userName } = req.body;
    if (!offerPrice || offerPrice <= 0) {
      return res.status(400).json({ message: 'Geçerli bir teklif fiyatı girin.' });
    }
    const offer = await Offer.create({
      productId: req.params.productId,
      userId: req.userId,
      userName: userName || 'Anonymous',
      offerPrice,
      message
    });
    res.status(201).json({ message: 'Teklifiniz alındı!', offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all offers for a product (admin use)
router.get('/products/:productId/offers', async (req, res) => {
  try {
    const offers = await Offer.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all offers (admin panel)
router.get('/offers', async (req, res) => {
  try {
    const offers = await Offer.find().populate('productId', 'name brand').sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update offer status (admin: accept/reject)
router.put('/offers/:offerId', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum.' });
    }
    const offer = await Offer.findByIdAndUpdate(req.params.offerId, { status }, { new: true });
    if (!offer) return res.status(404).json({ message: 'Teklif bulunamadı.' });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
