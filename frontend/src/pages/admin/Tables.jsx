// Tables.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', capacity: 4, location: 'main-hall' });

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/tables'); setTables(data.tables || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const { data } = await api.post('/tables', form);
      setTables(t => [...t, data.table]);
      setShowModal(false);
      toast.success('Table added');
    } catch { }
  };

  const updateStatus = async (id, status) => {
    const { data } = await api.put(`/tables/${id}`, { status });
    setTables(ts => ts.map(t => t._id === id ? data.table : t));
  };

  const statusConfig = {
    available: { color: 'bg-green-500', label: 'Available', text: 'text-green-600 bg-green-50 dark:bg-green-950/20' },
    occupied: { color: 'bg-red-500', label: 'Occupied', text: 'text-red-600 bg-red-50 dark:bg-red-950/20' },
    reserved: { color: 'bg-yellow-500', label: 'Reserved', text: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20' },
    maintenance: { color: 'bg-gray-500', label: 'Maintenance', text: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
  };

  const grouped = tables.reduce((acc, t) => {
    const loc = t.location || 'main-hall';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tables</h1>
          <p className="text-sm text-muted-foreground">{tables.length} tables · {tables.filter(t => t.status === 'available').length} available</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm">
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(statusConfig).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <div className={cn('w-3 h-3 rounded-full', val.color)} />
            <span className="text-muted-foreground">{val.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : (
        Object.entries(grouped).map(([location, locationTables]) => (
          <div key={location}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">
              {location.replace('-', ' ')}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {locationTables.map((table, i) => {
                const config = statusConfig[table.status];
                return (
                  <motion.div key={table._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                    className="glass-card rounded-2xl p-4 text-center cursor-pointer hover:-translate-y-1 transition-all group">
                    <div className={cn('w-3 h-3 rounded-full mx-auto mb-2', config.color)} />
                    <p className="font-bold text-foreground text-lg">{table.tableNumber}</p>
                    <p className="text-xs text-muted-foreground mb-3">👥 {table.capacity}</p>
                    <select value={table.status} onChange={e => updateStatus(table._id, e.target.value)}
                      className={cn('w-full text-xs px-2 py-1 rounded-lg border-0 font-semibold cursor-pointer text-center', config.text)}>
                      {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                    </select>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-foreground">Add Table</h2>
            {[['tableNumber','text','Table Number (e.g. T13)'],['capacity','number','Seating Capacity']].map(([k,t,ph]) => (
              <div key={k}>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{ph}</label>
                <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
              <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500">
                <option value="main-hall">Main Hall</option>
                <option value="outdoor">Outdoor</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border text-foreground hover:bg-secondary font-semibold rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl text-sm shadow-glow transition-colors">Add Table</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Tables;
