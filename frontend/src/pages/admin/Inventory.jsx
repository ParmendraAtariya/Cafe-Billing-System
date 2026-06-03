// Inventory.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, Package } from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [restocking, setRestocking] = useState(null);
  const [form, setForm] = useState({ name: '', unit: 'kg', currentStock: '', minStockLevel: 10, maxStockLevel: 100, costPerUnit: '' });
  const [restockQty, setRestockQty] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory');
      setItems(data.items || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const { data } = await api.post('/inventory', form);
      setItems(i => [data.item, ...i]);
      setShowModal(false);
      toast.success('Item added to inventory');
    } catch { }
  };

  const restock = async () => {
    try {
      await api.post(`/inventory/${restocking._id}/restock`, { quantity: parseFloat(restockQty), costPerUnit: restocking.costPerUnit, notes: 'Manual restock' });
      toast.success('Restocked successfully');
      setRestocking(null);
      setRestockQty('');
      load();
    } catch { }
  };

  const lowStock = items.filter(i => i.currentStock <= i.minStockLevel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">{items.length} items tracked</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <strong>{lowStock.length} items</strong> are below minimum stock level: {lowStock.map(i => i.name).join(', ')}
          </p>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>{['Item', 'Unit', 'Current Stock', 'Min Level', 'Cost/Unit', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? [...Array(6)].map((_, i) => (
              <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
            )) : items.map((item, i) => {
              const isLow = item.currentStock <= item.minStockLevel;
              return (
                <motion.tr key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.unit}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-sm font-semibold', isLow ? 'text-red-500' : 'text-foreground')}>
                      {item.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.minStockLevel}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{formatCurrency(item.costPerUnit)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-semibold px-2 py-1 rounded-full', isLow
                      ? 'text-red-600 bg-red-50 dark:bg-red-950/30'
                      : 'text-green-600 bg-green-50 dark:bg-green-950/30')}>
                      {isLow ? '⚠ Low Stock' : '✓ OK'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setRestocking(item)}
                      className="text-xs px-3 py-1 bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white rounded-lg transition-colors font-semibold">
                      Restock
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-border"><h2 className="font-bold text-foreground">Add Inventory Item</h2></div>
            <div className="p-6 space-y-4">
              {[['name','text','Item Name'],['unit','text','Unit (kg/litre/pcs)'],['currentStock','number','Current Stock'],['minStockLevel','number','Min Stock Level'],['costPerUnit','number','Cost per Unit (₹)']].map(([k,t,ph]) => (
                <div key={k}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{ph}</label>
                  <input type={t} value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))} placeholder={ph}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border text-foreground hover:bg-secondary font-semibold rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl text-sm shadow-glow transition-colors">Add Item</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Restock Modal */}
      {restocking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h2 className="font-bold text-foreground">Restock: {restocking.name}</h2>
            <p className="text-sm text-muted-foreground">Current stock: <strong>{restocking.currentStock} {restocking.unit}</strong></p>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Quantity to Add ({restocking.unit})</label>
              <input type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder="e.g. 20"
                className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRestocking(null)} className="flex-1 py-2.5 border border-border text-foreground hover:bg-secondary font-semibold rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={restock} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl text-sm shadow-glow transition-colors">Restock</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
