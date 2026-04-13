const mongoose = require('mongoose');

const GENDER_VALUES = ['kadın', 'erkek', 'unisex'];
const STRAP_MATERIAL_VALUES = ['metal', 'deri', 'silikon'];
const CASE_SHAPE_VALUES = ['oval', 'köşeli'];
const DISPLAY_TYPE_VALUES = ['analog', 'dijital'];
const STRAP_COLOR_VALUES = [
  'gümüş',
  'altın',
  'mavi',
  'yeşil',
  'sarı',
  'kırmızı',
  'turuncu',
  'mor',
  'kahverengi',
  'pembe',
  'siyah',
  'beyaz'
];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true, trim: true },

    referenceNumber: { type: String, trim: true },
    description: { type: String, default: '', trim: true },

    status: {
      type: String,
      enum: ['available', 'out_of_stock'],
      default: 'available'
    },

    gender: {
      type: String,
      enum: GENDER_VALUES,
      default: 'unisex'
    },

    strapColor: {
      type: String,
      enum: STRAP_COLOR_VALUES,
      default: 'siyah',
      trim: true
    },

    strapMaterial: {
      type: String,
      enum: STRAP_MATERIAL_VALUES,
      default: 'metal',
      trim: true
    },

    caseShape: {
      type: String,
      enum: CASE_SHAPE_VALUES,
      default: 'oval'
    },

    displayType: {
      type: String,
      enum: DISPLAY_TYPE_VALUES,
      default: 'analog'
    },

    specs: {
      movement: { type: String, default: '', trim: true },
      condition: { type: String, default: '', trim: true },
      boxAndPapers: { type: Boolean, default: false },
      caseSize: { type: String, default: '', trim: true },
      year: { type: Number }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);