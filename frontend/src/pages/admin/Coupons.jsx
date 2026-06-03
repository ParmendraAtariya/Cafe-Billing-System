import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Ticket, Trash2, ToggleLeft, ToggleRight, Copy, Check } from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ── Default coupons to pre-create if none exist ───────────────────────────────
const DEFAULT_COUPONS = [
  {
    code: 'SAVE50',
    description: 'Flat ₹50 off on your order',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 150,
    maxDiscountAmount: 50,
    usageLimit: 100,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  },
  {
    code: 'SAVE100',
    description: 'Flat ₹100 off on orders above ₹300',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 300,
    maxDiscountAmount: 100,
    usageLimit: 50,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  },
  {
    code: 'SAVE150',
    description: 'Flat ₹150 off on orders above ₹500',
    discountType: 'fixed',
    discountValue: 150,
    minOrderAmount: 500,
    maxDiscountAmount: 150,
    usageLimit: 30,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  },
];

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percentage', discountValue: '',
    minOrderAmount: 0, maxDiscountAmount: '', usageLimit: '',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/coupons');
      setCoupons(data.coupons || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Auto-seed 3 default coupons if none exist ────────────────────────────
  const seedDefaultCoupons = async () => {
    setSeeding(true);
    let created = 0;
    for (const coupon of DEFAULT_COUPONS) {
      try {
        const { data } = await api.post('/coupons', coupon);
        setCoupons(c => [data.coupon, ...c]);
        created++;
      } catch {
        // coupon code might already exist — skip
      }
    }
    setSeeding(false);
    if (created > 0) toast.success(`${created} default coupon${created > 1 ? 's' : ''} created!`);
    else toast('Default coupons already exist', { icon: 'ℹ️' });
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      };

      const { data } = await api.post('/coupons', payload);
      setCoupons(c => [data.coupon, ...c]);
      setShowModal(false);
      toast.success('Coupon created');
    } catch { 
      toast.error('Failed to create coupon');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    await api.delete(`/coupons/${id}`);
    setCoupons(c => c.filter(x => x._id !== id));
    toast.success('Coupon deleted');
  };

  const toggle = async (c) => {
    const { data } = await api.put(`/coupons/${c._id}`, { isActive: !c.isActive });
    setCoupons(cs => cs.map(x => x._id === c._id ? data.coupon : x));
  };

  const copyCode = (c) => {
    navigator.clipboard.writeText(c.code);
    setCopiedId(c._id);
    toast.success(`"${c.code}" copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (c) => new Date(c.validUntil) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} coupons created</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm">
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
        </div>
      ) : coupons.length === 0 ? (
        /* Empty state — prompt to seed */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
          <Ticket className="w-14 h-14 opacity-20" />
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">No coupons yet</p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={cn('glass-card rounded-2xl p-5 relative overflow-hidden', (!c.isActive || isExpired(c)) && 'opacity-60')}>
              {/* Dashed coupon border effect */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />

              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket className="w-4 h-4 text-primary-500" />
                    <span className="font-mono font-bold text-foreground tracking-widest text-sm">{c.code}</span>
                    <button onClick={() => copyCode(c)}
                      title="Copy code"
                      className={cn('ml-1 p-1 rounded-lg transition-all',
                        copiedId === c._id
                          ? 'text-green-500 bg-green-50 dark:bg-green-950/20'
                          : 'text-muted-foreground hover:text-primary-500 hover:bg-primary-500/10')}>
                      {copiedId === c._id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggle(c)} className={cn('transition-colors', c.isActive ? 'text-primary-500' : 'text-muted-foreground')}>
                    {c.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => remove(c._id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-primary-500">
                  {c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {c.discountType === 'percentage' ? 'off' : 'flat off'}
                  </span>
                </span>
                <span className={cn('text-xs px-2 py-1 rounded-full font-semibold',
                  isExpired(c) ? 'bg-red-50 dark:bg-red-950/20 text-red-500' :
                  c.isActive ? 'bg-green-50 dark:bg-green-950/20 text-green-500' : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground')}>
                  {isExpired(c) ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Min order: <span className="text-foreground font-medium">{formatCurrency(c.minOrderAmount)}</span></div>
                <div>Used: <span className="text-foreground font-medium">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</span></div>
                <div>From: <span className="text-foreground font-medium">{formatDate(c.validFrom)}</span></div>
                <div>Until: <span className="text-foreground font-medium">{formatDate(c.validUntil)}</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <Ticket className="w-5 h-5 text-primary-500" />
              <h2 className="font-bold text-foreground">Create Coupon</h2>
            </div>
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
              {[
                ['code','text','Coupon Code (e.g. SAVE20)'],
                ['description','text','Description'],
                ['discountValue','number','Discount Value'],
                ['minOrderAmount','number','Minimum Order (₹)'],
                ['maxDiscountAmount','number','Max Discount Cap (₹)'],
                ['usageLimit','number','Usage Limit (blank = unlimited)']
              ].map(([k,t,ph]) => (
                <div key={k}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{ph}</label>
                  <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    placeholder={ph}
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Discount Type</label>
                <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['validFrom','Valid From'],['validUntil','Valid Until']].map(([k,l]) => (
                  <div key={k}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
                    <input type="date" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-border text-foreground hover:bg-secondary font-semibold rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={save}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl text-sm shadow-glow transition-colors">Create Coupon</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}