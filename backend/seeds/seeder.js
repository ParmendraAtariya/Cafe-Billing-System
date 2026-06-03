/**
 * Database Seeder - Cafe Billing System
 * Run: npm run seed
 */

require('dotenv').config({
  path: 'C:/Users/parme/OneDrive/Dokumen/OneDrive/Desktop/smart billing/cafe-system/backend/.env'
});
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    process.exit(1);
  }
};

const User = require('../models/User');
const { Category, Product } = require('../models/Product');
const { Customer, Inventory, Coupon, Table, Supplier } = require('../models/Other');

const seed = async () => {
  await connectDB();

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Inventory.deleteMany({}),
    Coupon.deleteMany({}),
    Table.deleteMany({}),
    Supplier.deleteMany({}),
  ]);

  // ─── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Seeding users...');
  const users = await User.create([
    {
      name: 'Arjun Sharma',
      email: 'admin@cafe.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210',
    },
    {
      name: 'Priya Verma',
      email: 'cashier@cafe.com',
      password: 'Cashier@123',
      role: 'cashier',
      phone: '+91 91234 56789',
    },
    {
      name: 'Rahul Nair',
      email: 'employee@cafe.com',
      password: 'Employee@123',
      role: 'employee',
      phone: '+91 88765 43210',
    },
  ]);
  console.log(`   ✓ ${users.length} users created`);

  // ─── Categories ─────────────────────────────────────────────────────────────
  console.log('📂 Seeding categories...');
  const categories = await Category.create([
    { name: 'Coffee', description: 'Hot and cold coffee beverages', icon: '☕', color: '#6F4E37', sortOrder: 1 },
    { name: 'Cold Drinks', description: 'Refreshing cold beverages', icon: '🧊', color: '#00A8E8', sortOrder: 2 },
    { name: 'Teas', description: 'Premium tea collection', icon: '🍵', color: '#4CAF50', sortOrder: 3 },
    { name: 'Snacks', description: 'Light bites and snacks', icon: '🥐', color: '#FF9800', sortOrder: 4 },
    { name: 'Desserts', description: 'Sweet treats and desserts', icon: '🍰', color: '#E91E63', sortOrder: 5 },
    { name: 'Sandwiches', description: 'Fresh sandwiches and wraps', icon: '🥪', color: '#8BC34A', sortOrder: 6 },
  ]);
  console.log(`   ✓ ${categories.length} categories created`);

  const [coffee, coldDrinks, teas, snacks, desserts, sandwiches] = categories;

  // ─── Products ────────────────────────────────────────────────────────────────
  console.log('📦 Seeding products...');
  const products = await Product.create([
    // Coffee
    {
      name: 'Espresso',
      description: 'Rich, concentrated coffee shot',
      category: coffee._id,
      basePrice: 80,
      isFeatured: true,
      variants: [
        { name: 'Single', priceModifier: 0 },
        { name: 'Double', priceModifier: 40 },
      ],
      addons: [
        { name: 'Extra Shot', price: 40 },
        { name: 'Oat Milk', price: 30 },
        { name: 'Soy Milk', price: 30 },
      ],
      tags: ['espresso', 'coffee', 'hot'],
    },
    {
      name: 'Cappuccino',
      description: 'Espresso with steamed milk foam',
      category: coffee._id,
      basePrice: 150,
      isFeatured: true,
      variants: [
        { name: 'Small', priceModifier: 0 },
        { name: 'Medium', priceModifier: 30 },
        { name: 'Large', priceModifier: 60 },
      ],
      addons: [
        { name: 'Extra Shot', price: 40 },
        { name: 'Vanilla Syrup', price: 20 },
        { name: 'Hazelnut Syrup', price: 20 },
        { name: 'Oat Milk', price: 30 },
      ],
      tags: ['cappuccino', 'coffee', 'hot'],
    },
    {
      name: 'Latte',
      description: 'Smooth espresso with steamed milk',
      category: coffee._id,
      basePrice: 160,
      isFeatured: true,
      variants: [
        { name: 'Small', priceModifier: 0 },
        { name: 'Medium', priceModifier: 30 },
        { name: 'Large', priceModifier: 60 },
      ],
      addons: [
        { name: 'Extra Shot', price: 40 },
        { name: 'Caramel Syrup', price: 20 },
        { name: 'Oat Milk', price: 30 },
      ],
      tags: ['latte', 'coffee', 'hot'],
    },
    {
      name: 'Cold Brew',
      description: '12-hour cold-steeped smooth coffee',
      category: coffee._id,
      basePrice: 200,
      isFeatured: true,
      variants: [
        { name: 'Regular', priceModifier: 0 },
        { name: 'Large', priceModifier: 50 },
      ],
      tags: ['cold brew', 'coffee', 'cold'],
    },
    {
      name: 'Mocha',
      description: 'Espresso with chocolate and steamed milk',
      category: coffee._id,
      basePrice: 180,
      tags: ['mocha', 'coffee', 'chocolate'],
    },
    // Cold Drinks
    {
      name: 'Iced Latte',
      description: 'Cold espresso with milk over ice',
      category: coldDrinks._id,
      basePrice: 190,
      variants: [
        { name: 'Medium', priceModifier: 0 },
        { name: 'Large', priceModifier: 40 },
      ],
      tags: ['iced', 'latte', 'cold'],
    },
    {
      name: 'Frappuccino',
      description: 'Blended coffee with ice and cream',
      category: coldDrinks._id,
      basePrice: 220,
      isFeatured: true,
      addons: [
        { name: 'Extra Cream', price: 20 },
        { name: 'Caramel Drizzle', price: 15 },
      ],
      tags: ['frappuccino', 'blended', 'cold'],
    },
    {
      name: 'Mango Smoothie',
      description: 'Fresh mango blended smoothie',
      category: coldDrinks._id,
      basePrice: 180,
      tags: ['smoothie', 'mango', 'cold'],
    },
    // Teas
    {
      name: 'Masala Chai',
      description: 'Traditional Indian spiced tea',
      category: teas._id,
      basePrice: 80,
      isFeatured: true,
      variants: [
        { name: 'Regular', priceModifier: 0 },
        { name: 'Large', priceModifier: 20 },
      ],
      tags: ['chai', 'tea', 'hot', 'indian'],
    },
    {
      name: 'Green Tea',
      description: 'Premium Japanese green tea',
      category: teas._id,
      basePrice: 120,
      tags: ['green tea', 'tea', 'healthy'],
    },
    // Snacks
    {
      name: 'Croissant',
      description: 'Buttery French pastry',
      category: snacks._id,
      basePrice: 120,
      tags: ['croissant', 'pastry', 'snack'],
    },
    {
      name: 'Banana Bread',
      description: 'Moist homemade banana bread slice',
      category: snacks._id,
      basePrice: 100,
      tags: ['banana bread', 'snack', 'baked'],
    },
    {
      name: 'Muffin',
      description: 'Blueberry or chocolate chip muffin',
      category: snacks._id,
      basePrice: 110,
      variants: [
        { name: 'Blueberry', priceModifier: 0 },
        { name: 'Chocolate Chip', priceModifier: 10 },
      ],
      tags: ['muffin', 'snack', 'baked'],
    },
    // Desserts
    {
      name: 'Cheesecake',
      description: 'New York style cheesecake',
      category: desserts._id,
      basePrice: 220,
      isFeatured: true,
      tags: ['cheesecake', 'dessert', 'sweet'],
    },
    {
      name: 'Chocolate Brownie',
      description: 'Fudgy dark chocolate brownie',
      category: desserts._id,
      basePrice: 150,
      tags: ['brownie', 'chocolate', 'dessert'],
    },
    // Sandwiches
    {
      name: 'Club Sandwich',
      description: 'Triple-layer chicken club sandwich',
      category: sandwiches._id,
      basePrice: 280,
      isFeatured: true,
      tags: ['sandwich', 'chicken', 'lunch'],
    },
    {
      name: 'Veggie Wrap',
      description: 'Fresh vegetables in whole wheat wrap',
      category: sandwiches._id,
      basePrice: 220,
      tags: ['wrap', 'vegetarian', 'healthy'],
    },
  ]);
  console.log(`   ✓ ${products.length} products created`);

  // ─── Customers ───────────────────────────────────────────────────────────────
  console.log('👥 Seeding customers...');
  const customers = await Customer.create([
    { name: 'Anjali Singh', email: 'anjali@example.com', phone: '9876543210', loyaltyPoints: 250, totalSpent: 5200, totalOrders: 18, membership: 'silver' },
    { name: 'Vikram Mehta', email: 'vikram@example.com', phone: '9123456789', loyaltyPoints: 680, totalSpent: 24000, totalOrders: 52, membership: 'gold' },
    { name: 'Sneha Patel', email: 'sneha@example.com', phone: '8765432109', loyaltyPoints: 120, totalSpent: 2100, totalOrders: 8 },
    { name: 'Rohan Gupta', email: 'rohan@example.com', phone: '7654321098', loyaltyPoints: 1200, totalSpent: 58000, totalOrders: 120, membership: 'platinum' },
  ]);
  console.log(`   ✓ ${customers.length} customers created`);

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  console.log('🏭 Seeding suppliers...');
  const suppliers = await Supplier.create([
    { name: 'Blue Mountain Coffee Co.', contactPerson: 'Suresh Kumar', phone: '9988776655', email: 'supply@bluemountain.com', products: ['Coffee Beans', 'Espresso Blend'], rating: 5 },
    { name: 'Fresh Dairy Farms', contactPerson: 'Ramesh Yadav', phone: '8877665544', products: ['Milk', 'Cream', 'Butter'], rating: 4 },
    { name: 'Golden Bakery Supplies', contactPerson: 'Meena Joshi', phone: '7766554433', products: ['Flour', 'Sugar', 'Yeast'], rating: 4 },
  ]);
  console.log(`   ✓ ${suppliers.length} suppliers created`);

  // ─── Inventory ───────────────────────────────────────────────────────────────
  console.log('📋 Seeding inventory...');
  await Inventory.create([
    { name: 'Arabica Coffee Beans', unit: 'kg', currentStock: 25, minStockLevel: 5, maxStockLevel: 50, costPerUnit: 800, supplier: suppliers[0]._id, lastRestocked: new Date() },
    { name: 'Whole Milk', unit: 'litre', currentStock: 30, minStockLevel: 10, maxStockLevel: 60, costPerUnit: 65, supplier: suppliers[1]._id },
    { name: 'Oat Milk', unit: 'litre', currentStock: 8, minStockLevel: 5, maxStockLevel: 25, costPerUnit: 150, supplier: suppliers[1]._id },
    { name: 'Sugar', unit: 'kg', currentStock: 3, minStockLevel: 5, maxStockLevel: 25, costPerUnit: 45, supplier: suppliers[2]._id }, // low stock!
    { name: 'Vanilla Syrup', unit: 'litre', currentStock: 4, minStockLevel: 2, maxStockLevel: 10, costPerUnit: 450, supplier: suppliers[0]._id },
    { name: 'Caramel Syrup', unit: 'litre', currentStock: 3, minStockLevel: 2, maxStockLevel: 10, costPerUnit: 420 },
    { name: 'All-Purpose Flour', unit: 'kg', currentStock: 20, minStockLevel: 8, maxStockLevel: 40, costPerUnit: 55, supplier: suppliers[2]._id },
    { name: 'Heavy Cream', unit: 'litre', currentStock: 6, minStockLevel: 3, maxStockLevel: 15, costPerUnit: 180, supplier: suppliers[1]._id },
  ]);
  console.log('   ✓ Inventory items created');

  // ─── Coupons ─────────────────────────────────────────────────────────────────
  console.log('🎟️  Seeding coupons...');
  await Coupon.create([
    {
      code: 'WELCOME20',
      description: '20% off for new customers',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscountAmount: 100,
      minOrderAmount: 200,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: users[0]._id,
    },
    {
      code: 'FLAT50',
      description: 'Flat ₹50 off',
      discountType: 'fixed',
      discountValue: 50,
      minOrderAmount: 300,
      usageLimit: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdBy: users[0]._id,
    },
    {
      code: 'WEEKEND30',
      description: '30% off on weekends',
      discountType: 'percentage',
      discountValue: 30,
      maxDiscountAmount: 150,
      minOrderAmount: 400,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      createdBy: users[0]._id,
    },
  ]);
  console.log('   ✓ Coupons created');

  // ─── Tables ──────────────────────────────────────────────────────────────────
  console.log('🪑 Seeding tables...');
  const tableData = [];
  for (let i = 1; i <= 12; i++) {
    tableData.push({
      tableNumber: `T${String(i).padStart(2, '0')}`,
      capacity: i <= 6 ? 2 : i <= 10 ? 4 : 6,
      status: i <= 3 ? 'occupied' : 'available',
      location: i <= 8 ? 'main-hall' : i <= 10 ? 'outdoor' : 'private',
    });
  }
  await Table.create(tableData);
  console.log('   ✓ 12 tables created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin:    admin@cafe.com    / Admin@123');
  console.log('   Cashier:  cashier@cafe.com  / Cashier@123');
  console.log('   Employee: employee@cafe.com / Employee@123\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
