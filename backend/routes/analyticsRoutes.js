// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDashboard, getSalesChart, getPeakHours,
  getProductAnalytics, getPaymentMethodStats, getCategoryAnalytics,
} = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);
router.get('/dashboard', getDashboard);
router.get('/sales', getSalesChart);
router.get('/peak-hours', getPeakHours);
router.get('/products', getProductAnalytics);
router.get('/payment-methods', getPaymentMethodStats);
router.get('/categories', getCategoryAnalytics);

module.exports = router;
