const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  quantity: { type: Number, default: 1 },
  addedAt: { type: Date, default: Date.now },
  product: {
    brand: String,
    model: String,
    referenceNumber: String,
    price: { amount: Number, currency: String },
    specs: { movement: String, condition: String, boxAndPapers: Boolean, caseSize: String, year: Number },
    description: String,
    images: [String],
    status: String,
    sellerId: String
  }
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  cart: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
