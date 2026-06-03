// ─── Category Routes ──────────────────────────────────────────────────────────
const express = require('express');
const { Category } = require('../models/Product');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { sendResponse, createError } = require('../utils/helpers');

const categoryRouter = express.Router();
categoryRouter.get('/', protect, async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('sortOrder');
  sendResponse(res, 200, 'Categories fetched', { categories });
});
categoryRouter.post('/', protect, adminOnly, async (req, res) => {
  const category = await Category.create(req.body);
  sendResponse(res, 201, 'Category created', { category });
});
categoryRouter.put('/:id', protect, adminOnly, async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) return next(createError(404, 'Category not found'));
  sendResponse(res, 200, 'Category updated', { category });
});
categoryRouter.delete('/:id', protect, adminOnly, async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(createError(404, 'Category not found'));
  sendResponse(res, 200, 'Category deleted');
});

// ─── Bill Routes ──────────────────────────────────────────────────────────────
const { Bill } = require('../models/Order');
const billRouter = express.Router();
billRouter.get('/', protect, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = req.user.role !== 'admin' ? { employeeId: req.user._id } : {};
  const bills = await Bill.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('order employeeId', 'orderNumber name email');
  const total = await Bill.countDocuments(query);
  sendResponse(res, 200, 'Bills fetched', { data: bills, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
});
billRouter.get('/:id', protect, async (req, res, next) => {
  const bill = await Bill.findById(req.params.id).populate('order employeeId customer');
  if (!bill) return next(createError(404, 'Bill not found'));
  sendResponse(res, 200, 'Bill fetched', { bill });
});

// ─── Inventory Routes ─────────────────────────────────────────────────────────
const { Inventory, Supplier } = require('../models/Other');
const inventoryRouter = express.Router();
inventoryRouter.get('/', protect, async (req, res) => {
  const items = await Inventory.find().populate('supplier', 'name phone');
  sendResponse(res, 200, 'Inventory fetched', { items });
});
inventoryRouter.get('/low-stock', protect, async (req, res) => {
  const items = await Inventory.find({ $expr: { $lte: ['$currentStock', '$minStockLevel'] } });
  sendResponse(res, 200, 'Low stock items', { items });
});
inventoryRouter.post('/', protect, adminOnly, async (req, res) => {
  const item = await Inventory.create(req.body);
  sendResponse(res, 201, 'Inventory item created', { item });
});
inventoryRouter.put('/:id', protect, adminOnly, async (req, res, next) => {
  const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return next(createError(404, 'Inventory item not found'));
  sendResponse(res, 200, 'Inventory updated', { item });
});
inventoryRouter.post('/:id/restock', protect, adminOnly, async (req, res, next) => {
  const { quantity, costPerUnit, notes } = req.body;
  const item = await Inventory.findById(req.params.id);
  if (!item) return next(createError(404, 'Inventory item not found'));
  item.currentStock += quantity;
  item.lastRestocked = new Date();
  item.purchaseLogs.push({ quantity, costPerUnit, totalCost: quantity * costPerUnit, notes, date: new Date() });
  await item.save();
  sendResponse(res, 200, 'Restocked successfully', { item });
});

// ─── Customer Routes ──────────────────────────────────────────────────────────
const { Customer } = require('../models/Other');
const customerRouter = express.Router();
customerRouter.get('/', protect, async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const query = search ? { $text: { $search: search } } : {};
  const customers = await Customer.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
  const total = await Customer.countDocuments(query);
  sendResponse(res, 200, 'Customers fetched', { data: customers, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
});
customerRouter.get('/:id', protect, async (req, res, next) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return next(createError(404, 'Customer not found'));
  const orders = await require('../models/Order').Order.find({ customer: req.params.id }).sort('-createdAt').limit(10);
  sendResponse(res, 200, 'Customer fetched', { customer, recentOrders: orders });
});
customerRouter.post('/', protect, async (req, res) => {
  const customer = await Customer.create(req.body);
  sendResponse(res, 201, 'Customer created', { customer });
});
customerRouter.put('/:id', protect, async (req, res, next) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) return next(createError(404, 'Customer not found'));
  sendResponse(res, 200, 'Customer updated', { customer });
});

// ─── Coupon Routes ────────────────────────────────────────────────────────────
const { Coupon, Table, Notification } = require('../models/Other');
const couponRouter = express.Router();
couponRouter.get('/', protect, adminOnly, async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  sendResponse(res, 200, 'Coupons fetched', { coupons });
});
couponRouter.post('/', protect, adminOnly, async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  sendResponse(res, 201, 'Coupon created', { coupon });
});
couponRouter.post('/validate', protect, async (req, res, next) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code?.toUpperCase() });
  if (!coupon) return next(createError(404, 'Invalid coupon code'));
  const result = coupon.isValid(orderAmount || 0);
  if (!result.valid) return next(createError(400, result.reason));
  let discount = coupon.discountType === 'percentage'
    ? Math.min((orderAmount * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
    : coupon.discountValue;
  sendResponse(res, 200, 'Coupon valid', { coupon, discountAmount: discount });
});
couponRouter.put('/:id', protect, adminOnly, async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) return next(createError(404, 'Coupon not found'));
  sendResponse(res, 200, 'Coupon updated', { coupon });
});
couponRouter.delete('/:id', protect, adminOnly, async (req, res, next) => {
  await Coupon.findByIdAndDelete(req.params.id);
  sendResponse(res, 200, 'Coupon deleted');
});

// ─── Table Routes ─────────────────────────────────────────────────────────────
const tableRouter = express.Router();
tableRouter.get('/', protect, async (req, res) => {
  const tables = await Table.find().populate('currentOrder');
  sendResponse(res, 200, 'Tables fetched', { tables });
});
tableRouter.post('/', protect, adminOnly, async (req, res) => {
  const table = await Table.create(req.body);
  sendResponse(res, 201, 'Table created', { table });
});
tableRouter.put('/:id', protect, async (req, res, next) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!table) return next(createError(404, 'Table not found'));
  sendResponse(res, 200, 'Table updated', { table });
});

// ─── Supplier Routes ──────────────────────────────────────────────────────────
const supplierRouter = express.Router();
supplierRouter.get('/', protect, adminOnly, async (req, res) => {
  const suppliers = await Supplier.find({ isActive: true });
  sendResponse(res, 200, 'Suppliers fetched', { suppliers });
});
supplierRouter.post('/', protect, adminOnly, async (req, res) => {
  const supplier = await Supplier.create(req.body);
  sendResponse(res, 201, 'Supplier created', { supplier });
});
supplierRouter.put('/:id', protect, adminOnly, async (req, res, next) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!supplier) return next(createError(404, 'Supplier not found'));
  sendResponse(res, 200, 'Supplier updated', { supplier });
});

// ─── Notification Routes ──────────────────────────────────────────────────────
const notificationRouter = express.Router();
notificationRouter.get('/', protect, async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ recipient: req.user._id }, { recipient: null, role: req.user.role }],
  }).sort('-createdAt').limit(50);
  sendResponse(res, 200, 'Notifications fetched', { notifications });
});
notificationRouter.put('/:id/read', protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  sendResponse(res, 200, 'Marked as read');
});
notificationRouter.put('/read-all', protect, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
  sendResponse(res, 200, 'All notifications marked as read');
});

// ─── User Management Routes ───────────────────────────────────────────────────
const User = require('../models/User');
const userRouter = express.Router();
userRouter.get('/', protect, adminOnly, async (req, res) => {
  const users = await User.find().sort('-createdAt');
  sendResponse(res, 200, 'Users fetched', { users });
});
userRouter.get('/:id', protect, adminOnly, async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(createError(404, 'User not found'));
  sendResponse(res, 200, 'User fetched', { user });
});
userRouter.put('/:id', protect, adminOnly, async (req, res, next) => {
  const { password, ...rest } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true });
  if (!user) return next(createError(404, 'User not found'));
  sendResponse(res, 200, 'User updated', { user });
});
userRouter.delete('/:id', protect, adminOnly, async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return next(createError(404, 'User not found'));
  sendResponse(res, 200, 'User deactivated');
});

// ─── Upload Routes ────────────────────────────────────────────────────────────
const { cloudinary, uploadProduct, uploadAvatar } = require('../config/cloudinary');
const uploadRouter = express.Router();
uploadRouter.post('/product-image', protect, adminOnly, uploadProduct.single('image'), async (req, res) => {
  if (!req.file) return sendResponse(res, 400, 'No file uploaded');
  sendResponse(res, 200, 'Image uploaded', { url: req.file.path });
});
uploadRouter.post('/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  if (!req.file) return sendResponse(res, 400, 'No file uploaded');
  await User.findByIdAndUpdate(req.user._id, { avatar: req.file.path });
  sendResponse(res, 200, 'Avatar uploaded', { url: req.file.path });
});

module.exports = {
  categoryRouter,
  billRouter,
  inventoryRouter,
  customerRouter,
  couponRouter,
  tableRouter,
  supplierRouter,
  notificationRouter,
  userRouter,
  uploadRouter,
};
