const mongoose = require('mongoose');

const REVIEW_STATUS = ['APPROVED', 'UNDER_REVIEW', 'REJECTED'];

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reviewerName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  body: { type: String, default: '', maxlength: 1000 },
  status: {
    type: String,
    enum: REVIEW_STATUS,
    default: 'UNDER_REVIEW',
    index: true
  },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date }
}, { timestamps: true });

// One review per user per product. Resubmission updates the existing doc.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
module.exports.REVIEW_STATUS = REVIEW_STATUS;
