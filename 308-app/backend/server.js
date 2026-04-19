require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => { res.charset = 'utf-8'; next(); });

app.get('/', (req, res) => res.send('Saatinden API tıkır tıkır çalışıyor 🚀'));

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/cart'));
app.use('/api', require('./routes/reviews'));
app.use('/api', require('./routes/seed'));
app.use('/api', require('./routes/offers'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} adresinde ayaklandı!`));
