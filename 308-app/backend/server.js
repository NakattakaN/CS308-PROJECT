// backend/server.js
const express = require('express');
const cors = require('cors');
require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Saatinden API tıkır tıkır çalışıyor 🚀'));

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/cart'));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} adresinde ayaklandı!`));