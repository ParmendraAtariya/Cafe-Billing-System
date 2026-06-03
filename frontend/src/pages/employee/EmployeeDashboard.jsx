// EmployeeDashboard.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Clock, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { formatCurrency, formatDateTime, statusColor, cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ totalOrders: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, ordersRes] = await Promise.all([
          api.get('/orders/today-summary'),
          api.get('/orders?limit=8'),
        ]);
        setSummary(sumRes.data.summary || {});
        setRecentOrders(ordersRes.data.data || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6 h-full overflow-auto scrollbar-thin">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-foreground">
          Welcome, {user?.name?.split(' ')[0]} ☕
        </h1>
        <p className="text-muted-foreground text-sm">Here's your shift summary for today.</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Today's Orders", value: loading ? '...' : summary.totalOrders, icon: ShoppingCart, color: 'from-blue-500 to-blue-700' },
          { label: "Today's Revenue", value: loading ? '...' : formatCurrency(summary.totalRevenue), icon: TrendingUp, color: 'from-primary-500 to-primary-700' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <button onClick={() => navigate('/employee/pos')}
            className="w-full flex items-center justify-between p-3 bg-primary-500 hover:bg-primary-400 text-white rounded-xl transition-colors shadow-glow group">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold text-sm">Open POS Billing</span>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={() => navigate('/employee/orders')}
            className="w-full flex items-center justify-between p-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl transition-colors group">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-sm">View My Orders</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Recent orders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Orders</h3>
          <button onClick={() => navigate('/employee/orders')} className="text-xs text-primary-500 hover:text-primary-400">View all →</button>
        </div>
        <div className="space-y-2">
          {loading ? [...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />) :
            recentOrders.map(o => (
              <div key={o._id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-bold">
                  {o.customerName?.[0] || 'W'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(o.totalAmount)}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[o.status])}>{o.status}</span>
                </div>
              </div>
            ))
          }
        </div>
      </motion.div>
    </div>
  );
}

export default EmployeeDashboard;
