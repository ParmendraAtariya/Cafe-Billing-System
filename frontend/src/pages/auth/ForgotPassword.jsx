// ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111113] p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-glow">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl">Cafe Billing</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white mb-3">Check your email</h2>
            <p className="text-white/50 text-sm mb-8">We've sent a password reset link to <strong className="text-white">{email}</strong></p>
            <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-2 justify-center">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-3xl font-bold text-white mb-2">Forgot password?</h2>
            <p className="text-white/50 mb-8 text-sm">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@cafe.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-primary-500 transition-all text-sm"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow disabled:opacity-60">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <Link to="/login" className="text-white/40 hover:text-white/60 text-sm flex items-center gap-2 mt-6">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
