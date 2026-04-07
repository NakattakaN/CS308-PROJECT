// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. MONGODB BAĞLANTISI
// ----------------------------------------------------
const MONGO_URI = "mongodb+srv://admin:atakan123@cluster0.yj7znzz.mongodb.net/saatinden_db?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB veritabanına başarıyla bağlanıldı!'))
  .catch((err) => console.error('❌ MongoDB bağlantı hatası:', err));


// ---------------------------------------------------
// 2. VERİTABANI MODELLERİ (SCHEMAS)
// ---------------------------------------------------
const cartItemSchema = new mongoose.Schema({
  quantity: { type: Number, default: 1 },
  addedAt: { type: Date, default: Date.now },
  product: {
    brand: String,
    model: String,
    referenceNumber: String,
    price: { amount: Number, currency: String },
    specs: { movement: String, condition: String, boxAndPapers: Boolean, caseSize: String, year: Number },
    description: String,
    images: [String],
    status: String,
    sellerId: String
  }
});

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  cart: [cartItemSchema] 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  name: String,
  brand: String,
  price: String,
  image: String
});

const Product = mongoose.model('Product', productSchema);


// ----------------------------------------------------
// 3. API ROTALARI (ENDPOINTS)
// ----------------------------------------------------

app.get('/', (req, res) => res.send('Saatinden API tıkır tıkır çalışıyor 🚀'));

// KULLANICI SEPETİNİ GETİR (GET)
app.get('/api/users/:userId/cart', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: "Sunucu hatası", details: error.message });
  }
});

// SEPETE SAAT EKLE (POST)
app.post('/api/users/:userId/cart', async (req, res) => {
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

// TÜM SAATLERİ GETİR (GET) - Ana sayfa için
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find(); 
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Saatler getirilirken hata oluştu uwu", details: error.message });
  }
});

// *YENİ EKLENDİ* TEK BİR SAATİ GETİR (GET) - View Details sayfası için
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Saat bulunamadı!" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "Saat detayı getirilirken hata oluştu", details: error.message });
  }
});

// GEÇİCİ VERİ EKLEME ROTASI
app.post('/api/seed-products', async (req, res) => {
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

// KAYIT OL (REGISTER) API'si
app.post('/api/register', async (req, res) => {
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
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body; 
    const user = await User.findOne({ email: email });

    if (!user) return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı!" });
    if (user.password !== password) return res.status(401).json({ success: false, message: "Hatalı şifre girdiniz!" });

    res.status(200).json({ success: true, message: "Giriş başarılı!", userId: user._id, firstName: user.firstName });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu!" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} adresinde ayaklandı!`));