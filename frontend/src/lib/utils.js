import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date, opts = {}) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', ...opts }).format(new Date(date));

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export const membershipColor = {
  bronze: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  silver: 'text-slate-500 bg-slate-50 dark:bg-slate-900/30',
  gold: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
  platinum: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
};

export const statusColor = {
  pending: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
  preparing: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  ready: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  completed: 'text-gray-600 bg-gray-50 dark:bg-gray-900/30',
  cancelled: 'text-red-600 bg-red-50 dark:bg-red-950/30',
  paid: 'text-green-600 bg-green-50 dark:bg-green-950/30',
  refunded: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
};

export const truncate = (str, n = 30) => str?.length > n ? str.slice(0, n) + '…' : str;

export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const CHART_COLORS = ['#00704A', '#CBA258', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
