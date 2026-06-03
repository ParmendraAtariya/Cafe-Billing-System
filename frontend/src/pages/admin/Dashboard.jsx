import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingBag, Users, Package,
  ArrowUpRight, ArrowDownRight, Clock, Star
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api from '../../lib/axios';
import { formatCurrency, formatDateTime, CHART_COLORS } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, change, icon: Icon, color, index }) => {
  const positive = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${positive
          ? 'text-green-600 bg-green-50 dark:bg-green-950/30'
          : 'text-red-500 bg-red-50 dark:bg-red-950/30'
          }`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground font-sans mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-border rounded-xl p-3 shadow-xl text-sm">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.name === 'Revenue' ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [payData, setPayData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, chartRes, payRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/sales?range=weekly'),
          api.get('/analytics/payment-methods'),
        ]);
        setData(dashRes.data.dashboard);
        setChart(chartRes.data.chart || []);
        setPayData(payRes.data.paymentMethods || []);
      } catch { } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const stats = [
    { title: "Today's Revenue", value: formatCurrency(data?.todayRevenue || 0), change: 12.5, icon: TrendingUp, color: 'bg-gradient-to-br from-primary-500 to-primary-700' },
    { title: 'Monthly Revenue', value: formatCurrency(data?.monthRevenue || 0), change: data?.revenueGrowth || 0, icon: TrendingUp, color: 'bg-gradient-to-br from-blue-500 to-blue-700' },
    { title: "Today's Orders", value: data?.todayOrders || 0, change: 8.2, icon: ShoppingBag, color: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { title: 'Total Customers', value: data?.totalCustomers || 0, change: 5.1, icon: Users, color: 'bg-gradient-to-br from-purple-500 to-purple-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} ☕
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Here's what's happening at your café today.</p>
      </motion.div>

      {/* Low stock alert */}
      {data?.lowStockItems > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <Package className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>{data.lowStockItems} inventory items</strong> are running low on stock.
            <a href="/admin/inventory" className="ml-2 underline">View inventory →</a>
          </p>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.title} {...s} index={i} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="xl:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Revenue Overview</h3>
              <p className="text-sm text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00704A" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00704A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#CBA258" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#CBA258" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#00704A" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#CBA258" strokeWidth={2} fill="url(#ordGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment method donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-1">Payment Methods</h3>
          <p className="text-sm text-muted-foreground mb-6">This month</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={payData} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {payData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {payData.map((p, i) => (
              <div key={p._id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground capitalize">{p._id}</span>
                </div>
                <span className="font-medium text-foreground">{p.count} orders</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top products */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Top Products</h3>
            <Star className="w-4 h-4 text-gold" />
          </div>
          <div className="space-y-3">
            {(data?.topProducts || []).map((p, i) => (
              <div key={p._id} className="flex items-center gap-4">
                <span className="w-6 text-sm text-muted-foreground font-mono">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.totalSold} sold</p>
                </div>
                <div className="flex-1">
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                      style={{ width: `${Math.min(100, (p.totalSold / ((data?.topProducts?.[0]?.totalSold || 1))) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground w-20 text-right">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Recent Orders</h3>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {(data?.recentOrders || []).slice(0, 6).map((o) => (
              <div key={o._id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-bold">
                  {o.customerName?.[0] || 'W'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{o.customerName}</p>
                  <p className="text-xs text-muted-foreground">{o.orderNumber} · {formatDateTime(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(o.totalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    o.paymentStatus === 'paid' ? 'bg-green-50 text-green-600 dark:bg-green-950/30' : 'bg-yellow-50 text-yellow-600'
                  }`}>{o.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Employee performance */}
      {data?.employeeStats?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-5">Employee Performance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {data.employeeStats.map((emp, i) => (
              <div key={emp._id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {emp.name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.performance?.totalOrders || 0} orders</p>
                  <p className="text-xs text-primary-500 font-semibold">{formatCurrency(emp.performance?.totalRevenue || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="skeleton h-80 rounded-2xl xl:col-span-2" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}
