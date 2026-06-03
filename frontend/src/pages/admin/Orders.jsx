// ─── Orders.jsx ──────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, RefreshCw, X, Plus, Minus, Trash2, ShoppingCart, CheckCircle, Loader2, Globe } from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency, formatDateTime, statusColor, cn } from '../../lib/utils';

// ─── Status badge colors ────────────────────────────────────────────────────
const STATUS_STEPS = ['pending', 'preparing', 'ready', 'completed'];
const STATUS_ICONS = { pending: '🕐', preparing: '👨‍🍳', ready: '✅', completed: '🎉', cancelled: '❌' };

// ─── Order Detail Modal ─────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onStatusChange }) {
  if (!order) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface-card rounded-t-2xl z-10">
          <div>
            <p className="text-xs text-muted-foreground">Order</p>
            <p className="font-mono font-bold text-primary-500">{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-semibold px-3 py-1 rounded-full', statusColor[order.status])}>
              {STATUS_ICONS[order.status]} {order.status}
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Customer</p>
              <p className="font-semibold text-foreground text-sm">{order.customerName || '—'}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Payment</p>
              <p className="font-semibold text-foreground text-sm capitalize">{order.paymentMethod || '—'}</p>
            </div>
            <div className="bg-secondary/50 rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Time</p>
              <p className="text-sm text-foreground">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.tableNumber && (
              <div className="bg-secondary/50 rounded-xl px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Table</p>
                <p className="font-semibold text-foreground text-sm">{order.tableNumber}</p>
              </div>
            )}
            {order.source === 'online' && order.phone && (
              <div className="bg-primary-500/10 rounded-xl px-4 py-3 col-span-2">
                <p className="text-xs text-primary-500 mb-1">📱 Online Order — Phone</p>
                <p className="font-semibold text-foreground text-sm">{order.phone}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="bg-secondary/50 px-4 py-2.5">
              <p className="text-xs font-semibold text-muted-foreground">ORDER ITEMS ({order.items?.length})</p>
            </div>
            <div className="divide-y divide-border">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name || item.itemName || '—'}</p>
                    {item.notes && <p className="text-xs text-muted-foreground mt-0.5">Note: {item.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">x{item.quantity || 1}</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency((item.price || item.unitPrice || 0) * (item.quantity || 1))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 border-t border-border pt-4">
            {order.subtotal && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
              </div>
            )}
            {order.totalTax > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax</span><span>{formatCurrency(order.totalTax)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-500">
                <span>Discount</span><span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-foreground">
              <span>Total</span><span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Status Update */}
          {order.status !== 'cancelled' && order.status !== 'completed' && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-semibold">UPDATE STATUS</p>
              <div className="flex gap-2 flex-wrap">
                {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map(s => (
                  <button key={s} onClick={() => onStatusChange(order._id, s)}
                    className={cn('text-xs px-3 py-1.5 rounded-full font-semibold transition-colors border',
                      order.status === s
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-primary-500')}>
                    {STATUS_ICONS[s]} {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {order.notes && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-500 mb-1 font-semibold">SPECIAL NOTES</p>
              <p className="text-sm text-foreground">{order.notes}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Online Order Modal ─────────────────────────────────────────────────────
function OnlineOrderModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=menu, 2=details, 3=success
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [form, setForm] = useState({ customerName: '', phone: '', notes: '', paymentMethod: 'cash' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);
  const [menuSearch, setMenuSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/menu-items?limit=100&available=true');
        setMenuItems(data.data || data || []);
      } catch { setMenuItems([]); }
      finally { setMenuLoading(false); }
    })();
  }, []);

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (item) => setCart(c => ({
    ...c, [item._id]: { ...item, quantity: (c[item._id]?.quantity || 0) + 1 }
  }));
  const removeFromCart = (id) => setCart(c => {
    const updated = { ...c };
    if (updated[id]?.quantity > 1) updated[id] = { ...updated[id], quantity: updated[id].quantity - 1 };
    else delete updated[id];
    return updated;
  });
  const clearItem = (id) => setCart(c => { const u = { ...c }; delete u[id]; return u; });

  const filteredMenu = menuItems.filter(m =>
    m.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
    m.category?.toLowerCase().includes(menuSearch.toLowerCase())
  );

  // Group by category
  const grouped = filteredMenu.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleSubmit = async () => {
    if (!form.customerName.trim()) { setError('Customer name zaroori hai'); return; }
    if (!form.phone.trim()) { setError('Phone number zaroori hai'); return; }
    if (cartItems.length === 0) { setError('Koi item select nahi ki'); return; }
    setError(''); setSubmitting(true);
    try {
      const payload = {
        customerName: form.customerName,
        phone: form.phone,
        notes: form.notes,
        paymentMethod: form.paymentMethod,
        source: 'online',
        items: cartItems.map(i => ({
          itemId: i._id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: i.price * i.quantity,
        })),
        subtotal: cartTotal,
        totalAmount: cartTotal,
      };
      const { data } = await api.post('/orders', payload);
      setSuccessOrder(data.data || data);
      setStep(3);
      onSuccess?.();
    } catch (e) {
      setError(e?.response?.data?.message || 'Order place nahi ho saki, dobara try karo');
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface-card border border-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary-500" />
            <h2 className="font-bold text-foreground">Online Order Place Karo</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 3 && (
          <div className="flex items-center gap-0 px-6 py-3 border-b border-border flex-shrink-0">
            {[['1', 'Menu'], ['2', 'Details']].map(([n, label], idx) => (
              <div key={n} className="flex items-center">
                <div className={cn('flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors',
                  step === idx + 1 ? 'bg-primary-500 text-white' : step > idx + 1 ? 'text-primary-500' : 'text-muted-foreground')}>
                  <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-xs',
                    step > idx + 1 ? 'bg-primary-500 text-white' : '')}>
                    {step > idx + 1 ? '✓' : n}
                  </span>
                  {label}
                </div>
                {idx === 0 && <div className="w-8 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Menu ── */}
        {step === 1 && (
          <>
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Menu search karo..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-6 pb-4 space-y-5">
              {menuLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Menu load ho raha hai...
                </div>
              ) : Object.entries(grouped).length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">Koi item nahi mila</p>
              ) : Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{cat}</p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item._id} className="flex items-center justify-between bg-secondary/40 hover:bg-secondary/70 rounded-xl px-4 py-3 transition-colors">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          {item.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>}
                          <p className="text-sm font-bold text-primary-500 mt-1">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {cart[item._id] ? (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => removeFromCart(item._id)}
                                className="w-7 h-7 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 flex items-center justify-center transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-sm font-bold text-foreground w-5 text-center">{cart[item._id].quantity}</span>
                              <button onClick={() => addToCart(item)}
                                className="w-7 h-7 rounded-lg bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(item)}
                              className="w-8 h-8 rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* Cart Footer */}
            <div className="px-6 py-4 border-t border-border flex-shrink-0">
              {cartItems.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{cartCount} items selected</span>
                    <span className="font-bold text-foreground">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex gap-2 max-h-24 overflow-y-auto">
                    {cartItems.map(i => (
                      <div key={i._id} className="flex items-center gap-1 bg-primary-500/10 text-primary-500 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        {i.name} x{i.quantity}
                        <button onClick={() => clearItem(i._id)} className="ml-1 hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setStep(2)}
                    className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Details Bharo →
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">Koi item select nahi ki abhi</p>
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Customer Details ── */}
        {step === 2 && (
          <>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* Cart Summary */}
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">ORDER SUMMARY ({cartCount} items)</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cartItems.map(i => (
                    <div key={i._id} className="flex justify-between text-sm">
                      <span className="text-foreground">{i.name} <span className="text-muted-foreground">x{i.quantity}</span></span>
                      <span className="font-medium text-foreground">{formatCurrency(i.price * i.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border mt-3 pt-3 flex justify-between font-bold text-foreground">
                  <span>Total</span><span>{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              {/* Customer Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">CUSTOMER NAME *</label>
                  <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    placeholder="Aapka naam likhein"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">PHONE NUMBER *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="10 digit phone number"
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">PAYMENT METHOD</label>
                  <div className="flex gap-2">
                    {['cash', 'card', 'upi', 'online'].map(pm => (
                      <button key={pm} onClick={() => setForm(f => ({ ...f, paymentMethod: pm }))}
                        className={cn('flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors border',
                          form.paymentMethod === pm ? 'bg-primary-500 text-white border-primary-500' : 'border-border text-muted-foreground hover:border-primary-500')}>
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">SPECIAL NOTES (optional)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Koi khaas instruction ho to likhein..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 resize-none" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-500/10 px-4 py-2.5 rounded-xl">{error}</p>}
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 flex-shrink-0">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-semibold rounded-xl transition-colors">
                ← Wapas
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Place Ho Raha Hai...</> : <><ShoppingCart className="w-4 h-4" /> Order Place Karo</>}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4 flex-1">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
              <CheckCircle className="w-16 h-16 text-green-500" />
            </motion.div>
            <h3 className="text-xl font-bold text-foreground">Order Place Ho Gayi! 🎉</h3>
            {successOrder?.orderNumber && (
              <p className="font-mono text-primary-500 font-bold text-lg">{successOrder.orderNumber}</p>
            )}
            <p className="text-sm text-muted-foreground">Aapki order receive ho gayi hai. Hum jaldi taiyar karenge!</p>
            <button onClick={onClose}
              className="mt-4 px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors">
              Done
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Orders Component ──────────────────────────────────────────────────
export function Orders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);
  const [showOnlineOrder, setShowOnlineOrder] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.data || []);
      setPagination(data.pagination || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, status]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const updateStatus = async (id, newStatus) => {
    await api.put(`/orders/${id}/status`, { status: newStatus });
    setOrders(os => os.map(o => o._id === id ? { ...o, status: newStatus } : o));
    if (viewOrder?._id === id) setViewOrder(v => ({ ...v, status: newStatus }));
  };

  const STATUSES = ['', 'pending', 'preparing', 'ready', 'completed', 'cancelled'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">{pagination.total || 0} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowOnlineOrder(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-colors">
            <Globe className="w-4 h-4" /> Online Order
          </button>
          <button onClick={load} className="p-2.5 bg-secondary hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 rounded-xl transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500">
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Time', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? [...Array(8)].map((_, i) => (
              <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
            )) : orders.map((o, i) => (
              <motion.tr key={o._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3 text-xs font-mono text-primary-500">
                  <div className="flex items-center gap-1.5">
                    {o.source === 'online' && <Globe className="w-3 h-3 text-primary-400" title="Online Order" />}
                    {o.orderNumber}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{o.customerName}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{o.items?.length} items</td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatCurrency(o.totalAmount)}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{o.paymentMethod}</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={e => updateStatus(o._id, e.target.value)}
                    className={cn('text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer', statusColor[o.status])}>
                    {['pending','preparing','ready','completed','cancelled'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setViewOrder(o)}
                    className="p-1.5 hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex gap-2 justify-center">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={cn('w-9 h-9 rounded-xl text-sm font-semibold transition-colors',
                page === i + 1 ? 'bg-primary-500 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {viewOrder && (
          <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} onStatusChange={updateStatus} />
        )}
        {showOnlineOrder && (
          <OnlineOrderModal onClose={() => setShowOnlineOrder(false)} onSuccess={load} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Orders;
