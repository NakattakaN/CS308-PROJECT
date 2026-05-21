const mongoose = require('mongoose');

// CartItem embeds a snapshot of the product at the time it was added to cart.
// This means cart prices won't change if the listing is later updated.
// The embedded product schema mirrors Product.js so the shapes are consistent.
const cartItemSchema = new mongoose.Schema({
  quantity: { type: Number, default: 1 },
  addedAt:  { type: Date, default: Date.now },
  product: {
    _id:            { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:           String,
    brand:          String,
    price:          Number,
    image:          String,
    images:         [String],
    referenceNumber:String,
    description:    String,
    specs: {
      movement:    String,
      condition:   String,
      boxAndPapers:Boolean,
      caseSize:    String,
      year:        Number
    },
    status:   String,
    sellerId: String
  }
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'product_manager', 'admin'], default: 'user' },
  authToken: { type: String, index: true },
  cart: [cartItemSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  walletBalance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
