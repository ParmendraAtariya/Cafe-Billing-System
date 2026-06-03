const mongoose = require('mongoose');

// ─── Category Schema ──────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    icon: { type: String, default: '☕' },
    color: { type: String, default: '#00704A' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ─── Product Schema ───────────────────────────────────────────────────────────
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Small", "Medium", "Large"
  priceModifier: { type: Number, default: 0 }, // added to base price
  sku: { type: String, default: '' },
});

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Extra Shot", "Oat Milk"
  price: { type: Number, required: true, default: 0 },
  isAvailable: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: { type: String, default: '' },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: { type: String, default: '' },
    variants: [variantSchema],
    addons: [addonSchema],
    tags: [{ type: String }],
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    taxRate: {
      type: Number,
      default: function () {
        return parseFloat(process.env.DEFAULT_GST_RATE) || 18;
      },
    },
    stock: {
      type: Number,
      default: -1, // -1 = unlimited
    },
    soldCount: { type: Number, default: 0 },
    rating: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    barcode: { type: String, default: '' },
    branch: { type: String, default: 'Main Branch' },
  },
  { timestamps: true }
);

// Virtual: effective price (base + any modifier)
productSchema.virtual('priceWithTax').get(function () {
  return this.basePrice * (1 + this.taxRate / 100);
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

module.exports = { Category, Product };
