const express = require('express');
const router = express.Router();
const User = require('../models/User');

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
router.post('/users/:userId/cart', async (req, res) => {
  try {
    const { product, quantity } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });

    user.cart.push({ product: product, quantity: quantity || 1 });
    await user.save();
    res.status(200).json({ message: "Saat sepete başarıyla eklendi!", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: "Saat sepete eklenirken hata oluştu", details: error.message });
  }
});

module.exports = router;
