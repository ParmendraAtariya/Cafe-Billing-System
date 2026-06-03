const { Product } = require('../models/Product');
const { sendResponse, createError, paginate } = require('../utils/helpers');
const { ActivityLog } = require('../models/Other');

const getProducts = async (req, res) => {
  const { page, limit, category, search, featured, available } = req.query;
  const query = {};

  if (category) query.category = category;
  if (featured === 'true') query.isFeatured = true;
  if (available !== 'false') query.isAvailable = true;
  if (search) query.$text = { $search: search };

  const result = await paginate(Product, query, {
    page,
    limit: limit || 20,
    sort: '-soldCount',
    populate: 'category',
  });

  sendResponse(res, 200, 'Products fetched', result);
};

const getProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate('category');
  if (!product) return next(createError(404, 'Product not found.'));
  sendResponse(res, 200, 'Product fetched', { product });
};

const createProduct = async (req, res) => {
  const productData = { ...req.body };
  if (req.file) productData.image = req.file.path;

  const product = await Product.create(productData);
  await ActivityLog.create({
    user: req.user._id,
    action: 'CREATE_PRODUCT',
    entity: 'Product',
    entityId: product._id.toString(),
    details: { name: product.name },
  });

  sendResponse(res, 201, 'Product created', { product });
};

const updateProduct = async (req, res, next) => {
  const updateData = { ...req.body };
  if (req.file) updateData.image = req.file.path;

  const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) return next(createError(404, 'Product not found.'));
  sendResponse(res, 200, 'Product updated', { product });
};

const deleteProduct = async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(createError(404, 'Product not found.'));
  sendResponse(res, 200, 'Product deleted');
};

const toggleAvailability = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(createError(404, 'Product not found.'));
  product.isAvailable = !product.isAvailable;
  await product.save();
  sendResponse(res, 200, `Product ${product.isAvailable ? 'enabled' : 'disabled'}`, { product });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, toggleAvailability };
