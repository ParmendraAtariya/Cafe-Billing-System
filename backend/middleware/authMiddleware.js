const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../utils/helpers');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(createError(401, 'Not authorized. No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return next(createError(401, 'User no longer exists.'));
    if (!user.isActive) return next(createError(403, 'Your account has been deactivated.'));

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired. Please login again.'));
    }
    return next(createError(401, 'Invalid token. Please login again.'));
  }
};

/**
 * Authorize by roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(403, `Role '${req.user.role}' is not authorized to access this resource.`)
      );
    }
    next();
  };
};

/**
 * Admin only shortcut
 */
const adminOnly = authorize('admin');

/**
 * Employee + Admin
 */
const staffOnly = authorize('admin', 'employee', 'cashier');

module.exports = { protect, authorize, adminOnly, staffOnly };
