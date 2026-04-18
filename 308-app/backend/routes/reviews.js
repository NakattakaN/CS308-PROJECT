const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Product = require('../models/Product');
const { requireAuth, attachAuth, requireAdmin } = require('../middleware/auth');

const { REVIEW_STATUS } = Review;

// ---- PUBLIC: list reviews for a product ----
// Approved reviews are visible to everyone.
// If the caller is authenticated, their own non-approved reviews are also included.
router.get('/products/:productId/reviews', attachAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const filter = {
      product: productId,
      $or: [{ status: 'APPROVED' }]
    };
    if (req.userId) {
      filter.$or.push({ user: req.userId });
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reviews', details: err.message });
  }
});

// ---- USER: create or update their review for a product ----
// Upsert keyed on (product, user). Resubmitting resets status to UNDER_REVIEW.
router.post('/products/:productId/reviews', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findById(productId).select('_id');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const rawRating = Number.parseInt(req.body.rating, 10);
    if (!Number.isFinite(rawRating) || rawRating < 1 || rawRating > 5) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    const body = typeof req.body.body === 'string' ? req.body.body.trim().slice(0, 1000) : '';

    const author = await User.findById(req.userId).select('firstName lastName');
    if (!author) return res.status(401).json({ message: 'Invalid auth token' });
    const reviewerName = [author.firstName, author.lastName].filter(Boolean).join(' ').trim() || 'Anonymous';

    // Reviews with a comment need moderator approval; rating-only reviews are auto-approved.
    const nextStatus = body.length > 0 ? 'UNDER_REVIEW' : 'APPROVED';

    const review = await Review.findOneAndUpdate(
      { product: productId, user: req.userId },
      {
        product: productId,
        user: req.userId,
        reviewerName,
        rating: rawRating,
        body,
        status: nextStatus,
        moderatedBy: undefined,
        moderatedAt: undefined
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review', details: err.message });
  }
});

// ---- ADMIN: moderation queue ----
router.get('/admin/reviews', requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = REVIEW_STATUS.includes(req.query.status) ? req.query.status : 'UNDER_REVIEW';
    const reviews = await Review.find({ status })
      .sort({ createdAt: -1 })
      .populate('product', 'name brand image')
      .lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load moderation queue', details: err.message });
  }
});

// ---- ADMIN: approve or reject
router.patch('/admin/reviews/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid review id' });
    }

    const nextStatus = req.body.status;
    if (!['APPROVED', 'REJECTED'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { status: nextStatus, moderatedBy: req.userId, moderatedAt: new Date() },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: 'Review not found' });

    res.json(review);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update review', details: err.message });
  }
});

module.exports = router;
