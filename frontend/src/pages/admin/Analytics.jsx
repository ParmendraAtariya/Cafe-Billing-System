import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import api from '../../lib/axios';
import { formatCurrency, CHART_COLORS } from '../../lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-card border border-border rounded-xl p-3 shadow-xl text-sm">
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold text-xs">
          {p.name}: {p.name?.includes('Revenue') || p.name?.includes('revenue') ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export default function Analytics() {
  const [range, setRange] = useState('weekly');
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [payMethods, setPayMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, p, c, h, pm] = await Promise.all([
          api.get(`/analytics/sales?range=${range}`),
          api.get('/analytics/products'),
          api.get('/analytics/categories'),
          api.get('/analytics/peak-hours'),
          api.get('/analytics/payment-methods'),
        ]);
        setSales(s.data.chart || []);
        setProducts(p.data.products || []);
        setCategories(c.data.categories || []);
        setPeakHours(h.data.peakHours || []);
        setPayMethods(pm.data.paymentMethods || []);
      } finally { setLoading(false); }
    };
    load();
  }, [range]);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="grid grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">Insights and performance metrics</p>
        </div>
        <div className="flex gap-2 bg-secondary p-1 rounded-xl">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                range === r.key ? 'bg-primary-500 text-white shadow-glow' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-1">Revenue & Orders</h3>
        <p className="text-sm text-muted-foreground mb-6 capitalize">{range} overview</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={sales} margin={{ left: -10, right: 10 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00704A" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#00704A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CBA258" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#CBA258" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
            <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#00704A" strokeWidth={2.5} fill="url(#g1)" dot={false} />
            <Area type="monotone" dataKey="orders" name="Orders" stroke="#CBA258" strokeWidth={2} fill="url(#g2)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-5">Top Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={products.slice(0, 8)} layout="vertical" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} fill="#00704A">
                {products.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.9} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-5">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categories.filter(c => c.name)} dataKey="revenue" nameKey="name"
                cx="50%" cy="50%" outerRadius={90} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {categories.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Peak hours */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-1">Peak Hours</h3>
          <p className="text-sm text-muted-foreground mb-5">Order volume by hour of day</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={peakHours.filter(h => h.hour >= 7 && h.hour <= 22)} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Orders" fill="#00704A" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment methods */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-5">Payment Methods</h3>
          <div className="space-y-4">
            {payMethods.map((p, i) => {
              const total = payMethods.reduce((s, x) => s + x.count, 0);
              const pct = total ? ((p.count / total) * 100).toFixed(1) : 0;
              return (
                <div key={p._id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground capitalize font-medium">{p._id}</span>
                    <span className="text-muted-foreground">{p.count} orders · {formatCurrency(p.total)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
