const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');

// Basic RFC-5322-ish check: non-empty local, @, non-empty domain with a dot.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// At least 8 chars, one letter, one digit.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// KAYIT OL (REGISTER) API'si
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Tüm alanlar zorunludur!" });
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Geçerli bir e-posta adresi giriniz!" });
    }
    if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ success: false, message: "Şifre en az 8 karakter olmalı ve en az bir harf ile bir rakam içermelidir." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ success: false, message: "Bu e-posta adresi zaten kullanımda!" });

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const newUser = new User({ firstName, lastName, email: normalizedEmail, password, role: 'user', cart: [] });
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
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
    if (user.password !== password) return res.status(401).json({ success: false, message: "Hatalı şifre girdiniz!" });

    // Reuse existing token so other open sessions stay valid.
    // Only generate a new token if there isn't one (e.g. first login after registration).
    if (!user.authToken) {
      user.authToken = crypto.randomBytes(32).toString('hex');
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Giriş başarılı!",
      userId: user._id,
      firstName: user.firstName,
      role: user.role || 'user',
      token: user.authToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu!" });
  }
});

module.exports = router;
