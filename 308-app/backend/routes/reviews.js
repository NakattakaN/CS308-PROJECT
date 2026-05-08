const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
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

// ---- PUBLIC: list latest approved reviews for main page ----
router.get('/reviews/latest', async (req, res) => {
  try {
    const reviews = await Review.find({ status: 'APPROVED' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('product', 'name brand image')
      .lean();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load latest reviews', details: err.message });
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

    // Purchase gate: user must have bought this product AND it must be delivered
    const hasPurchased = await Order.findOne({
      userId: req.userId,
      'items.productId': productId,
      status: 'Delivered'
    });
    if (!hasPurchased) {
      return res.status(403).json({ message: 'You can only review products after they have been delivered.' });
    }

    const hasRating = req.body.rating != null && req.body.rating !== '';
    const hasBody = typeof req.body.body === 'string' && req.body.body.trim().length > 0;

    if (!hasRating && !hasBody) {
      return res.status(400).json({ message: 'Please provide a rating, a comment, or both.' });
    }

    let rawRating;
    if (hasRating) {
      rawRating = Number.parseInt(req.body.rating, 10);
      if (!Number.isFinite(rawRating) || rawRating < 1 || rawRating > 5) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
      }
    }

    const newBody = hasBody ? req.body.body.trim().slice(0, 1000) : null;

    const author = await User.findById(req.userId).select('firstName lastName');
    if (!author) return res.status(401).json({ message: 'Invalid auth token' });
    const reviewerName = [author.firstName, author.lastName].filter(Boolean).join(' ').trim() || 'Anonymous';

    // Merge with existing review so rating-only and comment-only submissions don't erase each other
    const existing = await Review.findOne({ product: productId, user: req.userId });
    const finalRating = hasRating ? rawRating : existing?.rating;
    const finalBody = newBody !== null ? newBody : (existing?.body ?? '');

    // Body changes need moderation; rating-only is auto-approved
    const bodyChanged = newBody !== null && newBody !== (existing?.body ?? '');
    let nextStatus;
    if (finalBody.length > 0) {
      nextStatus = bodyChanged ? 'UNDER_REVIEW' : (existing?.status ?? 'UNDER_REVIEW');
    } else {
      nextStatus = 'APPROVED';
    }

    const setFields = { reviewerName, body: finalBody, status: nextStatus };
    if (finalRating !== undefined) setFields.rating = finalRating;
    if (bodyChanged) { setFields.moderatedBy = null; setFields.moderatedAt = null; }

    const review = await Review.findOneAndUpdate(
      { product: productId, user: req.userId },
      { $set: setFields, $setOnInsert: { product: productId, user: req.userId } },
      { new: true, upsert: true }
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
