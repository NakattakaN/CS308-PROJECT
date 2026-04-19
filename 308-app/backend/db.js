const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB veritabanına başarıyla bağlanıldı!'))
  .catch((err) => console.error('❌ MongoDB bağlantı hatası:', err));
