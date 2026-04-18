const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Review = require('../models/Review');

// Returns a Map<productIdString, { averageRating, reviewCount }> covering
// every approved review. Products absent from the map have no approved reviews.
async function loadAggregates(productIds) {
  const match = productIds ? { product: { $in: productIds }, status: 'APPROVED' } : { status: 'APPROVED' };
  const rows = await Review.aggregate([
    { $match: match },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, n: { $sum: 1 } } }
  ]);
  const out = new Map();
  for (const r of rows) {
    out.set(r._id.toString(), {
      averageRating: Math.round(r.avg * 10) / 10,
      reviewCount: r.n
    });
  }
  return out;
}

// TÜM SAATLERİ GETİR (GET) - Ana sayfa için
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().lean();
    const aggregates = await loadAggregates(products.map(p => p._id));
    const enriched = products.map(p => {
      const a = aggregates.get(p._id.toString()) || { averageRating: 0, reviewCount: 0 };
      return { ...p, ...a };
    });
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({
      error: 'Saatler getirilirken hata oluştu',
      details: error.message
    });
  }
});

// TEK BİR SAATİ GETİR (GET) - Details sayfası için
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ message: 'Saat bulunamadı!' });
    }
    const aggregates = await loadAggregates([product._id]);
    const agg = aggregates.get(product._id.toString()) || { averageRating: 0, reviewCount: 0 };
    res.status(200).json({ ...product, ...agg });
  } catch (error) {
    res.status(500).json({
      error: 'Saat detayı getirilirken hata oluştu',
      details: error.message
    });
  }
});

// GEÇİCİ VERİ EKLEME ROTASI
// Tüm ürünleri siler ve güncel örnek ürünleri ekler.
// Schema değişikliklerinden sonra bir kez çalıştırman yeterli.
router.post('/seed-products', async (req, res) => {
  try {
    await Product.deleteMany({});

    const sampleProducts = [
      {
        name: 'Cosmograph Daytona',
        brand: 'Rolex',
        price: 35000,
        image: 'https://ugursaat.com.tr/ugursaat/rolex/img/model_gallery_assets_landscape/slide1_landscape/m126509-0001.png',
        referenceNumber: '116500LN',
        description:
          'The Rolex Cosmograph Daytona is the ultimate chronograph, built for endurance and precision.',
        status: 'available',
        gender: 'erkek',
        strapColor: 'gümüş',
        strapMaterial: 'metal',
        caseShape: 'oval',
        displayType: 'analog',
        specs: {
          movement: 'Automatic',
          condition: 'Excellent',
          boxAndPapers: true,
          caseSize: '40mm',
          year: 2021
        }
      },
      {
        name: 'Nautilus 5711/1A',
        brand: 'Patek Philippe',
        price: 125000,
        image: 'https://img.chrono24.com/images/uhren/25492419-9k5qo6fo8wir2yqthl5ah1hf-ExtraLarge.jpg',
        referenceNumber: '5711/1A-010',
        description:
          'Arguably the most coveted sports watch ever made, the Nautilus 5711 is a horological icon.',
        status: 'available',
        gender: 'erkek',
        strapColor: 'gümüş',
        strapMaterial: 'metal',
        caseShape: 'köşeli',
        displayType: 'analog',
        specs: {
          movement: 'Automatic',
          condition: 'Mint',
          boxAndPapers: true,
          caseSize: '40mm',
          year: 2020
        }
      },
      {
        name: 'Royal Oak',
        brand: 'Audemars Piguet',
        price: 58000,
        image: 'https://www.globalicejewelry.com/cdn/shop/products/new-global-ice-paris-audemars-piguet-royal-oak-15500-41mm-stainless-steel-blue-dial-28426790994081_1000x.png?v=1617139699',
        referenceNumber: '15500ST.OO.1220ST.01',
        description:
          'Designed by Gerald Genta in 1972, the Royal Oak redefined what a luxury sports watch could be.',
        status: 'available',
        gender: 'unisex',
        strapColor: 'gümüş',
        strapMaterial: 'metal',
        caseShape: 'köşeli',
        displayType: 'analog',
        specs: {
          movement: 'Automatic',
          condition: 'Very Good',
          boxAndPapers: true,
          caseSize: '41mm',
          year: 2019
        }
      },
      {
        name: 'Santos de Cartier',
        brand: 'Cartier',
        price: 7200,
        image: 'https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dw32967e7e/images/large/fff63249d8f553379783e41bd235a71b.png?sw=350&sh=350&sm=fit&sfrm=png',
        referenceNumber: 'WSSA0018',
        description:
          'One of the first wristwatches ever made, the Santos is a timeless Cartier classic.',
        status: 'available',
        gender: 'unisex',
        strapColor: 'gümüş',
        strapMaterial: 'metal',
        caseShape: 'köşeli',
        displayType: 'analog',
        specs: {
          movement: 'Automatic',
          condition: 'Good',
          boxAndPapers: false,
          caseSize: '39.8mm',
          year: 2018
        }
      },
      {
        name: 'Speedmaster Professional',
        brand: 'Omega',
        price: 6600,
        image: 'https://www.engsaat.com/productimages/114540/big/omega-o31030425001002.jpg',
        referenceNumber: '311.30.42.30.01.005',
        description:
          'The Moonwatch. The only watch worn on the Moon, manually wound and built for the extremes of space.',
        status: 'available',
        gender: 'erkek',
        strapColor: 'gümüş',
        strapMaterial: 'metal',
        caseShape: 'oval',
        displayType: 'analog',
        specs: {
          movement: 'Manual',
          condition: 'Excellent',
          boxAndPapers: true,
          caseSize: '42mm',
          year: 2022
        }
      },
      {
        name: 'A178WGA-1A',
        brand: 'Casio',
        price: 120,
        image: 'https://www.casio.com/content/dam/casio/product-info/locales/tr/tr/timepiece/product/watch/A/A1/A17/a178wga-1a/assets/A178WGA-1A.png.transform/main-visual-pc/image.png',
        referenceNumber: 'A168WG-9',
        description:
          'A lightweight and iconic digital watch with retro styling and daily practicality.',
        status: 'available',
        gender: 'unisex',
        strapColor: 'altın',
        strapMaterial: 'metal',
        caseShape: 'köşeli',
        displayType: 'dijital',
        specs: {
          movement: 'Digital Quartz',
          condition: 'Excellent',
          boxAndPapers: true,
          caseSize: '36mm',
          year: 2023
        }
      },
      {
        name: 'BGD-565SC-4',
        brand: 'Casio',
        price: 180,
        image: 'https://www.casio.com/content/dam/casio/product-info/locales/intl/en/timepiece/product/watch/B/BG/BGD/bgd-565sc-4/assets/BGD-565SC-4.png',
        referenceNumber: 'BGD-565SC-4',
        description:
          'A sporty digital watch with shock resistance and a playful modern colorway.',
        status: 'available',
        gender: 'kadın',
        strapColor: 'beyaz',
        strapMaterial: 'silikon',
        caseShape: 'köşeli',
        displayType: 'dijital',
        specs: {
          movement: 'Digital Quartz',
          condition: 'New',
          boxAndPapers: true,
          caseSize: '37mm',
          year: 2024
        }
      }
    ];

    await Product.insertMany(sampleProducts);

    res.status(201).json({
      message: 'Örnek saatler güncel filtre değerleriyle eklendi!',
      count: sampleProducts.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Hata oluştu',
      details: error.message
    });
  }
});

module.exports = router;