const mongoose = require('mongoose');

// Expanded from a 4-field stub to a full watch listing schema.
// Price is stored as a Number (whole USD) instead of a formatted string
// to enable arithmetic, sorting, and filtering on the backend.
const productSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  brand:           { type: String, required: true },
  price:           { type: Number, required: true },
  image:           { type: String },
  images:          { type: [String], default: [] },
  referenceNumber: { type: String },
  description:     { type: String },
  specs: {
    movement:    { type: String },
    condition:   { type: String },
    boxAndPapers:{ type: Boolean, default: false },
    caseSize:    { type: String },
    year:        { type: Number }
  },
  status:   { type: String, default: 'available' },
  sellerId: { type: String }
});

module.exports = mongoose.model('Product', productSchema);
