import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Orders from './pages/admin/Orders';
import Inventory from './pages/admin/Inventory';
import Customers from './pages/admin/Customers';
import Employees from './pages/admin/Employees';
import Coupons from './pages/admin/Coupons';
import Tables from './pages/admin/Tables';
import Analytics from './pages/admin/Analytics';
import Bills from './pages/admin/Bills';
import Settings from './pages/admin/Settings';

// Employee Pages
import EmployeeLayout from './components/layout/EmployeeLayout';
import POS from './pages/employee/POS';
import MyOrders from './pages/employee/MyOrders';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1C1C1E',
                  color: '#F5F5F0',
                  border: '1px solid #00704A',
                  borderRadius: '12px',
                  fontFamily: 'Sora, sans-serif',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#00704A', secondary: '#FFFFFF' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' } },
              }}
            />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="categories" element={<Categories />} />
                <Route path="orders" element={<Orders />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="customers" element={<Customers />} />
                <Route path="employees" element={<Employees />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="tables" element={<Tables />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="bills" element={<Bills />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Employee Routes */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute roles={['employee', 'cashier', 'admin']}>
                    <EmployeeLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EmployeeDashboard />} />
                <Route path="pos" element={<POS />} />
                <Route path="orders" element={<MyOrders />} />
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
