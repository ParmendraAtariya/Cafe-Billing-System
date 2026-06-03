import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Receipt, Download, Eye, X, Printer } from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency, formatDateTime, cn } from '../../lib/utils';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewBill, setViewBill] = useState(null);
  const printRef = useRef(null);

  const handleDownload = (bill) => {
    const rows = (bill.items || []).map((item, idx) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:8px 12px;">${idx + 1}</td>
        <td style="padding:8px 12px;">${item.name || item.itemName || '—'}</td>
        <td style="padding:8px 12px;text-align:center;">${item.quantity || 1}</td>
        <td style="padding:8px 12px;text-align:right;">₹${(item.price || item.unitPrice || 0).toFixed(2)}</td>
        <td style="padding:8px 12px;text-align:right;">₹${(item.total || (item.quantity || 1) * (item.price || item.unitPrice || 0)).toFixed(2)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Invoice ${bill.invoiceNumber}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#111;padding:40px;max-width:720px;margin:auto;}
        h1{font-size:28px;margin:0;} .label{color:#6b7280;font-size:12px;} 
        table{width:100%;border-collapse:collapse;margin-top:24px;}
        thead{background:#f3f4f6;} th{padding:10px 12px;text-align:left;font-size:13px;color:#374151;}
        tfoot td{font-weight:bold;padding:8px 12px;}
        .total-row{background:#f9fafb;}
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
        <div><h1>INVOICE</h1><p class="label" style="margin-top:4px;">${bill.invoiceNumber}</p></div>
        <div style="text-align:right;">
          <p class="label">Date</p><p style="margin:2px 0;">${formatDateTime(bill.createdAt)}</p>
          <p class="label" style="margin-top:8px;">Payment</p><p style="margin:2px 0;text-transform:capitalize;">${bill.paymentMethod || '—'}</p>
        </div>
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:24px;">
        <p class="label">Bill To</p>
        <p style="margin:4px 0;font-size:18px;font-weight:600;">${bill.customerName || '—'}</p>
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>Item</th><th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Unit Price</th><th style="text-align:right;">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="total-row"><td colspan="4" style="text-align:right;padding:10px 12px;">Subtotal</td><td style="text-align:right;padding:10px 12px;">₹${(bill.subtotal||0).toFixed(2)}</td></tr>
          <tr><td colspan="4" style="text-align:right;padding:6px 12px;color:#6b7280;">Tax</td><td style="text-align:right;padding:6px 12px;color:#6b7280;">₹${(bill.totalTax||0).toFixed(2)}</td></tr>
          ${bill.discountAmount > 0 ? `<tr><td colspan="4" style="text-align:right;padding:6px 12px;color:#16a34a;">Discount</td><td style="text-align:right;padding:6px 12px;color:#16a34a;">-₹${(bill.discountAmount||0).toFixed(2)}</td></tr>` : ''}
          <tr style="background:#111;color:#fff;"><td colspan="4" style="text-align:right;padding:12px;">TOTAL</td><td style="text-align:right;padding:12px;font-size:16px;">₹${(bill.totalAmount||0).toFixed(2)}</td></tr>
        </tfoot>
      </table>
      <p style="margin-top:40px;text-align:center;color:#9ca3af;font-size:12px;">Thank you for your business!</p>
      </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Invoice-${bill.invoiceNumber}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      const { data } = await api.get(`/bills?${params}`);
      setBills(data.data || []);
      setPagination(data.pagination || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const filtered = search
    ? bills.filter(b => b.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || b.customerName?.toLowerCase().includes(search.toLowerCase()))
    : bills;

  const totalRevenue = bills.reduce((s, b) => s + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bills & Invoices</h1>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(totalRevenue)} this page</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice or customer..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              {['Invoice #', 'Customer', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment', 'Date', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? [...Array(8)].map((_, i) => (
              <tr key={i}><td colSpan={10} className="px-4 py-3"><div className="skeleton h-5 rounded" /></td></tr>
            )) : filtered.map((b, i) => (
              <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="hover:bg-secondary/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-xs font-mono text-primary-500">{b.invoiceNumber}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{b.customerName}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{b.items?.length}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(b.subtotal)}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatCurrency(b.totalTax)}</td>
                <td className="px-4 py-3 text-sm text-green-500">
                  {b.discountAmount > 0 ? `-${formatCurrency(b.discountAmount)}` : '—'}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-foreground">{formatCurrency(b.totalAmount)}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{b.paymentMethod}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(b.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setViewBill(b)} className="p-1.5 hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 rounded-lg transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDownload(b)} className="p-1.5 hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 rounded-lg transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Receipt className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No bills found</p>
          </div>
        )}
      </div>

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

      {/* View Bill Modal */}
      <AnimatePresence>
        {viewBill && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setViewBill(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface-card rounded-t-2xl z-10">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary-500" />
                  <span className="font-semibold text-foreground">Invoice</span>
                  <span className="font-mono text-sm text-primary-500">{viewBill.invoiceNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(viewBill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 rounded-lg text-xs font-medium transition-colors">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button onClick={() => setViewBill(null)}
                    className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bill Content */}
              <div className="p-6 space-y-5" ref={printRef}>
                {/* Customer + Meta */}
                <div className="flex justify-between gap-4">
                  <div className="bg-secondary/50 rounded-xl px-4 py-3 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Bill To</p>
                    <p className="font-semibold text-foreground">{viewBill.customerName || '—'}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl px-4 py-3 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Date</p>
                    <p className="text-sm text-foreground">{formatDateTime(viewBill.createdAt)}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-xl px-4 py-3 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Payment</p>
                    <p className="text-sm text-foreground capitalize">{viewBill.paymentMethod || '—'}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="rounded-xl overflow-hidden border border-border">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        {['#', 'Item', 'Qty', 'Unit Price', 'Amount'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(viewBill.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{idx + 1}</td>
                          <td className="px-4 py-2.5 text-sm text-foreground">{item.name || item.itemName || '—'}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{item.quantity || 1}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{formatCurrency(item.price || item.unitPrice || 0)}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-foreground">
                            {formatCurrency(item.total || (item.quantity || 1) * (item.price || item.unitPrice || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal</span><span>{formatCurrency(viewBill.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax</span><span>{formatCurrency(viewBill.totalTax)}</span>
                    </div>
                    {viewBill.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-500">
                        <span>Discount</span><span>-{formatCurrency(viewBill.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2">
                      <span>Total</span><span>{formatCurrency(viewBill.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
