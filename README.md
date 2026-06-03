# ☕ Cafe Billing & Management System

A **premium, production-ready full-stack café management platform** inspired by modern café workflows (Starbucks-style). Built as a complete final year project with enterprise-grade architecture.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Vite, Tailwind CSS, ShadCN UI, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + Role-Based Access Control |
| Charts | Recharts |
| Storage | Cloudinary |
| Real-time | Socket.IO |
| PDF | pdfkit / jsPDF |
| Email | Nodemailer |

---

## 📁 Project Structure

```
cafe-system/
├── backend/
│   ├── config/           # DB, Cloudinary, Email config
│   ├── controllers/      # Business logic
│   ├── middleware/        # Auth, error, upload middleware
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── utils/            # Helpers, PDF generator, email
│   ├── seeds/            # Dummy data seeders
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/   # Reusable UI components
    │   ├── pages/        # Route pages
    │   ├── hooks/        # Custom React hooks
    │   ├── context/      # Auth, Theme, Cart context
    │   ├── lib/          # Axios instance, utilities
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- Cloudinary account
- Gmail account (for email notifications)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd cafe-system
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npm run seed      # Seed dummy data
npm run dev       # Start dev server
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

---

## 🔐 Default Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@cafe.com | Admin@123 |
| Employee | cashier@cafe.com | Cashier@123 |

---

## 📊 Features Overview

### 👑 Admin Panel
- Dashboard analytics (sales, revenue, orders, inventory)
- Product & category management with image upload
- Employee management & role assignment
- Inventory tracking with low-stock alerts
- Coupon/discount engine
- Customer loyalty program
- Reports: PDF/Excel export, charts by date range
- Table & reservation management
- Multi-branch support
- Activity logs & notification center

### 💼 Employee/Cashier Panel
- Fast POS billing interface
- Cart with quantity controls
- Apply coupons & discounts
- Multiple payment methods (Cash, UPI, Card)
- PDF receipt generation & print
- Customer search & loyalty points
- Real-time tax & GST calculation
- Recent orders view

### 📋 Billing System
- Auto invoice generation with unique IDs
- GST/tax calculation
- PDF receipt with QR code
- Transaction history
- Refund management
- Split payment support

---

## 🌐 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password/:token
GET    /api/auth/me
```

### Products
```
GET    /api/products
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
GET    /api/products/search?q=
GET    /api/products/category/:id
```

### Orders
```
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id/status
GET    /api/orders/my
```

### Inventory
```
GET    /api/inventory
POST   /api/inventory
PUT    /api/inventory/:id
GET    /api/inventory/low-stock
```

### Analytics
```
GET    /api/analytics/dashboard
GET    /api/analytics/sales?range=weekly
GET    /api/analytics/products/top
GET    /api/analytics/revenue?from=&to=
```

---

## 🎨 Color Palette

```css
--primary: #00704A      /* Starbucks Green */
--primary-dark: #004F35
--accent: #CBA258       /* Gold */
--bg-dark: #1C1C1E
--surface: #2C2C2E
--text: #F5F5F0
```

---

## 📦 Deployment

### Backend (Railway / Render)
1. Push to GitHub
2. Connect repo to Railway/Render
3. Add environment variables
4. Deploy

### Frontend (Vercel / Netlify)
1. Push to GitHub
2. Connect to Vercel
3. Set `VITE_API_URL` to your backend URL
4. Deploy

---

## 🏆 Perfect For
- Final Year College Project ✅
- Portfolio Showcase ✅
- Internship Demonstration ✅
- SaaS Product MVP ✅

---

*Built with ❤️ for the modern café experience*
"# Cafe-Billing-System" 
"# Cafe-Billing-System" 
"# Cafe-Billing-System" 
"# Cafe-Billing-System" 
