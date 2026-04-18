const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireAuth } = require('../middleware/auth');

// Create an order after successful payment
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress } = req.body;
    const order = await Order.create({
      userId: req.userId,
      items,
      totalAmount,
      shippingAddress
    });
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders for a user
router.get('/users/:userId/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
