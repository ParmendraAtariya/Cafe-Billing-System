const { Order, Bill } = require('../models/Order');
const { Product } = require('../models/Product');
const { Customer } = require('../models/Other');
const { Coupon } = require('../models/Other');
const { Inventory } = require('../models/Other');
const { Notification } = require('../models/Other');
const { ActivityLog } = require('../models/Other');
const User = require('../models/User');
const {
  sendResponse,
  createError,
  calculateGST,
  calculateLoyaltyPoints,
  paginate,
  getDateRange,
} = require('../utils/helpers');
const { generateBillPDF } = require('../utils/pdfGenerator');

/**
 * @desc    Create new order (POS)
 * @route   POST /api/orders
 * @access  Private (staff)
 */
const createOrder = async (req, res, next) => {
  const {
    items,
    customerId,
    customerName,
    tableNumber,
    orderType,
    paymentMethod,
    couponCode,
    loyaltyPointsToRedeem,
    splitPayment,
    notes,
  } = req.body;

  if (!items || items.length === 0) {
    return next(createError(400, 'Order must have at least one item.'));
  }

  // ─── Build order items with current prices ──────────────────────────────────
  let subtotal = 0;
  let totalTax = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) return next(createError(404, `Product ${item.productId} not found.`));
    if (!product.isAvailable) return next(createError(400, `${product.name} is not available.`));

    let unitPrice = product.basePrice;

    // Add variant price
    if (item.variantName) {
      const variant = product.variants.find((v) => v.name === item.variantName);
      if (variant) {
        unitPrice += variant.priceModifier;
        item.variant = { name: variant.name, priceModifier: variant.priceModifier };
      }
    }

    // Add addon prices
    let addonPrice = 0;
    const selectedAddons = [];
    if (item.addons && item.addons.length > 0) {
      for (const addonName of item.addons) {
        const addon = product.addons.find((a) => a.name === addonName && a.isAvailable);
        if (addon) {
          addonPrice += addon.price;
          selectedAddons.push({ name: addon.name, price: addon.price });
        }
      }
    }
    unitPrice += addonPrice;

    const taxRate = product.taxRate || 18;
    const priceBeforeTax = unitPrice / (1 + taxRate / 100);
    const taxAmount = (unitPrice - priceBeforeTax) * item.quantity;
    const totalPrice = unitPrice * item.quantity;

    subtotal += totalPrice;
    totalTax += taxAmount;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      quantity: item.quantity,
      basePrice: product.basePrice,
      variant: item.variant || {},
      addons: selectedAddons,
      unitPrice,
      taxRate,
      taxAmount,
      totalPrice,
      notes: item.notes || '',
    });

    // Decrement stock if tracked
    if (product.stock !== -1) {
      if (product.stock < item.quantity) {
        return next(createError(400, `Insufficient stock for ${product.name}`));
      }
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    } else {
      await Product.findByIdAndUpdate(product._id, { $inc: { soldCount: item.quantity } });
    }
  }

  // ─── Coupon Validation ──────────────────────────────────────────────────────
  let discountAmount = 0;
  let couponData = {};

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) return next(createError(404, 'Invalid coupon code.'));

    const { valid, reason } = coupon.isValid(subtotal);
    if (!valid) return next(createError(400, reason));

    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    coupon.usedCount += 1;
    await coupon.save();

    couponData = {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
    };
  }

  // ─── Loyalty Points ─────────────────────────────────────────────────────────
  let loyaltyDiscount = 0;
  let customer = null;

  if (customerId) {
    customer = await Customer.findById(customerId);
    if (customer && loyaltyPointsToRedeem > 0) {
      const pointsToUse = Math.min(loyaltyPointsToRedeem, customer.loyaltyPoints);
      loyaltyDiscount = pointsToUse * 0.5; // 1 point = ₹0.50
      discountAmount += loyaltyDiscount;
    }
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const loyaltyPointsEarned = calculateLoyaltyPoints(totalAmount);

  // ─── Create Order ───────────────────────────────────────────────────────────
  const order = await Order.create({
    items: orderItems,
    customer: customerId || null,
    customerName: customer?.name || customerName || 'Walk-in Customer',
    employeeId: req.user._id,
    tableNumber,
    orderType: orderType || 'dine-in',
    paymentMethod: paymentMethod || 'cash',
    paymentStatus: 'paid',
    subtotal,
    taxAmount: totalTax,
    discountAmount,
    coupon: couponData,
    totalAmount,
    splitPayment: splitPayment || {},
    loyaltyPointsEarned,
    loyaltyPointsRedeemed: loyaltyPointsToRedeem || 0,
    notes,
    branch: req.user.branch || 'Main Branch',
  });

  // ─── Update Customer Loyalty ────────────────────────────────────────────────
  if (customer) {
    customer.loyaltyPoints =
      customer.loyaltyPoints - (loyaltyPointsToRedeem || 0) + loyaltyPointsEarned;
    customer.totalSpent += totalAmount;
    customer.totalOrders += 1;
    // Upgrade membership
    if (customer.totalSpent >= 50000) customer.membership = 'platinum';
    else if (customer.totalSpent >= 20000) customer.membership = 'gold';
    else if (customer.totalSpent >= 5000) customer.membership = 'silver';
    await customer.save();
  }

  // ─── Update Employee Stats ──────────────────────────────────────────────────
  await User.findByIdAndUpdate(req.user._id, {
    $inc: {
      'performance.totalOrders': 1,
      'performance.totalRevenue': totalAmount,
    },
  });

  // ─── Generate Bill ──────────────────────────────────────────────────────────
  const bill = await Bill.create({
    order: order._id,
    customer: customerId || null,
    customerName: order.customerName,
    employeeId: req.user._id,
    items: orderItems,
    subtotal,
    totalTax,
    discountAmount,
    totalAmount,
    paymentMethod: paymentMethod || 'cash',
    paymentStatus: 'paid',
    branch: {
      name: process.env.BRANCH_NAME || 'Main Branch',
      address: process.env.BRANCH_ADDRESS || '',
      phone: process.env.BRANCH_PHONE || '',
    },
  });

  // ─── Socket.IO notification ─────────────────────────────────────────────────
  const io = req.app.get('io');
  if (io) {
    io.to('admin-room').emit('new-order', { order, bill });
  }

  // ─── Activity Log ───────────────────────────────────────────────────────────
  await ActivityLog.create({
    user: req.user._id,
    action: 'CREATE_ORDER',
    entity: 'Order',
    entityId: order._id.toString(),
    details: { orderNumber: order.orderNumber, totalAmount },
    ip: req.ip,
  });

  const populatedOrder = await Order.findById(order._id).populate('employeeId', 'name email');

  sendResponse(res, 201, 'Order created successfully', {
    order: populatedOrder,
    bill,
    loyaltyPointsEarned,
  });
};

/**
 * @desc    Get all orders (admin) or own orders (employee)
 * @route   GET /api/orders
 * @access  Private
 */
const getOrders = async (req, res) => {
  const { page, limit, status, paymentMethod, from, to, search } = req.query;

  let query = {};

  // Employees only see their own orders
  if (req.user.role !== 'admin') {
    query.employeeId = req.user._id;
  }

  if (status) query.status = status;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
    ];
  }

  const result = await paginate(Order, query, {
    page,
    limit,
    sort: '-createdAt',
    populate: 'employeeId customer',
  });

  sendResponse(res, 200, 'Orders fetched', result);
};

/**
 * @desc    Get single order
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('employeeId', 'name email avatar')
    .populate('customer', 'name email phone loyaltyPoints');

  if (!order) return next(createError(404, 'Order not found.'));
  sendResponse(res, 200, 'Order fetched', { order });
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private
 */
const updateOrderStatus = async (req, res, next) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!order) return next(createError(404, 'Order not found.'));

  // Notify via socket
  const io = req.app.get('io');
  if (io) io.emit('order-status-update', { orderId: order._id, status });

  sendResponse(res, 200, 'Order status updated', { order });
};

/**
 * @desc    Refund order
 * @route   POST /api/orders/:id/refund
 * @access  Private (admin)
 */
const refundOrder = async (req, res, next) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return next(createError(404, 'Order not found.'));
  if (order.isRefunded) return next(createError(400, 'Order already refunded.'));

  order.isRefunded = true;
  order.refundReason = reason;
  order.refundedAt = new Date();
  order.paymentStatus = 'refunded';
  await order.save();

  // Restore stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product && product.stock !== -1) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }
  }

  sendResponse(res, 200, 'Order refunded successfully', { order });
};

/**
 * @desc    Get today's summary for employee dashboard
 * @route   GET /api/orders/today-summary
 * @access  Private
 */
const getTodaySummary = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const query = {
    createdAt: { $gte: today },
    paymentStatus: 'paid',
    ...(req.user.role !== 'admin' && { employeeId: req.user._id }),
  };

  const [orders, revenue] = await Promise.all([
    Order.countDocuments(query),
    Order.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
  ]);

  sendResponse(res, 200, "Today's summary", {
    summary: {
      totalOrders: orders,
      totalRevenue: revenue[0]?.total || 0,
    },
  });
};

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  refundOrder,
  getTodaySummary,
};
