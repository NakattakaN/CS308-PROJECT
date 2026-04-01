const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Requirement 12 & 13: Order and Delivery tracking [cite: 37, 39]
    customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true },
    deliveryAddress: { type: String, required: true },
    
    // Requirement 3: Status tracking for the user 
    status: { 
        type: String, 
        enum: ['processing', 'in-transit', 'delivered'], 
        default: 'processing' 
    },
    
    // Requirement 12: Delivery completion field 
    isCompleted: { type: Boolean, default: false },

    // Requirement 15: Refund/Return logic 
    purchaseDate: { type: Date, default: Date.now },
    isReturned: { type: Boolean, default: false },
    refundAuthorized: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);