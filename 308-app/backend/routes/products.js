const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// TÜM SAATLERİ GETİR (GET) - Ana sayfa için
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Saatler getirilirken hata oluştu uwu", details: error.message });
  }
});

// *YENİ EKLENDİ* TEK BİR SAATİ GETİR (GET) - View Details sayfası için
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Saat bulunamadı!" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "Saat detayı getirilirken hata oluştu", details: error.message });
  }
});

// GEÇİCİ VERİ EKLEME ROTASI
router.post('/seed-products', async (req, res) => {
  try {
    const sampleProducts = [
      { name: "Cosmograph Daytona", brand: "Rolex", price: "$35,000", image: "https://images.unsplash.com/photo-1587839622661-f3e0bf46c3ff?auto=format&fit=crop&q=80&w=600" },
      { name: "Nautilus 5711/1A", brand: "Patek Philippe", price: "$125,000", image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=600" },
      { name: "Royal Oak", brand: "Audemars Piguet", price: "$58,000", image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=600" },
      { name: "Santos de Cartier", brand: "Cartier", price: "$7,200", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600" },
      { name: "Speedmaster Professional", brand: "Omega", price: "$6,600", image: "https://images.unsplash.com/photo-1639006570490-79c0c53f1080?auto=format&fit=crop&q=80&w=600" }
    ];
    await Product.insertMany(sampleProducts);
    res.status(201).json({ message: "Örnek saatler eklendi! ✨" });
  } catch (error) {
    res.status(500).json({ error: "Hata oluştu" });
  }
});

module.exports = router;
