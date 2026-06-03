const jwt = require('jsonwebtoken');

/**
 * Create a custom error with status code
 */
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

/**
 * Send standard success response
 */
const sendResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

/**
 * Calculate GST breakdown
 */
const calculateGST = (amount, gstRate = 18) => {
  const cgst = (amount * gstRate) / 200; // half of GST
  const sgst = cgst;
  const totalTax = cgst + sgst;
  return { cgst, sgst, totalTax, gstRate };
};

/**
 * Calculate loyalty points (1 point per ₹10 spent)
 */
const calculateLoyaltyPoints = (amount) => {
  return Math.floor(amount / 10);
};

/**
 * Paginate query
 */
const paginate = async (model, query, options) => {
  const { page = 1, limit = 10, sort = '-createdAt', populate = '' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate(populate),
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

/**
 * Get date range for analytics
 */
const getDateRange = (range) => {
  const end = new Date();
  let start = new Date();

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarterly':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'yearly':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
};

module.exports = {
  createError,
  generateToken,
  generateRefreshToken,
  sendResponse,
  calculateGST,
  calculateLoyaltyPoints,
  paginate,
  formatCurrency,
  getDateRange,
};
