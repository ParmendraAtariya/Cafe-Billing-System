const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken, sendResponse, createError } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const logger = require('../config/logger');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public (Admin can create employees)
 */
const register = async (req, res, next) => {
  const { name, email, password, role, phone, branch } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(createError(400, 'Email already registered.'));

  const user = await User.create({ name, email, password, role: role || 'employee', phone, branch });
  const token = generateToken(user._id);

  logger.info(`New user registered: ${email} (${role})`);

  sendResponse(res, 201, 'Account created successfully', { token, user });
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) return next(createError(400, 'Email and password are required.'));

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(createError(401, 'Invalid email or password.'));
  }

  if (!user.isActive) return next(createError(403, 'Your account has been deactivated. Contact admin.'));

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${email}`);

  sendResponse(res, 200, 'Login successful', { token, refreshToken, user });
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  sendResponse(res, 200, 'User fetched', { user: req.user });
};

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(createError(404, 'No account with that email found.'));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: '☕ Cafe System - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00704A;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetURL}" style="display:inline-block;padding:12px 24px;background:#00704A;color:#fff;border-radius:6px;text-decoration:none;margin:16px 0;">Reset Password</a>
          <p>This link expires in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    sendResponse(res, 200, `Password reset email sent to ${user.email}`);
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(createError(500, 'Email could not be sent. Try again later.'));
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(createError(400, 'Token is invalid or has expired.'));

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  const token = generateToken(user._id);
  sendResponse(res, 200, 'Password reset successful', { token, user });
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(createError(401, 'Current password is incorrect.'));
  }

  user.password = newPassword;
  await user.save();

  sendResponse(res, 200, 'Password changed successfully');
};

/**
 * @desc    Logout (invalidate refresh token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  sendResponse(res, 200, 'Logged out successfully');
};

module.exports = { register, login, getMe, forgotPassword, resetPassword, changePassword, logout };
