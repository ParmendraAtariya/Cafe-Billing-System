import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Coffee, ShoppingCart, ClipboardList, LayoutDashboard, LogOut, Sun, Moon, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/employee', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employee/pos', label: 'POS Billing', icon: ShoppingCart },
  { to: '/employee/orders', label: 'My Orders', icon: ClipboardList },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const { toggle, isDark } = useTheme();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-surface-card border-r border-border">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-sm">Cafe Billing</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role} Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn('nav-item relative', isActive && 'active')}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{label}</span>
              {label === 'POS Billing' && itemCount > 0 && (
                <span className="ml-auto w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="nav-item w-full text-left"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Admin Panel</span>
            </button>
          )}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-primary-500">{user?.branch}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
