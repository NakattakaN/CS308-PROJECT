const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Order = require('../models/Order');

// Get all users
router.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password -authToken').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get('/admin/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a product
router.delete('/admin/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all offers
router.get('/admin/offers', async (req, res) => {
  try {
    const offers = await Offer.find().populate('productId', 'name brand').sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update offer status
router.put('/admin/offers/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
router.get('/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'firstName lastName email')
      .populate('items.productId', 'image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/admin/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    // Validate status
    if (!['Processing', 'Shipped', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
