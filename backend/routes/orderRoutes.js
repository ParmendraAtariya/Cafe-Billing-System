// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrder, updateOrderStatus, refundOrder, getTodaySummary } = require('../controllers/orderController');
const { protect, adminOnly, staffOnly } = require('../middleware/authMiddleware');

router.post('/', protect, staffOnly, createOrder);
router.get('/', protect, getOrders);
router.get('/today-summary', protect, getTodaySummary);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/:id/refund', protect, adminOnly, refundOrder);

module.exports = router;
