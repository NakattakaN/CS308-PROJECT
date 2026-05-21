const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const { requireAuth, requireAdmin } = require('../middleware/auth');

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
    if (!['Processing', 'In-Transit', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const update = { status };
    if (status === 'Delivered') update.deliveredAt = new Date();
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders with pending return requests
router.get('/admin/returns', async (req, res) => {
  try {
    const orders = await Order.find({ returnStatus: { $in: ['requested', 'approved', 'rejected'] } })
      .populate('userId', 'firstName lastName email')
      .populate('items.productId', 'image')
      .sort({ returnRequestedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject a return request
router.put('/admin/orders/:id/return', async (req, res) => {
  try {
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.returnStatus !== 'requested') {
      return res.status(400).json({ message: 'No pending return request for this order' });
    }

    if (action === 'approve') {
      order.returnStatus = 'approved';
      order.refundAmount = order.totalAmount;

      // Credit refund to user's wallet balance
      await User.findByIdAndUpdate(order.userId, {
        $inc: { walletBalance: order.totalAmount }
      });
    } else {
      order.returnStatus = 'rejected';
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
