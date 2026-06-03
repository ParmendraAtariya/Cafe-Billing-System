import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DEMO = [
  { label: 'Admin', email: 'admin@cafe.com', password: 'Admin@123', color: 'from-emerald-500 to-teal-600' },
  { label: 'Cashier', email: 'cashier@cafe.com', password: 'Cashier@123', color: 'from-amber-500 to-orange-600' },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! ☕`);
      navigate(user.role === 'admin' ? '/admin' : '/employee/pos');
    } catch {
      // axios interceptor handles toast
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = async (d) => {
    setForm({ email: d.email, password: d.password });
    setLoading(true);
    try {
      const user = await login(d.email, d.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}! ☕`);
      navigate(user.role === "admin" ? "/admin" : "/employee/pos");
    } catch {
      // axios interceptor handles toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[#0A0A0B]">
      {/* Left - Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-[#0A1A12]" />

        {/* Floating orbs */}
        {[
          { size: 400, top: '-10%', left: '-10%', delay: 0 },
          { size: 300, top: '60%', left: '60%', delay: 1 },
          { size: 200, top: '30%', left: '70%', delay: 2 },
        ].map((orb, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, delay: orb.delay, ease: 'easeInOut' }}
            className="absolute rounded-full opacity-20 bg-primary-400 blur-3xl"
            style={{ width: orb.size, height: orb.size, top: orb.top, left: orb.left }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">Cafe Billing</span>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white/80 text-sm mb-8">
                <Sparkles className="w-4 h-4 text-gold" />
                Premium Café Management
              </div>
              <h1 className="font-display text-6xl font-bold text-white leading-tight mb-6">
                Your café,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-gold-light">
                  perfectly managed.
                </span>
              </h1>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                A complete billing & management platform for modern cafés.
                Track orders, manage inventory, and grow your business.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 grid grid-cols-3 gap-6"
            >
              {[
                { value: '10K+', label: 'Orders Processed' },
                { value: '99.9%', label: 'Uptime' },
                { value: '< 2s', label: 'Bill Generation' },
              ].map((stat) => (
                <div key={stat.label} className="backdrop-blur bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-white/50 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-white/30 text-sm">© 2026 Cafe Billing System. All rights reserved.</p>
        </div>
      </div>

      {/* Right - Login form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-8 bg-[#111113]">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-glow">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">Cafe Billing</span>
          </div>

          <h2 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-white/50 mb-8">Sign in to your account to continue</p>

          {/* Demo login buttons */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {DEMO.map((d) => (
              <button
                key={d.label}
                onClick={() => fillDemo(d)}
                className={`py-2.5 px-4 rounded-xl bg-gradient-to-r ${d.color} text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg`}
              >
                Demo {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">or sign in manually</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@cafe.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-primary-500 focus:bg-white/8 transition-all text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm text-white/70 font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-primary-500 transition-all text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-glow hover:shadow-glow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-8">
            Cafe Billing & Management System v1.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
