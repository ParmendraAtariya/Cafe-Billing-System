import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const ICONS = ['☕', '🧊', '🍵', '🥐', '🍰', '🥪', '🍹', '🍫', '🥗', '🍕', '🍜', '🧁'];
const COLORS = ['#00704A', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1'];

const CATEGORY_IMAGES = [
  { keys: ['coffee', 'cafe'],                    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { keys: ['cold drink', 'cold drinks', 'iced'], url: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80' },
  { keys: ['tea', 'chai', 'herbal'],             url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80' },
  { keys: ['dessert', 'desserts', 'sweet'],      url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80' },
  { keys: ['cake', 'pastry', 'bakery'],          url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' },
  { keys: ['sandwich', 'sandwiches', 'sub'],     url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80' },
  { keys: ['juice', 'juices', 'smoothie'],       url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
  { keys: ['chocolate', 'cocoa'],                url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80' },
  { keys: ['salad', 'healthy'],                  url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { keys: ['pizza'],                             url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
  { keys: ['pasta', 'noodle'],                   url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80' },
  { keys: ['snack', 'snacks', 'fries'],          url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80' },
  { keys: ['breakfast'],                         url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80' },
  { keys: ['burger', 'burgers'],                 url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
];

function getCategoryImage(name = '') {
  const lower = name.toLowerCase();
  for (const { keys, url } of CATEGORY_IMAGES) {
    if (keys.some(k => lower.includes(k))) return url;
  }
  return null;
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '☕', color: '#00704A', sortOrder: 0 });

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/categories'); setCategories(data.categories || []); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', icon: '☕', color: '#00704A', sortOrder: categories.length }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description, icon: c.icon, color: c.color, sortOrder: c.sortOrder }); setShowModal(true); };

  const save = async () => {
    try {
      if (editing) {
        const { data } = await api.put(`/categories/${editing._id}`, form);
        setCategories(cs => cs.map(c => c._id === editing._id ? data.category : c));
        toast.success('Category updated');
      } else {
        const { data } = await api.post('/categories', form);
        setCategories(cs => [...cs, data.category]);
        toast.success('Category created');
      }
      setShowModal(false);
    } catch { }
  };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    setCategories(cs => cs.filter(c => c._id !== id));
    toast.success('Category deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all">
              {/* Category Image */}
              <div className="relative w-full h-32">
                {getCategoryImage(c.name) ? (
                  <img src={getCategoryImage(c.name)} alt={c.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                ) : null}
                <div
                  className={cn('w-full h-full items-center justify-center text-4xl absolute inset-0', getCategoryImage(c.name) ? 'hidden' : 'flex')}
                  style={{ background: `${c.color}22` }}>
                  {c.icon}
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(c._id)} className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg text-white hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-foreground mb-1">{c.name}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description || 'No description'}</p>
                <div className="mt-3 w-6 h-1.5 rounded-full" style={{ background: c.color }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-border">
              <h2 className="font-bold text-foreground">{editing ? 'Edit Category' : 'Add Category'}</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Coffee"
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description"
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                      className={cn('w-9 h-9 rounded-xl text-lg hover:bg-secondary transition-colors', form.icon === icon && 'bg-primary-500/20 ring-2 ring-primary-500')}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                      className={cn('w-8 h-8 rounded-full transition-all', form.color === color && 'ring-2 ring-offset-2 ring-offset-surface-card ring-white scale-110')}
                      style={{ background: color }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-border text-foreground hover:bg-secondary font-semibold rounded-xl text-sm transition-colors">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl text-sm shadow-glow transition-colors">
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
