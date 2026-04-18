// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

// KULLANICI SEPETİNİ GETİR
router.get('/users/:userId/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEPETE SAAT EKLE (Miktar Kontrollü)
router.post('/users/:userId/cart', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.params.userId);
    const product = await Product.findById(productId).lean();

    if (!product) return res.status(404).json({ message: "Saat bulunamadı!" });

    const safeQty = Number.parseInt(quantity) || 1;

    // Ürün sepette var mı kontrol et
    const existingIndex = user.cart.findIndex(item => item.product._id.toString() === productId);

    if (existingIndex > -1) {
      user.cart[existingIndex].quantity += safeQty;
    } else {
      user.cart.push({ product, quantity: safeQty });
    }

    await user.save();
    res.status(200).json({ message: "Sepet güncellendi!", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEPETTEKİ MİKTARI GÜNCELLE (+/- Butonları için)
router.put('/users/:userId/cart/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = await User.findById(req.params.userId);
    const cartItem = user.cart.id(req.params.itemId);

    if (!cartItem) return res.status(404).json({ message: "Ürün bulunamadı" });

    cartItem.quantity = Math.max(1, quantity);
    await user.save();
    res.json({ cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEPETTEN ÜRÜN SİL
router.delete('/users/:userId/cart/:itemId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.cart = user.cart.filter(item => item._id.toString() !== req.params.itemId);
    await user.save();
    res.json({ message: "Silindi", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;