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
// Wipes all existing products and inserts fresh sample data.
// Run once after schema changes to ensure clean data in the DB.
router.post('/seed-products', async (req, res) => {
  try {
    await Product.deleteMany({});
    const sampleProducts = [
      {
        name: "Cosmograph Daytona", brand: "Rolex", price: 35000,
        image: "https://images.unsplash.com/photo-1587839622661-f3e0bf46c3ff?auto=format&fit=crop&q=80&w=600",
        referenceNumber: "116500LN",
        description: "The Rolex Cosmograph Daytona is the ultimate chronograph, built for endurance and precision.",
        specs: { movement: "Automatic", condition: "Excellent", boxAndPapers: true, caseSize: "40mm", year: 2021 },
        status: "available"
      },
      {
        name: "Nautilus 5711/1A", brand: "Patek Philippe", price: 125000,
        image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=600",
        referenceNumber: "5711/1A-010",
        description: "Arguably the most coveted sports watch ever made, the Nautilus 5711 is a horological icon.",
        specs: { movement: "Automatic", condition: "Mint", boxAndPapers: true, caseSize: "40mm", year: 2020 },
        status: "available"
      },
      {
        name: "Royal Oak", brand: "Audemars Piguet", price: 58000,
        image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=600",
        referenceNumber: "15500ST.OO.1220ST.01",
        description: "Designed by Gerald Genta in 1972, the Royal Oak redefined what a luxury sports watch could be.",
        specs: { movement: "Automatic", condition: "Very Good", boxAndPapers: true, caseSize: "41mm", year: 2019 },
        status: "available"
      },
      {
        name: "Santos de Cartier", brand: "Cartier", price: 7200,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600",
        referenceNumber: "WSSA0018",
        description: "One of the first wristwatches ever made, the Santos is a timeless Cartier classic.",
        specs: { movement: "Automatic", condition: "Good", boxAndPapers: false, caseSize: "39.8mm", year: 2018 },
        status: "available"
      },
      {
        name: "Speedmaster Professional", brand: "Omega", price: 6600,
        image: "https://images.unsplash.com/photo-1639006570490-79c0c53f1080?auto=format&fit=crop&q=80&w=600",
        referenceNumber: "311.30.42.30.01.005",
        description: "The Moonwatch. The only watch worn on the Moon, manually wound and built for the extremes of space.",
        specs: { movement: "Manual", condition: "Excellent", boxAndPapers: true, caseSize: "42mm", year: 2022 },
        status: "available"
      }
    ];
    await Product.insertMany(sampleProducts);
    res.status(201).json({ message: "Örnek saatler eklendi! ✨" });
  } catch (error) {
    res.status(500).json({ error: "Hata oluştu" });
  }
});

module.exports = router;
