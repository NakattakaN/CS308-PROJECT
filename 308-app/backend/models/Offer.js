const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  userName:  { type: String, default: '' },
  offerPrice: { type: Number, required: true, min: 0 },
  message:   { type: String, default: '', trim: true },
  status:    { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
