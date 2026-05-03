// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

// YARDIMCI FONKSİYON: Sepet verisine güncel mağaza stoğunu ekler
const populateCartWithStock = async (cart) => {
  const updatedCart = [];
  for (let item of cart) {
    const plainItem = item.toObject ? item.toObject() : item;
    
    const freshProduct = await Product.findById(plainItem.product._id).lean();
    if (freshProduct) {
      updatedCart.push({
        ...plainItem,
        product: {
          ...plainItem.product,
          stock: freshProduct.stock,      
          quantity: freshProduct.quantity  
        }
      });
    }
  }
  return updatedCart;
};

// KULLANICI SEPETİNİ GETİR
router.get('/users/:userId/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    
    const cartWithStock = await populateCartWithStock(user.cart);
    res.json(cartWithStock);
  } catch (error) {
    console.error("GET Sepet Hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// SEPETE SAAT EKLE (Miktar Kontrollü - Sıkı Denetim)
router.post('/users/:userId/cart', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const user = await User.findById(req.params.userId);
    
    // Ürünün en güncel stok bilgisini doğrudan Product koleksiyonundan çekiyoruz
    const product = await Product.findById(productId);

    if (!product) return res.status(404).json({ message: "Saat bulunamadı!" });

    const safeQty = Number.parseInt(quantity) || 1;
    const currentStock = product.stock || product.quantity || 0; // Veritabanındaki gerçek stok

    // Ürün zaten sepette var mı?
    const existingIndex = user.cart.findIndex(item => item.product._id.toString() === productId);

    if (existingIndex > -1) {
      // KRİTİK KONTROL: Sepetteki miktar + Yeni eklenen miktar > Gerçek Stok
      const totalPlannedQuantity = user.cart[existingIndex].quantity + safeQty;
      
      if (totalPlannedQuantity > currentStock) {
        return res.status(400).json({ 
          message: `Stok sınırı aşıldı! Sepetinizde zaten ${user.cart[existingIndex].quantity} adet var. En fazla ${currentStock - user.cart[existingIndex].quantity} adet daha ekleyebilirsiniz.` 
        });
      }
      user.cart[existingIndex].quantity = totalPlannedQuantity;
    } else {
      // Ürün ilk kez ekleniyorsa sadece stok kontrolü yap
      if (safeQty > currentStock) {
        return res.status(400).json({ message: `Yetersiz stok! En fazla ${currentStock} adet ekleyebilirsiniz.` });
      }
      user.cart.push({ product, quantity: safeQty });
    }

    await user.save();
    
    // Güncel sepeti (yeni yazdığımız populate fonksiyonuyla) döndür
    const cartWithStock = await populateCartWithStock(user.cart);
    res.status(200).json({ message: "Sepet güncellendi!", cart: cartWithStock });
  } catch (error) {
    console.error("POST Hatası:", error);
    res.status(500).json({ error: error.message });
  }
});

// SEPETTEKİ MİKTARI GÜNCELLE (+/- Butonları için)
router.put('/users/:userId/cart/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = await User.findById(req.params.userId);
    
    // Sepetteki ürünü bul
    const cartItem = user.cart.find(item => item._id.toString() === req.params.itemId);
    if (!cartItem) return res.status(404).json({ message: "Ürün sepette bulunamadı" });

    // Orijinal ürünü veritabanından bul
    const product = await Product.findById(cartItem.product._id);
    if (!product) return res.status(404).json({ message: "Orijinal ürün bulunamadı" });
    
    // --- GÜVENLİK KALKANI (NaN Hatalarını Önler) ---
    
    // 1. React'tan gelen miktarı güvenli bir tam sayıya çevir
    let newQty = parseInt(quantity, 10);
    // Eğer sayıya çevrilemiyorsa, ürünün sepetteki mevcut miktarını kullan
    if (isNaN(newQty)) {
      newQty = cartItem.quantity || 1;
    }

    // 2. Veritabanındaki mağaza stoğunu güvenli bir tam sayıya çevir
    // (Modelde ismi quantity veya stock olabilir, ikisini de kontrol ediyoruz)
    let maxQty = parseInt(product.quantity, 10);
    if (isNaN(maxQty)) {
      maxQty = parseInt(product.stock, 10);
    }
    // Her iki durumda da mağaza stoğu gelmiyorsa (undefined ise) çökmemesi için 99 kabul et
    if (isNaN(maxQty)) {
      maxQty = 99; 
    }

    // 3. Miktarı hesapla ve kaydet (Artık NaN olma ihtimali sıfır)
    cartItem.quantity = Math.min(Math.max(1, newQty), maxQty);
    
    // Değişikliği Mongoose'a bildir
    user.markModified('cart');
    await user.save();
    
    // Güncel veriyi React'a gönder
    const cartWithStock = await populateCartWithStock(user.cart);
    res.json({ cart: cartWithStock });
  } catch (error) {
    console.error("PUT Güncelleme Hatası:", error); 
    res.status(500).json({ error: error.message });
  }
});

// TÜM SEPETİ TEMİZLE (ödeme sonrası)
router.delete('/users/:userId/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    user.cart = [];
    await user.save();
    res.json({ message: 'Sepet temizlendi', cart: [] });
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
    
    const cartWithStock = await populateCartWithStock(user.cart);
    res.json({ message: "Silindi", cart: cartWithStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;