import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Coffee, Globe, Bell, Shield, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme, toggle, isDark } = useTheme();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', branch: user?.branch || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${user._id}`, profile);
      updateUser(profile);
      toast.success('Profile updated');
    } catch { } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed successfully');
    } catch { } finally { setSaving(false); }
  };

  const Section = ({ icon: Icon, title, children }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-500" />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Section icon={Coffee} title="Profile Information">
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="text-xs px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded-full capitalize font-medium">{user?.role}</span>
            </div>
          </div>
          {[['name','text','Full Name'],['phone','tel','Phone Number'],['branch','text','Branch']].map(([k,t,l]) => (
            <div key={k}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
              <input type={t} value={profile[k]} onChange={e => setProfile(p => ({ ...p, [k]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary-500" />
            </div>
          ))}
          <button onClick={saveProfile} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </Section>

      {/* Appearance */}
      <Section icon={Palette} title="Appearance">
        <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Toggle between light and dark theme</p>
          </div>
          <button onClick={toggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </Section>

      {/* Security */}
      <Section icon={Shield} title="Change Password">
        <div className="space-y-4">
          {[['currentPassword','Current Password'],['newPassword','New Password'],['confirm','Confirm New Password']].map(([k,l]) => (
            <div key={k}>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l}</label>
              <input type="password" value={passwords[k]} onChange={e => setPasswords(p => ({ ...p, [k]: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
            </div>
          ))}
          <button onClick={changePassword} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow text-sm disabled:opacity-60">
            <Shield className="w-4 h-4" /> {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </Section>

      {/* System info */}
      <Section icon={Globe} title="System Information">
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Version', 'v1.0.0'],
            ['Environment', import.meta.env.MODE],
            ['API URL', import.meta.env.VITE_API_URL || '/api'],
            ['Branch', user?.branch || 'Main Branch'],
          ].map(([k, v]) => (
            <div key={k} className="p-3 bg-secondary rounded-xl">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="text-sm font-medium text-foreground mt-0.5 font-mono">{v}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
