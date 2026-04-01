const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // Requirement 9: Zorunlu Alanlar 
    name: { type: String, required: true },
    model: { type: String, required: true },
    serialNumber: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    quantityInStocks: { type: Number, required: true, min: 0 }, // Requirement 3 & 9 [cite: 9, 26]
    price: { type: Number, required: true },
    warrantyStatus: { type: String, required: true },
    distributorInformation: { type: String, required: true },
    
    // Requirement 1 & 7: Kategori ve Arama İçin [cite: 6, 20]
    category: { type: String, required: true }, // Örn: Erkek, Kadın, Akıllı Saat
});

module.exports = mongoose.model('Product', productSchema);