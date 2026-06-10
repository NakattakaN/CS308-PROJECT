const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { requireAuth, requireProductManager } = require('../middleware/auth');

// Public — list all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Product manager — create a category
router.post('/admin/categories', requireAuth, requireProductManager, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(409).json({ message: 'Category already exists' });

    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Product manager — delete a category and unset it on all products
router.delete('/admin/categories/:id', requireAuth, requireProductManager, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await Product.updateMany({ category: req.params.id }, { $set: { category: null } });

    res.json({ message: 'Category deleted and removed from all products' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
