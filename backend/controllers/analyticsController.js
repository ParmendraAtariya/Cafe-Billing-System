const { Order } = require('../models/Order');
const { Product } = require('../models/Product');
const User = require('../models/User');
const { Customer, Inventory } = require('../models/Other');
const { sendResponse, getDateRange } = require('../utils/helpers');

/**
 * @desc    Admin dashboard overview
 * @route   GET /api/analytics/dashboard
 * @access  Admin
 */
const getDashboard = async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const paidFilter = { paymentStatus: 'paid', isRefunded: false };

  const [
    totalOrdersToday,
    totalOrdersMonth,
    revenueToday,
    revenueMonth,
    revenueLastMonth,
    totalCustomers,
    totalProducts,
    lowStockItems,
    recentOrders,
    topProducts,
    employeeStats,
  ] = await Promise.all([
    Order.countDocuments({ ...paidFilter, createdAt: { $gte: today } }),
    Order.countDocuments({ ...paidFilter, createdAt: { $gte: thisMonth } }),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $match: { ...paidFilter, createdAt: { $gte: lastMonth, $lte: lastMonthEnd } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Customer.countDocuments({ isActive: true }),
    Product.countDocuments({ isAvailable: true }),
    Inventory.countDocuments({ $expr: { $lte: ['$currentStock', '$minStockLevel'] } }),
    Order.find(paidFilter).sort('-createdAt').limit(10).populate('employeeId', 'name'),
    Order.aggregate([
      { $match: paidFilter },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.totalPrice' } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
    User.find({ role: { $in: ['employee', 'cashier'] }, isActive: true })
      .select('name performance avatar')
      .sort('-performance.totalRevenue')
      .limit(5),
  ]);

  const currentMonthRevenue = revenueMonth[0]?.total || 0;
  const prevMonthRevenue = revenueLastMonth[0]?.total || 0;
  const revenueGrowth = prevMonthRevenue
    ? (((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1)
    : 0;

  sendResponse(res, 200, 'Dashboard data fetched', {
    dashboard: {
      todayOrders: totalOrdersToday,
      monthOrders: totalOrdersMonth,
      todayRevenue: revenueToday[0]?.total || 0,
      monthRevenue: currentMonthRevenue,
      revenueGrowth: parseFloat(revenueGrowth),
      totalCustomers,
      totalProducts,
      lowStockItems,
      recentOrders,
      topProducts,
      employeeStats,
    },
  });
};

/**
 * @desc    Sales chart data
 * @route   GET /api/analytics/sales
 * @access  Admin
 */
const getSalesChart = async (req, res) => {
  const { range = 'weekly', groupBy = 'day' } = req.query;
  const { start, end } = getDateRange(range);

  let groupFormat;
  let dateFormat;

  if (groupBy === 'hour') {
    groupFormat = { $hour: '$createdAt' };
    dateFormat = 'hour';
  } else if (groupBy === 'month') {
    groupFormat = { $month: '$createdAt' };
    dateFormat = 'month';
  } else {
    groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    dateFormat = 'day';
  }

  const data = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        paymentStatus: 'paid',
        isRefunded: false,
      },
    },
    {
      $group: {
        _id: groupFormat,
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
        avgOrder: { $avg: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  sendResponse(res, 200, 'Sales chart data', { chart: data, range, groupBy });
};

/**
 * @desc    Peak hours analysis
 * @route   GET /api/analytics/peak-hours
 * @access  Admin
 */
const getPeakHours = async (req, res) => {
  const { start } = getDateRange('monthly');

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, paymentStatus: 'paid' } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill missing hours with zeros
  const hours = Array.from({ length: 24 }, (_, i) => {
    const found = data.find((d) => d._id === i);
    return { hour: i, orders: found?.orders || 0, revenue: found?.revenue || 0 };
  });

  sendResponse(res, 200, 'Peak hours data', { peakHours: hours });
};

/**
 * @desc    Product performance
 * @route   GET /api/analytics/products
 * @access  Admin
 */
const getProductAnalytics = async (req, res) => {
  const { range = 'monthly' } = req.query;
  const { start } = getDateRange(range);

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 20 },
  ]);

  sendResponse(res, 200, 'Product analytics', { products: data });
};

/**
 * @desc    Revenue by payment method
 * @route   GET /api/analytics/payment-methods
 * @access  Admin
 */
const getPaymentMethodStats = async (req, res) => {
  const { start } = getDateRange('monthly');

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, paymentStatus: 'paid' } },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        total: { $sum: '$totalAmount' },
      },
    },
  ]);

  sendResponse(res, 200, 'Payment method stats', { paymentMethods: data });
};

/**
 * @desc    Category-wise sales
 * @route   GET /api/analytics/categories
 * @access  Admin
 */
const getCategoryAnalytics = async (req, res) => {
  const { start } = getDateRange('monthly');

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, paymentStatus: 'paid' } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productData',
      },
    },
    { $unwind: { path: '$productData', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'productData.category',
        foreignField: '_id',
        as: 'categoryData',
      },
    },
    { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$categoryData._id',
        name: { $first: '$categoryData.name' },
        icon: { $first: '$categoryData.icon' },
        revenue: { $sum: '$items.totalPrice' },
        quantity: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  sendResponse(res, 200, 'Category analytics', { categories: data });
};

module.exports = {
  getDashboard,
  getSalesChart,
  getPeakHours,
  getProductAnalytics,
  getPaymentMethodStats,
  getCategoryAnalytics,
};
