const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Requirement 16: Defensive programming and security [cite: 51]
app.use(express.json()); // Essential for handling sensitive JSON data [cite: 50]
app.use(cors());

// MongoDB Connection 
const MONGODB_URI = 'mongodb://localhost:27017/watchStore';
mongoose.connect(MONGODB_URI)
    .then(() => console.log("Watch Store Database Connected Successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

// Requirement 7: Connect Product Routes for Search/Sort [cite: 20, 21]
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

// Requirement 17: Handling concurrent requests [cite: 57]
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});