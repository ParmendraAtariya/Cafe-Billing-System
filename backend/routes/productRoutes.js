// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleAvailability } = require('../controllers/productController');
const { protect, adminOnly, staffOnly } = require('../middleware/authMiddleware');
const { uploadProduct } = require('../config/cloudinary');

router.get('/', protect, getProducts);
router.get('/:id', protect, getProduct);
router.post('/', protect, adminOnly, uploadProduct.single('image'), createProduct);
router.put('/:id', protect, adminOnly, uploadProduct.single('image'), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.patch('/:id/toggle', protect, adminOnly, toggleAvailability);

module.exports = router;
