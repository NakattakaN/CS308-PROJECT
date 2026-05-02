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

    // Decrement stock for each ordered item
    await Promise.all(items.map(item =>
      Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      })
    ));

    const order = await Order.create({
      userId: req.userId,
      items,
      totalAmount,
      shippingAddress
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
    if (order.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });

    const user = await User.findById(req.userId).select('firstName lastName email');
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
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
