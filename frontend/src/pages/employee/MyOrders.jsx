import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Receipt, Eye, Printer } from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency, formatDateTime, statusColor, cn } from '../../lib/utils';

// ── Receipt Printer ───────────────────────────────────────────────────────────
function printOrderReceipt(o) {
  const now = new Date();
  const dateStr = new Date(o.createdAt || now).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = new Date(o.createdAt || now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const itemsHtml = (o.items || []).map(item => `
    <tr>
      <td style="padding:3px 0;font-size:12px;">${item.name || item.productName || ''}${item.variantName ? ` (${item.variantName})` : ''}</td>
      <td style="text-align:center;font-size:12px;">${item.quantity}</td>
      <td style="text-align:right;font-size:12px;">₹${((item.unitPrice || item.price || 0) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const pm = (o.paymentMethod || 'cash').toLowerCase();
  const pmColors = { cash: '#1a7a1a', upi: '#5F259F', card: '#1565C0' };
  const pmEmoji  = { cash: '💵', upi: '📱', card: '💳' };
  const badgeColor = pmColors[pm] || '#333';

  let paymentInfoHtml = `
    <tr class="total-row">
      <td>Payment</td>
      <td style="text-align:right;color:${badgeColor};font-weight:bold;">${pmEmoji[pm] || ''} ${pm.toUpperCase()}</td>
    </tr>`;

  if (pm === 'card' && o.cardLast4) {
    paymentInfoHtml += `<tr><td colspan="2" style="font-size:10px;color:#555;text-align:right;">•••• •••• •••• ${o.cardLast4}</td></tr>`;
  }
  if (pm === 'upi' && o.upiId) {
    paymentInfoHtml += `<tr><td colspan="2" style="font-size:10px;color:#555;text-align:right;">${o.upiId}</td></tr>`;
  }

  const subtotal   = o.subtotal   ?? (o.totalAmount - (o.taxAmount || 0) + (o.discountAmount || 0));
  const taxAmount  = o.taxAmount  ?? 0;
  const discount   = o.discountAmount ?? 0;
  const total      = o.totalAmount ?? 0;

  const win = window.open('', '_blank', 'width=340,height=700');
  if (!win) { alert('Popup blocked! Please allow popups to print receipt.'); return; }
  win.document.write(`
    <!DOCTYPE html><html><head><title>Receipt ${o.orderNumber || ''}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Courier New',monospace; width:290px; margin:0 auto; padding:12px; background:#fff; color:#000; }
      .center { text-align:center; }
      .bold { font-weight:bold; }
      .divider { border-top:1px dashed #000; margin:6px 0; }
      table { width:100%; border-collapse:collapse; }
      .total-row td { font-weight:bold; font-size:13px; padding-top:4px; }
      .grand-total td { font-size:15px; font-weight:bold; border-top:2px solid #000; padding-top:5px; }
      .discount-row td { color:#2a7a2a; }
      .badge { display:inline-block; padding:2px 10px; border-radius:3px; font-size:11px; font-weight:bold; color:#fff; background:${badgeColor}; }
    </style></head><body>
      <div class="center" style="margin-bottom:4px;">
        <div style="font-size:22px;">☕</div>
        <div class="bold" style="font-size:17px; letter-spacing:3px;">CAFE POS</div>
        <div style="font-size:10px; color:#555;">Your Favourite Coffee Stop</div>
      </div>
      <div class="divider"></div>
      <div style="font-size:11px;">
        <div style="display:flex;justify-content:space-between;">
          <span>Date: ${dateStr}</span><span>Time: ${timeStr}</span>
        </div>
        <div>Order: <strong>${o.orderNumber || '—'}</strong></div>
        ${o.orderType  ? `<div>Type: ${o.orderType.toUpperCase()}</div>` : ''}
        ${o.tableNumber? `<div>Table: <strong>${o.tableNumber}</strong></div>` : ''}
        ${o.customerName ? `<div>Customer: ${o.customerName}</div>` : ''}
        ${o.staffName   ? `<div>Staff: ${o.staffName}</div>` : ''}
      </div>
      <div class="divider"></div>
      <table>
        <thead>
          <tr style="border-bottom:1px solid #000;">
            <th style="text-align:left;font-size:11px;padding-bottom:3px;">Item</th>
            <th style="text-align:center;font-size:11px;padding-bottom:3px;">Qty</th>
            <th style="text-align:right;font-size:11px;padding-bottom:3px;">Amt</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="divider"></div>
      <table>
        <tr><td style="font-size:12px;">Subtotal</td><td style="text-align:right;font-size:12px;">₹${subtotal.toFixed(2)}</td></tr>
        ${discount > 0 ? `<tr class="discount-row"><td style="font-size:12px;">Discount${o.couponCode ? ` (${o.couponCode})` : ''}</td><td style="text-align:right;font-size:12px;">-₹${discount.toFixed(2)}</td></tr>` : ''}
        <tr><td style="font-size:12px;">GST (5%)</td><td style="text-align:right;font-size:12px;">₹${taxAmount.toFixed(2)}</td></tr>
        <tr class="grand-total"><td>TOTAL</td><td style="text-align:right;">₹${total.toFixed(2)}</td></tr>
        ${paymentInfoHtml}
      </table>
      <div class="divider"></div>
      <div class="center" style="margin-top:6px;"><span class="badge">${pm.toUpperCase()} PAYMENT</span></div>
      <div class="divider"></div>
      <div class="center" style="font-size:11px; margin-top:4px;">Thank you for visiting! ☕</div>
      <div class="center" style="font-size:10px; margin-top:2px; color:#555;">Powered by Cafe POS</div>
      <div class="center" style="font-size:10px; margin-top:6px; color:#888;">*** Customer Copy ***</div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 600); }<\/script>
    </body></html>
  `);
  win.document.close();
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [printingId, setPrintingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      const { data } = await api.get(`/orders?${params}`);
      setOrders(data.data || []);
      setPagination(data.pagination || {});
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  // Fetch full order details then print
  const handlePrint = async (orderId) => {
    setPrintingId(orderId);
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      const order = data.order || data;
      printOrderReceipt(order);
    } catch {
      // Fallback: print from list data if detail fetch fails
      const order = orders.find(o => o._id === orderId);
      if (order) printOrderReceipt(order);
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5 h-full overflow-auto scrollbar-thin">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Orders</h1>
          <p className="text-sm text-muted-foreground">{pagination.total || 0} orders processed</p>
        </div>
        <button onClick={load} className="p-2.5 bg-secondary hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
      </div>

      <div className="space-y-3">
        {loading ? [...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />) :
          orders.map((o, i) => (
            <motion.div key={o._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-primary-500 font-semibold">{o.orderNumber}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[o.status])}>{o.status}</span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{o.customerName}</p>
                <p className="text-xs text-muted-foreground">{o.items?.length} items · {o.paymentMethod} · {formatDateTime(o.createdAt)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-foreground">{formatCurrency(o.totalAmount)}</p>
                <p className="text-xs text-muted-foreground capitalize">{o.orderType}</p>
              </div>
              <button
                onClick={() => handlePrint(o._id)}
                disabled={printingId === o._id}
                title="Print Receipt"
                className="p-2 hover:bg-primary-500/10 text-muted-foreground hover:text-primary-500 rounded-lg transition-colors disabled:opacity-50">
                {printingId === o._id
                  ? <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                  : <Printer className="w-4 h-4" />
                }
              </button>
            </motion.div>
          ))
        }
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Receipt className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No orders yet</p>
            <p className="text-xs mt-1">Orders you process will appear here</p>
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
    </div>
  );
}
