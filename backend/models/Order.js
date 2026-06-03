const mongoose = require('mongoose');

// ─── Order Item Sub-schema ────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true }, // snapshot at time of order
  image: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  basePrice: { type: Number, required: true },
  variant: {
    name: { type: String, default: '' },
    priceModifier: { type: Number, default: 0 },
  },
  addons: [
    {
      name: { type: String },
      price: { type: Number, default: 0 },
    },
  ],
  unitPrice: { type: Number, required: true }, // basePrice + variant + addons
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  notes: { type: String, default: '' },
});

// ─── Order Schema ─────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    items: [orderItemSchema],
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: { type: String, default: 'Walk-in Customer' },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tableNumber: { type: String, default: '' },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      default: 'dine-in',
    },
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    coupon: {
      code: { type: String, default: '' },
      discountType: { type: String, enum: ['percentage', 'fixed', ''], default: '' },
      discountValue: { type: Number, default: 0 },
    },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'split'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'partial'],
      default: 'pending',
    },
    splitPayment: {
      cash: { type: Number, default: 0 },
      card: { type: Number, default: 0 },
      upi: { type: Number, default: 0 },
    },
    loyaltyPointsEarned: { type: Number, default: 0 },
    loyaltyPointsRedeemed: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    branch: { type: String, default: 'Main Branch' },
    isRefunded: { type: Boolean, default: false },
    refundReason: { type: String, default: '' },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.orderNumber = `ORD-${date}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// ─── Bill Schema ──────────────────────────────────────────────────────────────
const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },
    customerName: { type: String, default: 'Walk-in Customer' },
    customerPhone: { type: String, default: '' },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    taxBreakdown: [
      {
        rate: Number,
        taxable: Number,
        tax: Number,
      },
    ],
    totalTax: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'cash' },
    paymentStatus: { type: String, default: 'paid' },
    qrCode: { type: String, default: '' }, // base64 QR
    pdfUrl: { type: String, default: '' },
    branch: {
      name: { type: String, default: 'Main Branch' },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      gstin: { type: String, default: '' },
    },
    isRefunded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

billSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.invoiceNumber = `INV-${date}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
const Bill = mongoose.model('Bill', billSchema);

module.exports = { Order, Bill };
