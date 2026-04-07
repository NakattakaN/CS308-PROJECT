// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware'ler (React'ten gelen istekleri kabul etmek için)
app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// 1. MONGODB BAĞLANTISI
// ----------------------------------------------------
// BURAYI KENDİ MONGODB ATLAS BAĞLANTI LİNKİNLE DEĞİŞTİR:
const MONGO_URI = "mongodb+srv://admin:atakan123@cluster0.yj7znzz.mongodb.net/saatinden_db?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB veritabanına başarıyla bağlanıldı!'))
  .catch((err) => console.error('❌ MongoDB bağlantı hatası:', err));



// 2. VERİTABANI MODELLERİ (SCHEMAS)
// ---------------------------------------------------
// Sepetteki Saat (Ürün) Şeması
const cartItemSchema = new mongoose.Schema({
  quantity: { type: Number, default: 1 },
  addedAt: { type: Date, default: Date.now },
  product: {
    brand: String,
    model: String,
    referenceNumber: String,
    price: {
      amount: Number,
      currency: String
    },
    specs: {
      movement: String,
      condition: String,
      boxAndPapers: Boolean,
      caseSize: String,
      year: Number
    },
    description: String,
    images: [String],
    status: String,
    sellerId: String
  }
});

// Kullanıcı Şeması
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  cart: [cartItemSchema] // Sepet dizisi yukarıdaki şemayı kullanıyor
}, { timestamps: true });

const User = mongoose.model('User', userSchema);


// ----------------------------------------------------
// 3. API ROTALARI (ENDPOINTS)
// ----------------------------------------------------

// TEST ROTASI: Sunucunun çalışıp çalışmadığını kontrol etmek için
app.get('/', (req, res) => {
  res.send('Saatinden API tıkır tıkır çalışıyor 🚀');
});

// KULLANICI SEPETİNİ GETİR (GET)
// React'te sepet sayfasına girildiğinde bu çalışacak
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
// React'te "Sepete Ekle" butonuna basıldığında bu çalışacak
app.post('/api/users/:userId/cart', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { product, quantity } = req.body; // React'ten gelecek saat verisi

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı!" });

    // Saati kullanıcının sepetine ekle
    user.cart.push({
      product: product,
      quantity: quantity || 1
    });

    // Veritabanını güncelle
    await user.save();
    
    res.status(200).json({ message: "Saat sepete başarıyla eklendi!", cart: user.cart });
  } catch (error) {
    res.status(500).json({ error: "Saat sepete eklenirken hata oluştu", details: error.message });
  }
});


// ----------------------------------------------------
// 4. SUNUCUYU BAŞLAT
// ----------------------------------------------------

// KAYIT OL (REGISTER) API'si
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // 1. Bu e-posta ile daha önce kayıt olunmuş mu kontrol et
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Bu e-posta adresi zaten kullanımda!" });
    }

    // 2. React'ten gelen 'fullName' bilgisini 'firstName' ve 'lastName' olarak ikiye böl
    // (Çünkü veritabanı şemamızda adı ve soyadı ayrı tutuyoruz)
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // 3. Yeni kullanıcıyı oluştur
    const newUser = new User({
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password, // İleride bu şifreyi güvenlik için bcrypt ile şifreleyeceğiz
      role: 'user',
      cart: []
    });

    // 4. Veritabanına kaydet
    await newUser.save();

    // BURAYI EKLE:
    console.log("Veri veritabanına yazıldı. Orijinal kayıt:", newUser);
    console.log("Kullanılan veritabanı:", mongoose.connection.name);

    res.status(201).json({ success: true, message: "Kayıt başarıyla oluşturuldu!" });

  } catch (error) {
    console.error("Kayıt hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu!" });
  }
});

const PORT = 5000;
// GİRİŞ YAP (LOGIN) API'si
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body; // React'ten gelen email ve şifre
    
    // BURAYA ŞU İKİ SATIRI EKLE:
    console.log("React'ten gelen email: >" + email + "<");
    console.log("React'ten gelen şifre: >" + password + "<");

    // 1. Veritabanında bu emaile sahip kullanıcıyı bul
    const user = await User.findOne({ email: email });

    // 2. Kullanıcı yoksa hata dön
    if (!user) {
      return res.status(404).json({ success: false, message: "Bu e-posta ile kayıtlı kullanıcı bulunamadı!" });
    }

    // 3. Şifre eşleşmiyor mu kontrol et
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Hatalı şifre girdiniz!" });
    }

    // 4. Her şey doğruysa başarılı mesajı ve kullanıcının ID'sini gönder
    res.status(200).json({ success: true, message: "Giriş başarılı!", userId: user._id });

  } catch (error) {
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu!" });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Sunucu http://localhost:${PORT} adresinde ayaklandı!`);
});