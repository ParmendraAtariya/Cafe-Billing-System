import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Star, Package, ImagePlus, X, Link } from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

// ─── Product name/category se matching food photo ─────────────────────────
const FOOD_IMAGES = [
  { keys: ['espresso'],         url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80' },
  { keys: ['cappuccino'],       url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80' },
  { keys: ['iced latte'],       url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80' },
  { keys: ['latte'],            url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { keys: ['mocha'],            url: 'https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?w=400&q=80' },
  { keys: ['cold brew','cold coffee','iced coffee'], url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
  { keys: ['frappuccino','frappe','frap'],           url: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=400&q=80' },
  { keys: ['coffee','cafe'],    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { keys: ['masala chai','chai'],url: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400&q=80' },
  { keys: ['green tea'],        url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
  { keys: ['tea','herbal'],     url: 'https://images.unsplash.com/photo-1565608438257-fac3c27bdbce?w=400&q=80' },
  { keys: ['hot chocolate','cocoa'], url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80' },
  { keys: ['cheesecake'],       url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80' },
  { keys: ['cake','pastry','muffin','cupcake'], url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' },
  { keys: ['brownie','chocolate'],url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80' },
  { keys: ['cookie','biscuit'], url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80' },
  { keys: ['waffle'],           url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80' },
  { keys: ['pancake'],          url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&q=80' },
  { keys: ['wrap'],             url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80' },
  { keys: ['sandwich','sub'],   url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80' },
  { keys: ['burger','patty'],   url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
  { keys: ['pizza'],            url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
  { keys: ['pasta','noodle','spaghetti'], url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80' },
  { keys: ['salad'],            url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { keys: ['soup'],             url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80' },
  { keys: ['rice','biryani'],   url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80' },
  { keys: ['paneer'],           url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80' },
  { keys: ['mango smoothie','mango juice'], url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80' },
  { keys: ['juice','smoothie'], url: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=400&q=80' },
  { keys: ['milkshake','shake'],url: 'https://images.unsplash.com/photo-1572490122747-3e9f7da78b5b?w=400&q=80' },
  { keys: ['water','soda','drink'], url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { keys: ['breakfast','toast'],url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80' },
  { keys: ['egg','omelette'],   url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&q=80' },
  { keys: ['dessert','sweet','ice cream'], url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80' },
  { keys: ['snack','fries','chips'], url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80' },
];

const CATEGORY_IMAGES = {
  coffee:     'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
  teas:       'https://images.unsplash.com/photo-1565608438257-fac3c27bdbce?w=400&q=80',
  tea:        'https://images.unsplash.com/photo-1565608438257-fac3c27bdbce?w=400&q=80',
  desserts:   'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
  dessert:    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
  sandwiches: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  sandwich:   'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  'cold drinks': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
  snacks:     'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80',
  breakfast:  'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  pasta:      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80',
  pizza:      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  burgers:    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  juices:     'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=400&q=80',
};

function getProductImage(product) {
  if (product.image) return product.image;
  const name = (product.name || '').toLowerCase();
  const cat  = (product.category?.name || '').toLowerCase();
  for (const { keys, url } of FOOD_IMAGES) {
    if (keys.some(k => name.includes(k))) return url;
  }
  for (const [catKey, url] of Object.entries(CATEGORY_IMAGES)) {
    if (cat.includes(catKey)) return url;
  }
  return null; // emoji fallback
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const [form, setForm] = useState({
    name: '', description: '', category: '', basePrice: '', taxRate: 18,
    isAvailable: true, isFeatured: false, tags: '', image: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      if (catFilter) params.append('category', catFilter);
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products?${params}`),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data.data || []);
      setPagination(prodRes.data.pagination || {});
      setCategories(catRes.data.categories || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, catFilter]);
  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: categories[0]?._id || '', basePrice: '', taxRate: 18, isAvailable: true, isFeatured: false, tags: '', image: '' });
    setImagePreview(null);
    setImageFile(null);
    setImageMode('upload');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, category: p.category?._id || p.category,
      basePrice: p.basePrice, taxRate: p.taxRate, isAvailable: p.isAvailable,
      isFeatured: p.isFeatured, tags: p.tags?.join(', ') || '', image: p.image || '',
    });
    setImagePreview(p.image || null);
    setImageFile(null);
    setImageMode(p.image?.startsWith('http') && !p.image?.startsWith('blob') ? 'url' : 'upload');
    setShowModal(true);
  };

  const handleImageFile = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm(f => ({ ...f, image: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async () => {
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()) : [];

      let res;
      if (imageFile) {
        // Send as multipart/form-data when a file is selected
        const fd = new FormData();
        Object.entries({ ...form, tags: JSON.stringify(tags) }).forEach(([k, v]) => {
          if (k !== 'image') fd.append(k, v);
        });
        fd.append('image', imageFile);
        if (editing) {
          res = await api.put(`/products/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
          res = await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      } else {
        const payload = { ...form, tags, image: imageMode === 'url' ? form.image : (imagePreview && editing ? editing.image : '') };
        if (editing) {
          res = await api.put(`/products/${editing._id}`, payload);
        } else {
          res = await api.post('/products', payload);
        }
      }

      const saved = res.data.product || res.data;
      // imagePreview ko fallback mein use karo taaki card mein turant photo dikhe
      const savedWithImage = { ...saved, image: saved.image || imagePreview || '' };
      if (editing) {
        setProducts(ps => ps.map(p => p._id === editing._id ? savedWithImage : p));
        toast.success('Product updated');
      } else {
        setProducts(ps => [savedWithImage, ...ps]);
        toast.success('Product created');
      }
      setShowModal(false);
    } catch { toast.error('Kuch galat ho gaya, dobara try karo'); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    setProducts(ps => ps.filter(p => p._id !== id));
    toast.success('Product deleted');
  };

  const toggle = async (id) => {
    const { data } = await api.patch(`/products/${id}/toggle`);
    setProducts(ps => ps.map(p => p._id === id ? data.product : p));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm">{pagination.total || 0} products total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500 transition-colors">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl overflow-hidden group">
              <div className="relative">
                {getProductImage(p) ? (
                  <img src={getProductImage(p)} alt={p.name} className="w-full h-40 object-cover"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                ) : null}
                <div className={cn(
                  'w-full h-40 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/20 items-center justify-center text-5xl',
                  getProductImage(p) ? 'hidden' : 'flex'
                )}>
                  {p.category?.icon || '☕'}
                </div>
                {p.isFeatured && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-gold text-white text-xs rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Featured
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)}
                    className="w-7 h-7 bg-white/90 dark:bg-surface-card/90 rounded-lg flex items-center justify-center text-foreground hover:text-primary-500 transition-colors shadow">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteProduct(p._id)}
                    className="w-7 h-7 bg-white/90 dark:bg-surface-card/90 rounded-lg flex items-center justify-center text-foreground hover:text-red-500 transition-colors shadow">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{p.name}</p>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{p.category?.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-primary-500 font-bold">{formatCurrency(p.basePrice)}</span>
                  <button onClick={() => toggle(p._id)} className={cn('transition-colors', p.isAvailable ? 'text-primary-500' : 'text-muted-foreground')}>
                    {p.isAvailable ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={cn('w-9 h-9 rounded-xl text-sm font-semibold transition-colors',
                page === i + 1 ? 'bg-primary-500 text-white shadow-glow' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-bold text-foreground">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><Package className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">

              {/* ── Image Upload ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Product Photo</label>
                  <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                    {[['upload', '📁 Upload'], ['url', '🔗 URL']].map(([m, label]) => (
                      <button key={m} type="button" onClick={() => { setImageMode(m); clearImage(); }}
                        className={cn('text-xs px-2 py-1 rounded-md font-medium transition-colors',
                          imageMode === m ? 'bg-surface-card text-foreground shadow' : 'text-muted-foreground hover:text-foreground')}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {imageMode === 'upload' ? (
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleImageFile(e.target.files[0])} />
                    {imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img src={imagePreview} alt="preview" className="w-full h-44 object-cover" />
                        <button type="button" onClick={clearImage}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="absolute bottom-2 right-2 text-xs bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg transition-colors">
                          Change Photo
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full h-36 border-2 border-dashed border-border hover:border-primary-500 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary-500 transition-colors group">
                        <ImagePlus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Photo upload karo</span>
                        <span className="text-xs opacity-60">JPG, PNG, WEBP • Max 5MB</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input type="url" value={form.image}
                          onChange={e => { setForm(f => ({ ...f, image: e.target.value })); setImagePreview(e.target.value); }}
                          placeholder="https://example.com/image.jpg"
                          className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                      </div>
                    </div>
                    {imagePreview && (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img src={imagePreview} alt="preview" className="w-full h-36 object-cover"
                          onError={() => setImagePreview(null)} />
                        <button type="button" onClick={clearImage}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {[
                { key: 'name', label: 'Product Name', type: 'text', placeholder: 'e.g. Cappuccino' },
                { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief description...' },
                { key: 'basePrice', label: 'Base Price (₹)', type: 'number', placeholder: '0' },
                { key: 'taxRate', label: 'Tax Rate (%)', type: 'number', placeholder: '18' },
                { key: 'tags', label: 'Tags (comma separated)', type: 'text', placeholder: 'coffee, hot, espresso' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder} rows={2}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 resize-none" />
                  ) : (
                    <input type={field.type} value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                  )}
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500">
                  {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4">
                {[['isAvailable', 'Available'], ['isFeatured', 'Featured']].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-primary-500" />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-border">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-border text-foreground hover:bg-secondary font-semibold rounded-xl transition-colors text-sm">
                Cancel
              </button>
              <button onClick={save}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm">
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
