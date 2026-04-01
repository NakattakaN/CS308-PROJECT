const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Requirement 7: Search by name/description & Sort by price/popularity [cite: 20, 21]
router.get('/', async (req, res) => {
    try {
        const { search, sort } = req.query;
        let query = {};

        // Search logic [cite: 20]
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }

        let products = Product.find(query);

        // Sorting logic [cite: 21]
        if (sort === 'price_asc') products = products.sort({ price: 1 });
        if (sort === 'price_desc') products = products.sort({ price: -1 });

        const result = await products;
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});
 
module.exports = router;