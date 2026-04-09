const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://admin:atakan123@cluster0.yj7znzz.mongodb.net/saatinden_db?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB veritabanına başarıyla bağlanıldı!'))
  .catch((err) => console.error('❌ MongoDB bağlantı hatası:', err));
