const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Order = require('../models/Order');
const { requireAuth, requireAdmin, requireProductManager, requireSalesManager, requireStaff } = require('../middleware/auth');

// Get all users
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password -authToken').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all products
router.get('/admin/products', requireAuth, requireStaff, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new product (product manager)
router.post('/admin/products', requireAuth, requireProductManager, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product fields like stock, status (product manager)
router.put('/admin/products/:id', requireAuth, requireProductManager, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const allowed = ['name', 'brand', 'price', 'description', 'image', 'referenceNumber', 'stock'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    }

    await product.save(); // pre-save hook enforces stock >= 0 and syncs status
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a product and remove it from all user carts
router.delete('/admin/products/:id', requireAuth, requireProductManager, async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndDelete(productId);

    // Remove the deleted product from every user's cart
    await User.updateMany(
      { 'cart.product._id': productId },
      { $pull: { cart: { 'product._id': productId } } }
    );

    res.json({ message: 'Product deleted and removed from all user carts.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all offers
router.get('/admin/offers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const offers = await Offer.find().populate('productId', 'name brand').sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update offer status
router.put('/admin/offers/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(offer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
router.get('/admin/orders', requireAuth, requireStaff, async (req, res) => {
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
router.put('/admin/orders/:id/status', requireAuth, requireProductManager, async (req, res) => {
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
router.get('/admin/returns', requireAuth, requireSalesManager, async (req, res) => {
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
router.put('/admin/orders/:id/return', requireAuth, requireSalesManager, async (req, res) => {
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

      // Restore stock for each returned item
      await Promise.all(order.items.map(async item => {
        const updated = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { new: true }
        );
        if (updated && updated.stock > 0) {
          await Product.findByIdAndUpdate(item.productId, { status: 'available' });
        }
      }));
    } else {
      order.returnStatus = 'rejected';
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Revenue/loss data grouped by day for a given date range
router.get('/admin/revenue', requireAuth, requireSalesManager, async (req, res) => {
  try {
    const fromDate = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const toDate = req.query.to ? new Date(req.query.to) : new Date();
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $ne: 'Cancelled' }
    }).select('totalAmount createdAt refundAmount returnStatus');

    // Group revenue and refunds by date
    const byDate = {};
    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      if (!byDate[key]) byDate[key] = { revenue: 0, refunds: 0 };
      byDate[key].revenue += order.totalAmount || 0;
      if (order.returnStatus === 'approved') {
        byDate[key].refunds += order.refundAmount || 0;
      }
    }

    // Fill every day in range with 0 if no orders
    const data = [];
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      const key = cursor.toISOString().split('T')[0];
      const { revenue = 0, refunds = 0 } = byDate[key] || {};
      data.push({ date: key, revenue, refunds, net: revenue - refunds });
      cursor.setDate(cursor.getDate() + 1);
    }

    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    const totalRefunds = data.reduce((s, d) => s + d.refunds, 0);

    res.json({ data, totalRevenue, totalRefunds, netProfit: totalRevenue - totalRefunds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
