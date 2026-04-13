const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

// GET    /api/users/:userId/cart          - Returns all items in user's cart
// POST   /api/users/:userId/cart          - Adds a product to cart by productId (snapshots product data)
// DELETE /api/users/:userId/cart/:itemId  - Removes a single item from cart
// DELETE /api/users/:userId/cart          - Clears the entire cart

// KULLANICI SEPETİNİ GETİR (GET)
router.get('/users/:userId/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
});

// SEPETE SAAT EKLE (POST)
// Accepts { productId, quantity } — looks up the product from DB and snapshots it.
// This prevents clients from forging prices by sending arbitrary product data.
router.post('/users/:userId/cart', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: "Saat bulunamadı!" });

    user.cart.push({ product, quantity: quantity || 1 });
    await user.save();
    res.status(200).json({ message: "Saat sepete başarıyla eklendi!", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: "Saat sepete eklenirken hata oluştu", details: error.message });
  }
});

// SEPETTEN ÜRÜN SİL (DELETE)
router.delete('/users/:userId/cart/:itemId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    user.cart = user.cart.filter(item => item._id.toString() !== req.params.itemId);
    await user.save();
    res.status(200).json({ message: "Ürün sepetten silindi!", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
});

// SEPETİ TEMIZLE (DELETE)
router.delete('/users/:userId/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    user.cart = [];
    await user.save();
    res.status(200).json({ message: "Sepet temizlendi!" });
  } catch (error) {
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
});

module.exports = router;
