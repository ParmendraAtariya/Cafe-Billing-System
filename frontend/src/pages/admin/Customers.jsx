import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, User, Crown, Star } from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency, formatDate, membershipColor, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', birthday: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const { data } = await api.get(`/customers?${params}`);
      setCustomers(data.data || []);
      setPagination(data.pagination || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const save = async () => {
    try {
      const { data } = await api.post('/customers', form);
      setCustomers(c => [data.customer, ...c]);
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', address: '', birthday: '' });
      toast.success('Customer added');
    } catch { }
  };

  const membershipIcon = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">{pagination.total || 0} registered customers</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone || c.email || 'No contact'}</p>
                  <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1', membershipColor[c.membership])}>
                    {membershipIcon[c.membership]} {c.membership}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-secondary rounded-xl p-2">
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-sm font-bold text-foreground">{c.totalOrders}</p>
                </div>
                <div className="bg-secondary rounded-xl p-2">
                  <p className="text-xs text-muted-foreground">Spent</p>
                  <p className="text-sm font-bold text-primary-500">{formatCurrency(c.totalSpent)}</p>
                </div>
                <div className="bg-secondary rounded-xl p-2">
                  <p className="text-xs text-muted-foreground">Points</p>
                  <p className="text-sm font-bold text-yellow-500">{c.loyaltyPoints}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <User className="w-5 h-5 text-primary-500" />
              <h2 className="font-bold text-foreground">Add Customer</h2>
            </div>
            <div className="p-6 space-y-4">
              {[['name','text','Full Name *'],['email','email','Email Address'],['phone','tel','Phone Number'],['address','text','Address'],['birthday','date','Birthday']].map(([k,t,ph]) => (
                <div key={k}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{ph}</label>
                  <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border text-foreground hover:bg-secondary font-semibold rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl text-sm shadow-glow transition-colors">Add Customer</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}