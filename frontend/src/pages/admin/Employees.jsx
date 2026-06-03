import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, UserCog, Edit2, Ban, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const ROLES = ['employee', 'cashier', 'admin'];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', phone: '', branch: 'Main Branch' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setEmployees(data.users || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'cashier', phone: '', branch: 'Main Branch' });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({ name: emp.name, email: emp.email, password: '', role: emp.role, phone: emp.phone || '', branch: emp.branch || 'Main Branch' });
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (editing) {
        const { password, ...rest } = form;
        const { data } = await api.put(`/users/${editing._id}`, rest);
        setEmployees(es => es.map(e => e._id === editing._id ? data.user : e));
        toast.success('Employee updated');
      } else {
        const { data } = await api.post('/auth/register', form);
        setEmployees(es => [data.user, ...es]);
        toast.success('Employee created');
      }
      setShowModal(false);
    } catch { }
  };

  const toggleActive = async (emp) => {
    await api.put(`/users/${emp._id}`, { isActive: !emp.isActive });
    setEmployees(es => es.map(e => e._id === emp._id ? { ...e, isActive: !e.isActive } : e));
    toast.success(emp.isActive ? 'Employee deactivated' : 'Employee activated');
  };

  const roleColor = { admin: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30', cashier: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', employee: 'text-green-600 bg-green-50 dark:bg-green-950/30' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground">{employees.length} team members</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm">
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp, i) => (
            <motion.div key={emp._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={cn('glass-card rounded-2xl p-5', !emp.isActive && 'opacity-60')}>
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  {emp.avatar ? (
                    <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                      {emp.name[0]}
                    </div>
                  )}
                  <div className={cn('absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-card', emp.isActive ? 'bg-green-500' : 'bg-gray-400')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                  <span className={cn('inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 capitalize', roleColor[emp.role])}>
                    {emp.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-secondary rounded-xl p-2 text-center">
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-sm font-bold text-foreground">{emp.performance?.totalOrders || 0}</p>
                </div>
                <div className="bg-secondary rounded-xl p-2 text-center">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-sm font-bold text-primary-500">{formatCurrency(emp.performance?.totalRevenue || 0)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(emp)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-secondary hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 rounded-xl text-xs font-semibold transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => toggleActive(emp)}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors',
                    emp.isActive
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100'
                      : 'bg-green-50 dark:bg-green-950/20 text-green-500 hover:bg-green-100')}>
                  {emp.isActive ? <><Ban className="w-3.5 h-3.5" /> Deactivate</> : <><CheckCircle className="w-3.5 h-3.5" /> Activate</>}
                </button>
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
              <UserCog className="w-5 h-5 text-primary-500" />
              <h2 className="font-bold text-foreground">{editing ? 'Edit Employee' : 'Add Employee'}</h2>
            </div>
            <div className="p-6 space-y-4">
              {[['name','text','Full Name *'],['email','email','Email *'],['phone','tel','Phone'],['branch','text','Branch']].map(([k,t,ph]) => (
                <div key={k}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{ph}</label>
                  <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                </div>
              ))}
              {!editing && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters"
                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500 capitalize">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
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
