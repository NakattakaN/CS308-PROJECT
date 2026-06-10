const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

// Basic RFC-5322-ish check: non-empty local, @, non-empty domain with a dot.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// At least 8 chars, one letter, one digit.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// KAYIT OL (REGISTER) API'si
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, taxId, homeAddress } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address!" });
    }
    if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain at least one letter and one number." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(400).json({ success: false, message: "This email address is already in use!" });

    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ firstName, lastName, email: normalizedEmail, password: hashedPassword, taxId, homeAddress, role: 'user', cart: [] });
    await newUser.save();
    res.status(201).json({ success: true, message: "Registration successful!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error occurred!" });
  }
});

// GİRİŞ YAP (LOGIN) API'si
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ success: false, message: "User not found!" });

    // Backward-compatible: if password isn't a bcrypt hash (legacy plaintext),
    // verify plaintext and auto-upgrade to hash.
    let passwordMatch;
    if (user.password.startsWith('$2')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMatch = user.password === password;
      if (passwordMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    }
    if (!passwordMatch) return res.status(401).json({ success: false, message: "Incorrect password entered!" });

    // Reuse existing token so other open sessions stay valid.
    // Only generate a new token if there isn't one (e.g. first login after registration).
    if (!user.authToken) {
      user.authToken = crypto.randomBytes(32).toString('hex');
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Login successful!",
      userId: user._id,
      firstName: user.firstName,
      role: user.role || 'user',
      token: user.authToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error occurred!" });
  }
});

const { requireAuth } = require('../middleware/auth');

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -cart -wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (address, taxId)
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { taxId, homeAddress, city, zipCode, firstName, lastName } = req.body;
    
    // Allow updating only safe fields
    const updates = {};
    if (taxId !== undefined) updates.taxId = taxId;
    if (homeAddress !== undefined) updates.homeAddress = homeAddress;
    if (city !== undefined) updates.city = city;
    if (zipCode !== undefined) updates.zipCode = zipCode;
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password -cart -wishlist');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
