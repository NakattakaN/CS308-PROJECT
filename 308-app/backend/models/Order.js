const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:      String,
  brand:     String,
  price:     Number,
  quantity:  Number
});

const orderSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:     [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    fullName: String,
    address:  String,
    city:     String,
    zipCode:  String
  },
  status: {
    type: String,
    enum: ['processing', 'in_transit', 'delivered'],
    default: 'processing'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
