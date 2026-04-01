const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Requirement 13: Mandatory Customer Properties 
    name: { type: String, required: true },
    taxID: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    homeAddress: { type: String, required: true },
    password: { type: String, required: true }, // Must be encrypted 

    // Requirement 10: User Roles 
    role: { 
        type: String, 
        enum: ['customer', 'sales_manager', 'product_manager'], 
        default: 'customer' 
    },

    // Requirement 11 & 13: Wishlist for discount notifications [cite: 29, 39]
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

// Pre-save hook to encrypt password (Defensive Programming) 
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model('User', userSchema);