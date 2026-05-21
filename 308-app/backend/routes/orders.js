const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { generateInvoicePdf } = require('../services/invoicePdf');
const { sendInvoiceEmail } = require('../services/emailService');

// Create an order after successful payment
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress } = req.body;

    // Decrement stock for each ordered item and set status to out_of_stock if stock hits 0
    await Promise.all(items.map(async item => {
      const updated = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (updated && updated.stock <= 0) {
        await Product.findByIdAndUpdate(item.productId, { status: 'out_of_stock' });
      }
    }));

    const order = await Order.create({
      userId: req.userId,
      items,
      totalAmount,
      shippingAddress,
      status: 'Processing'
    });

    // Generate PDF and send email in the background — don't block the response
    const user = await User.findById(req.userId).select('firstName lastName email');
    if (user?.email) {
      generateInvoicePdf(order, user)
        .then(pdfBuffer => sendInvoiceEmail(
          user.email,
          [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Customer',
          order._id.toString(),
          totalAmount,
          pdfBuffer
        ))
        .then(() => console.log(`Invoice emailed for order ${order._id}`))
        .catch(err => console.error('Invoice email failed:', err.message));
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the invoice PDF for a specific order
router.get('/orders/:orderId/invoice', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const targetUserId = order.userId.toString() === req.userId ? req.userId : order.userId;
    const user = await User.findById(targetUserId).select('firstName lastName email');
    const pdfBuffer = await generateInvoicePdf(order, user || {});

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${order._id.toString().slice(-8).toUpperCase()}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders for a user
router.get('/users/:userId/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate('items.productId', 'image')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel an order (only allowed while status is Processing)
router.put('/orders/:orderId/cancel', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    if (order.status !== 'Processing') {
      return res.status(400).json({ message: 'Only orders in Processing status can be cancelled' });
    }

    // Restore stock when order is cancelled and set status back to available
    await Promise.all(order.items.map(async item => {
      const updated = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: +item.quantity } },
        { new: true }
      );
      if (updated && updated.stock > 0) {
        await Product.findByIdAndUpdate(item.productId, { status: 'available' });
      }
    }));

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request a return for a delivered order (within 30 days of delivery)
router.post('/orders/:orderId/return', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned' });
    }
    if (order.returnStatus !== 'none') {
      return res.status(400).json({ message: 'A return has already been requested for this order' });
    }

    const deliveredDate = order.deliveredAt || order.updatedAt;
    const diffInDays = (Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays >= 30) {
      return res.status(400).json({ message: 'Return window has expired (must be within 30 days of delivery)' });
    }

    order.returnStatus = 'requested';
    order.returnRequestedAt = new Date();
    await order.save();

    res.json({ message: 'Return request submitted successfully', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
