const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');

// KAYIT OL (REGISTER) API'si
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (existingUser) return res.status(400).json({ success: false, message: "Bu e-posta adresi zaten kullanımda!" });

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const newUser = new User({ firstName, lastName, email, password, role: 'user', cart: [] });
    await newUser.save();
    res.status(201).json({ success: true, message: "Kayıt başarıyla oluşturuldu!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu!" });
  }
});

// GİRİŞ YAP (LOGIN) API'si
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
    if (user.password !== password) return res.status(401).json({ success: false, message: "Hatalı şifre girdiniz!" });

    user.authToken = crypto.randomBytes(32).toString('hex');
    await user.save();

    res.status(200).json({
      success: true,
      message: "Giriş başarılı!",
      userId: user._id,
      firstName: user.firstName,
      token: user.authToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu!" });
  }
});

module.exports = router;
