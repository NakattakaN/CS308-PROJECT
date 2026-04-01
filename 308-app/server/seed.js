const mongoose = require('mongoose');
const Product = require('./models/Product'); // Ensure path is correct

const MONGODB_URI = 'mongodb://localhost:27017/watchStore';

const seedProducts = [
    {
        name: "Rolex Submariner",
        model: "126610LN",
        serialNumber: "RLX-992834",
        description: "Classic diver watch with a black dial and rotatable bezel.",
        quantityInStocks: 5, // Requirement 3 & 9 [cite: 9, 26]
        price: 15000,
        warrantyStatus: "5 Years International",
        distributorInformation: "Rolex SA Official",
        category: "Luxury"
    },
    {
        name: "Casio G-Shock",
        model: "DW5600E-1V",
        serialNumber: "CAS-112233",
        description: "Shock resistant digital watch with 200M water resistance.",
        quantityInStocks: 50,
        price: 50,
        warrantyStatus: "2 Years",
        distributorInformation: "Casio Europe",
        category: "Sport"
    },
    {
        name: "Apple Watch Series 9",
        model: "A2978",
        serialNumber: "APL-556677",
        description: "Advanced health features and faster S9 chip.",
        quantityInStocks: 0, // Testing out-of-stock logic 
        price: 399,
        warrantyStatus: "1 Year AppleCare",
        distributorInformation: "Apple Inc.",
        category: "Smartwatch"
    }
];

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log("Connected to MongoDB...");
        await Product.deleteMany({}); // Clears old data
        await Product.insertMany(seedProducts);
        console.log("Database Seeded successfully!");
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });