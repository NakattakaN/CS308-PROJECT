const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { requireAuth, requireSelf } = require('../middleware/auth');
const { generateInvoicePdf } = require('../services/invoicePdf');
const { sendInvoiceEmail } = require('../services/emailService');

// Get wallet balance for a user
router.get('/users/:userId/wallet', requireAuth, requireSelf, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('walletBalance');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ walletBalance: user.walletBalance || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create an order after successful payment
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const { items, shippingAddress, useWallet } = req.body;

    // 1. Atomically decrement stock and capture true price snapshots from each updated doc.
    // Sequential so we can roll back partial decrements on failure.
    const decremented = [];
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        // Roll back already-decremented items
        for (const d of decremented) {
          await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
        }
        return res.status(400).json({ error: `Insufficient stock for ${item.name || item.productId}` });
      }
      decremented.push({ productId: item.productId, quantity: item.quantity });
      item.price = updated.price;
      item.name = updated.name;
      item.brand = updated.brand;
      if (updated.stock <= 0) {
        await Product.findByIdAndUpdate(item.productId, { status: 'out_of_stock' });
      }
    }

    const calculatedTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

    // 2. Atomic wallet decrement. Rolls back stock if balance changed mid-request.
    let walletDeducted = 0;
    if (useWallet) {
      const user = await User.findById(req.userId).select('walletBalance');
      const desired = Math.min(user.walletBalance || 0, calculatedTotal);
      if (desired > 0) {
        const updated = await User.findOneAndUpdate(
          { _id: req.userId, walletBalance: { $gte: desired } },
          { $inc: { walletBalance: -desired } },
          { new: true }
        );
        if (!updated) {
          for (const d of decremented) {
            await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
          }
          return res.status(409).json({ error: 'Wallet balance changed — please try again' });
        }
        walletDeducted = desired;
      }
    }

    const order = await Order.create({
      userId: req.userId,
      items,
      totalAmount: calculatedTotal,
      shippingAddress,
      status: 'Processing'
    });

    // Generate PDF and send email in the background — don't block the response
    const user = await User.findById(req.userId).select('firstName lastName email taxId homeAddress city zipCode');
    if (user?.email) {
      generateInvoicePdf(order, user)
        .then(pdfBuffer => sendInvoiceEmail(
          user.email,
          [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Customer',
          order._id.toString(),
          calculatedTotal,
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
    const staffRoles = ['admin', 'product_manager', 'sales_manager'];
    if (order.userId.toString() !== req.userId && !staffRoles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const targetUserId = order.userId.toString() === req.userId ? req.userId : order.userId;
    const user = await User.findById(targetUserId).select('firstName lastName email taxId homeAddress city zipCode');
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
router.get('/users/:userId/orders', requireAuth, requireSelf, async (req, res) => {
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

    // Refund the full order amount to the customer's wallet
    await User.findByIdAndUpdate(order.userId, {
      $inc: { walletBalance: order.totalAmount }
    });

    order.status = 'Cancelled';
    order.cancelledAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request a return for a specific item in a delivered order
router.post('/orders/:orderId/items/:itemId/return', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.userId.toString() !== req.userId) return res.status(403).json({ message: 'Forbidden' });
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned' });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in this order' });

    if (item.returnStatus !== 'none') {
      return res.status(400).json({ message: 'A return has already been requested for this item' });
    }

    const deliveredDate = order.deliveredAt || order.updatedAt;
    const diffInDays = (Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays >= 30) {
      return res.status(400).json({ message: 'Return window has expired (must be within 30 days of delivery)' });
    }

    item.returnStatus = 'requested';
    item.returnRequestedAt = new Date();
    await order.save();

    res.json({ message: 'Return request submitted successfully', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
