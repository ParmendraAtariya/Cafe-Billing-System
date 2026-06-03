const mongoose = require('mongoose');

// ─── Customer Schema ──────────────────────────────────────────────────────────
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, default: '' },
    phone: { type: String, default: '' },
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    membership: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    membershipExpiry: { type: Date },
    birthday: { type: Date },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    branch: { type: String, default: 'Main Branch' },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', email: 'text', phone: 'text' });

// ─── Inventory Schema ─────────────────────────────────────────────────────────
const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'ingredient' },
    unit: { type: String, required: true, default: 'kg' }, // kg, g, litre, ml, pcs
    currentStock: { type: Number, required: true, default: 0 },
    minStockLevel: { type: Number, default: 10 }, // low-stock threshold
    maxStockLevel: { type: Number, default: 100 },
    costPerUnit: { type: Number, default: 0 },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    lastRestocked: { type: Date },
    purchaseLogs: [
      {
        quantity: Number,
        costPerUnit: Number,
        totalCost: Number,
        supplier: String,
        date: { type: Date, default: Date.now },
        notes: String,
      },
    ],
    isActive: { type: Boolean, default: true },
    branch: { type: String, default: 'Main Branch' },
  },
  { timestamps: true }
);

inventorySchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minStockLevel;
});

// ─── Coupon Schema ────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String, default: '' },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: null }, // cap for percentage coupons
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function (orderAmount) {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (now < this.validFrom) return { valid: false, reason: 'Coupon not yet active' };
  if (now > this.validUntil) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit)
    return { valid: false, reason: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount)
    return { valid: false, reason: `Minimum order ₹${this.minOrderAmount} required` };
  return { valid: true };
};

// ─── Table Schema ─────────────────────────────────────────────────────────────
const tableSchema = new mongoose.Schema(
  {
    tableNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, default: 4 },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    location: { type: String, default: 'main-hall' }, // main-hall, outdoor, private
    qrCode: { type: String, default: '' },
    branch: { type: String, default: 'Main Branch' },
  },
  { timestamps: true }
);

// ─── Supplier Schema ──────────────────────────────────────────────────────────
const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    address: { type: String, default: '' },
    products: [{ type: String }],
    gstin: { type: String, default: '' },
    paymentTerms: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// ─── Notification Schema ──────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['order', 'inventory', 'system', 'payment', 'alert'],
      default: 'system',
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = broadcast
    },
    role: { type: String, default: '' }, // target role
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// ─── Activity Log Schema ──────────────────────────────────────────────────────
const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entity: { type: String, default: '' }, // 'order', 'product', etc.
    entityId: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
);

const Customer = mongoose.model('Customer', customerSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Table = mongoose.model('Table', tableSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = { Customer, Inventory, Coupon, Table, Supplier, Notification, ActivityLog };
