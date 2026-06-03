/**
 * ☕ Cafe Billing & Management System - Main Server
 */
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const {
  categoryRouter, billRouter, inventoryRouter, customerRouter,
  couponRouter, tableRouter, supplierRouter, notificationRouter,
  userRouter, uploadRouter,
} = require('./routes/otherRoutes');

const app = express();
const server = http.createServer(app);

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});
app.set('io', io);
io.on('connection', (socket) => {
  socket.on('join-room', (room) => socket.join(room));
});

connectDB();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 500,
  message: { success: false, message: 'Too many requests.' },
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRouter);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/bills', billRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/customers', customerRouter);
app.use('/api/coupons', couponRouter);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tables', tableRouter);
app.use('/api/suppliers', supplierRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/upload', uploadRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '☕ Cafe API running', uptime: Math.floor(process.uptime()) + 's' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };
