const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then((conn) => console.log(`✅ MongoDB veritabanına başarıyla bağlanıldı! (Database: ${conn.connection.name})`))
  .catch((err) => console.error('❌ MongoDB bağlantı hatası:', err));
