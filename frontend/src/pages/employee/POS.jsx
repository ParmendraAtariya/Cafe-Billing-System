import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Tag, User,
  CreditCard, Banknote, Smartphone, CheckCircle,
  Receipt, X, Coffee, AlertCircle, Camera, Printer
} from 'lucide-react';
import api from '../../lib/axios';
import { useCart } from '../../context/CartContext';
import { formatCurrency, cn, debounce } from '../../lib/utils';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
];

// ── Product image matching ────────────────────────────────────────────────────
const FOOD_IMAGES = [
  { keys: ['iced latte'],                              url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80' },
  { keys: ['latte'],                                   url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80' },
  { keys: ['espresso'],                                url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80' },
  { keys: ['cappuccino'],                              url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80' },
  { keys: ['mocha'],                                   url: 'https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?w=400&q=80' },
  { keys: ['cold brew', 'cold coffee'],                url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
  { keys: ['frappuccino', 'frappe', 'frap'],           url: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=400&q=80' },
  { keys: ['coffee', 'cafe'],                          url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { keys: ['masala chai', 'chai'],                     url: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=400&q=80' },
  { keys: ['green tea'],                               url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
  { keys: ['tea', 'herbal'],                           url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80' },
  { keys: ['hot chocolate', 'cocoa'],                  url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&q=80' },
  { keys: ['cheesecake'],                              url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80' },
  { keys: ['cake', 'pastry', 'muffin', 'cupcake'],    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80' },
  { keys: ['brownie', 'chocolate'],                    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80' },
  { keys: ['cookie', 'biscuit'],                       url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80' },
  { keys: ['waffle'],                                  url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80' },
  { keys: ['pancake'],                                 url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&q=80' },
  { keys: ['sandwich', 'sub'],                         url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80' },
  { keys: ['burger', 'patty'],                         url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
  { keys: ['pizza'],                                   url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
  { keys: ['pasta', 'noodle', 'spaghetti'],            url: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80' },
  { keys: ['salad'],                                   url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { keys: ['mango smoothie', 'mango juice'],           url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80' },
  { keys: ['juice', 'smoothie'],                       url: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=400&q=80' },
  { keys: ['milkshake', 'shake'],                      url: 'https://images.unsplash.com/photo-1572490122747-3e9f7da78b5b?w=400&q=80' },
  { keys: ['water', 'soda', 'drink'],                  url: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80' },
  { keys: ['wrap'],                                    url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80' },
  { keys: ['snack', 'fries', 'chips'],                 url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80' },
];

const CATEGORY_FALLBACK = {
  coffee:         'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
  'cold drinks':  'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400&q=80',
  desserts:       'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  tea:            'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80',
  sandwiches:     'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  snacks:         'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80',
};

function getProductImage(product) {
  if (product.image) return product.image;
  const name = (product.name || '').toLowerCase();
  const cat  = (product.category?.name || '').toLowerCase();
  for (const { keys, url } of FOOD_IMAGES) {
    if (keys.some(k => name.includes(k))) return url;
  }
  for (const [catKey, url] of Object.entries(CATEGORY_FALLBACK)) {
    if (cat.includes(catKey)) return url;
  }
  return null;
}

// ── Real UPI App SVG Icons (Accurate Brand Logos) ─────────────────────────────
const GPay = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#fff" stroke="#e8e8e8" strokeWidth="1"/>
    <path d="M34.5 24.2c0-.7-.1-1.4-.2-2H24v3.8h5.9c-.3 1.4-1 2.5-2.1 3.3v2.7h3.4c2-1.8 3.3-4.5 3.3-7.8z" fill="#4285F4"/>
    <path d="M24 36c3 0 5.5-1 7.3-2.7l-3.4-2.7c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.8H14v2.8C15.8 33.8 19.6 36 24 36z" fill="#34A853"/>
    <path d="M17.6 26.9c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1v-2.8H14c-.8 1.5-1.2 3.2-1.2 5s.4 3.5 1.2 5l3.6-3z" fill="#FBBC04"/>
    <path d="M24 17.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3C29.5 13.6 27 12.5 24 12.5c-4.4 0-8.2 2.5-10 6.2l3.6 2.8c.9-2.8 3.4-4.4 6.4-4.4z" fill="#EA4335"/>
  </svg>
);

const PhonePeIcon = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#5F259F"/>
    <path d="M16 13h10c3.3 0 6 2.7 6 6s-2.7 6-6 6h-4v10h-6V13z" fill="#fff" opacity="0.95"/>
    <path d="M22 19h3c1.1 0 2 .9 2 2s-.9 2-2 2h-3v-4z" fill="#5F259F"/>
    <circle cx="34" cy="34" r="6" fill="#fff" opacity="0.2"/>
    <text x="34" y="37.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">₹</text>
  </svg>
);

const PaytmIcon = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#fff"/>
    <rect x="8" y="10" width="14" height="14" rx="2" fill="#00BAF2"/>
    <rect x="26" y="10" width="14" height="14" rx="2" fill="#00BAF2"/>
    <rect x="8" y="28" width="14" height="10" rx="2" fill="#00BAF2"/>
    <rect x="26" y="28" width="14" height="10" rx="2" fill="#00BAF2"/>
    <rect x="11" y="13" width="5" height="8" rx="1" fill="#fff"/>
    <rect x="11" y="13" width="8" height="4" rx="1" fill="#fff"/>
  </svg>
);

const BHIMIcon = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#fff"/>
    <rect x="4" y="4" width="40" height="13" rx="8" fill="#FF9933"/>
    <rect x="4" y="17" width="40" height="14" fill="#fff"/>
    <rect x="4" y="31" width="40" height="13" rx="8" fill="#138808"/>
    <circle cx="24" cy="24" r="5" fill="none" stroke="#000080" strokeWidth="1.5"/>
    <circle cx="24" cy="24" r="1.2" fill="#000080"/>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
      <line key={i} x1="24" y1="24"
        x2={24 + 3.5 * Math.cos(deg * Math.PI / 180)}
        y2={24 + 3.5 * Math.sin(deg * Math.PI / 180)}
        stroke="#000080" strokeWidth="0.8"/>
    ))}
    <rect x="0" y="38" width="48" height="10" rx="0" fill="#000080" opacity="0.85"/>
    <text x="24" y="46" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff" letterSpacing="2">BHIM</text>
  </svg>
);

const AmazonPayIcon = () => (
  <svg viewBox="0 0 48 48" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#FF9900"/>
    <text x="24" y="21" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">amazon</text>
    <text x="24" y="31" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">pay</text>
    <path d="M14 35 Q24 40 34 35" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 33 L34 35 L31 36" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UPI_APPS = [
  { id: 'gpay',       label: 'GPay',       Icon: GPay        },
  { id: 'phonepe',    label: 'PhonePe',    Icon: PhonePeIcon },
  { id: 'paytm',      label: 'Paytm',      Icon: PaytmIcon   },
  { id: 'bhim',       label: 'BHIM',       Icon: BHIMIcon    },
  { id: 'amazonpay',  label: 'Amazon Pay', Icon: AmazonPayIcon },
];

// ── Universal Receipt Printer (Cash / UPI / Card) ────────────────────────────
function printReceipt({ order, cart, subtotal, discount, discountLabel, taxAmount, totalAmount, paymentMethod, upiDetails, cardDetails }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const itemsHtml = (cart?.items || []).map(item => `
    <tr>
      <td style="padding:3px 0;font-size:12px;">${item.name}${item.variant?.name ? ` (${item.variant.name})` : ''}</td>
      <td style="text-align:center;font-size:12px;">${item.quantity}</td>
      <td style="text-align:right;font-size:12px;">₹${(item.unitPrice * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  let paymentInfoHtml = '';
  const pm = (paymentMethod || 'cash').toLowerCase();
  
  if (pm === 'cash') {
    paymentInfoHtml = `
      <tr class="total-row">
        <td>Payment</td>
        <td style="text-align:right;text-transform:uppercase; color:#1a7a1a; font-weight:bold;">💵 CASH</td>
      </tr>`;
  } else if (pm === 'upi') {
    const upiApp = upiDetails?.app ? upiDetails.app.toUpperCase() : 'UPI';
    const upiId  = upiDetails?.id  || '';
    paymentInfoHtml = `
      <tr class="total-row">
        <td>Payment</td>
        <td style="text-align:right;color:#5F259F;font-weight:bold;">📱 ${upiApp}</td>
      </tr>
      ${upiId ? `<tr><td colspan="2" style="font-size:10px;color:#555;text-align:right;">UPI: ${upiId}</td></tr>` : ''}`;
  } else if (pm === 'card') {
    const last4 = cardDetails?.number ? cardDetails.number.replace(/\s/g, '').slice(-4) : '****';
    const cname = cardDetails?.name || '';
    paymentInfoHtml = `
      <tr class="total-row">
        <td>Payment</td>
        <td style="text-align:right;color:#1565C0;font-weight:bold;">💳 CARD</td>
      </tr>
      <tr><td colspan="2" style="font-size:10px;color:#555;text-align:right;">•••• •••• •••• ${last4}</td></tr>
      ${cname ? `<tr><td colspan="2" style="font-size:10px;color:#555;text-align:right;">${cname.toUpperCase()}</td></tr>` : ''}`;
  }

  const badgeColors = { cash: '#1a7a1a', upi: '#5F259F', card: '#1565C0' };
  const badgeColor = badgeColors[pm] || '#333';

  const win = window.open('', '_blank', 'width=340,height=680');
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',monospace; width:290px; margin:0 auto; padding:12px; background:#fff; color:#000; }
        .center { text-align:center; }
        .bold { font-weight:bold; }
        .divider { border-top:1px dashed #000; margin:6px 0; }
        .solid-divider { border-top:2px solid #000; margin:6px 0; }
        table { width:100%; border-collapse:collapse; }
        .total-row td { font-weight:bold; font-size:13px; padding-top:4px; }
        .grand-total td { font-size:15px; font-weight:bold; border-top:2px solid #000; padding-top:5px; }
        .discount-row td { color:#2a7a2a; }
        .badge { display:inline-block; padding:2px 8px; border-radius:3px; font-size:11px; font-weight:bold; color:#fff; background:${badgeColor}; }
        .footer-logo { font-size:20px; }
      </style>
    </head>
    <body>
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
        <div>Order: <strong>${order?.orderNumber || 'POS-' + Date.now()}</strong></div>
        ${cart?.orderType ? `<div>Type: ${cart.orderType.toUpperCase()}</div>` : ''}
        ${cart?.tableNumber ? `<div>Table: <strong>${cart.tableNumber}</strong></div>` : ''}
        ${cart?.customer ? `<div>Customer: ${cart.customer.name}</div>` : ''}
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
        <tr>
          <td style="font-size:12px;">Subtotal</td>
          <td style="text-align:right;font-size:12px;">₹${subtotal?.toFixed(2)}</td>
        </tr>
        ${discount > 0 ? `
        <tr class="discount-row">
          <td style="font-size:12px;">Discount ${discountLabel ? `(${discountLabel})` : ''}</td>
          <td style="text-align:right;font-size:12px;">-₹${discount?.toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td style="font-size:12px;">GST (5%)</td>
          <td style="text-align:right;font-size:12px;">₹${taxAmount?.toFixed(2)}</td>
        </tr>
        <tr class="grand-total">
          <td>TOTAL</td>
          <td style="text-align:right;">₹${totalAmount?.toFixed(2)}</td>
        </tr>
        ${paymentInfoHtml}
      </table>
      <div class="divider"></div>
      <div class="center" style="margin-top:6px;">
        <span class="badge">${pm.toUpperCase()} PAYMENT</span>
      </div>
      <div class="divider"></div>
      <div class="center" style="font-size:11px; margin-top:4px;">Thank you for visiting! ☕</div>
      <div class="center" style="font-size:10px; margin-top:2px; color:#555;">Powered by Cafe POS</div>
      <div class="center" style="font-size:10px; margin-top:6px; color:#888;">*** Customer Copy ***</div>
      <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 600); }<\/script>
    </body>
    </html>
  `);
  win.document.close();
}

export default function POS() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  
  // ── Points Feature State ──
  const [usePoints, setUsePoints]   = useState(false);
  const [pointsInput, setPointsInput] = useState(''); // user types how many points to redeem
  
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(null);
  const [cardStep, setCardStep] = useState('details');
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [cardError, setCardError] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState(null);
  const [upiStep, setUpiStep] = useState('qr');
  const [merchantQrUrl, setMerchantQrUrl] = useState('');
  const [upiMode, setUpiMode] = useState('qr');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const [scannerError, setScannerError] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedUpiId, setScannedUpiId] = useState('');

  const {
    cart, subtotal, itemCount,
    addItem, removeItem, updateQty, setCustomer, setCoupon,
    setPayment, setTable, setOrderType, clearCart,
  } = useCart();

  // Reset usePoints if customer is removed
  useEffect(() => {
    if (!cart.customer) { setUsePoints(false); setPointsInput(''); }
  }, [cart.customer]);

  // Auto-disable points if subtotal drops below 500
  useEffect(() => {
    if (usePoints && subtotal < 500) {
      setUsePoints(false);
      setPointsInput('');
      toast('Points removed: Min order ₹500 required', { icon: 'ℹ️' });
    }
  }, [subtotal, usePoints]);

  // ── DYNAMIC MULTI-DISCOUNT CALCULATION ───────────────────────────────────────
  // Points logic: user types how many points → floor(pts/10)*2 = rupee discount
  const maxPoints      = cart.customer?.loyaltyPoints || 0;
  const enteredPoints  = Math.min(Math.max(parseInt(pointsInput) || 0, 0), maxPoints);
  const pointsDiscount = Math.floor(enteredPoints / 10) * 2; // 10 pts = ₹2

  let activeDiscount = 0;
  let activeDiscountLabel = '';

  if (usePoints && cart.customer && subtotal >= 500 && pointsDiscount > 0) {
    activeDiscount = Math.min(pointsDiscount, subtotal);
    activeDiscountLabel = `${enteredPoints} pts`;
  } else if (!usePoints && cart.coupon && subtotal >= (cart.coupon.minOrderAmount || 0)) {
    if (cart.coupon.discountType === 'percentage') {
      activeDiscount = subtotal * (cart.coupon.discountValue / 100);
      if (cart.coupon.maxDiscountAmount) {
        activeDiscount = Math.min(activeDiscount, cart.coupon.maxDiscountAmount);
      }
    } else {
      activeDiscount = cart.coupon.discountValue;
    }
    activeDiscountLabel = cart.coupon.code;
  }

  const taxAmount   = Math.round((subtotal - activeDiscount) * 0.05 * 100) / 100;
  const totalAmount = Math.round(((subtotal - activeDiscount) + taxAmount) * 100) / 100;

  useEffect(() => {
    const load = async () => {
      const [catRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products?limit=100'),
      ]);
      setCategories(catRes.data.categories || []);
      setProducts(prodRes.data.data || []);
    };
    load();
  }, []);

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const upiProcessingRef = useRef(false);

  useEffect(() => {
    if (upiStep === 'waiting' && !upiProcessingRef.current) {
      upiProcessingRef.current = true;
      const run = async () => {
        await new Promise(r => setTimeout(r, 1800));
        setUpiStep('done');
        await new Promise(r => setTimeout(r, 700));
        try {
          const { data } = await api.post('/orders', {
            items: cart.items.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              variantName: i.variant?.name,
              addons: i.addons?.map(a => a.name),
              notes: i.notes,
            })),
            customerId: cart.customer?._id,
            tableNumber: cart.tableNumber,
            orderType: cart.orderType,
            paymentMethod: 'upi',
            couponCode: usePoints ? null : cart.coupon?.code,
            pointsUsed: usePoints ? enteredPoints : 0,
          });
          const upiAppLabel = selectedUpiApp ? UPI_APPS.find(a => a.id === selectedUpiApp)?.label : '';
          printReceipt({
            order: data.order,
            cart,
            subtotal,
            discount: activeDiscount,
            discountLabel: activeDiscountLabel,
            taxAmount,
            totalAmount,
            paymentMethod: 'upi',
            upiDetails: { app: upiAppLabel || 'UPI', id: upiId || scannedUpiId },
          });
          setOrderSuccess(data);
          setPaymentStep(null);
          clearCart();
          setUsePoints(false); setPointsInput('');
          upiProcessingRef.current = false;
          toast.success('UPI payment done! Receipt printed 🧾');
        } catch {
          upiProcessingRef.current = false;
          toast.error('Order failed, try again');
        }
      };
      run();
    }
    if (upiStep === 'qr') upiProcessingRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upiStep]);

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category?._id === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const searchCustomers = useCallback(debounce(async (q) => {
    if (!q) return setCustomerResults([]);
    const { data } = await api.get(`/customers?search=${q}&limit=5`);
    setCustomerResults(data.data || []);
  }, 300), []);

  const applyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, orderAmount: subtotal });
      setCoupon(data.coupon, data.discountAmount);
      setUsePoints(false); setPointsInput(''); // Make sure points turn off if coupon applied
      toast.success(`Coupon applied! Saved ${formatCurrency(data.discountAmount)}`);
    } catch { } finally { setCouponLoading(false); }
  };

  const MERCHANT_UPI_ID  = 'cafepOS@okaxis'; 
  const MERCHANT_NAME    = 'Cafe POS';
  const MERCHANT_CODE    = '5812';

  const generateUpiQr = (amount) => {
    const upiString = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount.toFixed(2)}&cu=INR&mc=${MERCHANT_CODE}&tn=${encodeURIComponent('Cafe Order')}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiString)}&ecc=M&margin=10&color=000000&bgcolor=ffffff`;
    return { qrUrl, upiString };
  };

  const checkout = () => {
    if (!cart.items.length) return toast.error('Add items to cart first');
    if (cart.paymentMethod === 'card') {
      setCardStep('details');
      setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
      setCardError('');
      setPaymentStep('card');
    } else if (cart.paymentMethod === 'upi') {
      const { qrUrl } = generateUpiQr(totalAmount);
      setMerchantQrUrl(qrUrl);
      setUpiStep('qr');
      setUpiMode('qr');
      setSelectedUpiApp(null);
      setUpiId('');
      setScannedUpiId('');
      setPaymentStep('upi');
    } else {
      placeOrderAndPrintReceipt();
    }
  };

  const placeOrderAndPrintReceipt = async () => {
    setCheckoutLoading(true);
    try {
      const { data } = await api.post('/orders', {
        items: cart.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          variantName: i.variant?.name,
          addons: i.addons?.map(a => a.name),
          notes: i.notes,
        })),
        customerId: cart.customer?._id,
        tableNumber: cart.tableNumber,
        orderType: cart.orderType,
        paymentMethod: 'cash',
        couponCode: usePoints ? null : cart.coupon?.code,
        pointsUsed: usePoints ? enteredPoints : 0,
      });
      
      printReceipt({
        order: data.order,
        cart,
        subtotal,
        discount: activeDiscount,
        discountLabel: activeDiscountLabel,
        taxAmount,
        totalAmount,
        paymentMethod: 'cash',
      });
      
      setOrderSuccess(data);
      clearCart();
      setUsePoints(false); setPointsInput('');
      toast.success('Order placed! Receipt printed 🧾');
    } catch { toast.error('Order failed, try again'); } finally { setCheckoutLoading(false); }
  };

  const formatCardNumber = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
  };

  const confirmCardPayment = async () => {
    const num = cardDetails.number.replace(/\s/g, '');
    if (num.length < 16) return setCardError('Please enter a valid 16-digit card number');
    if (cardDetails.expiry.length < 5) return setCardError('Please enter a valid expiry date');
    if (cardDetails.cvv.length < 3) return setCardError('Please enter a valid CVV');
    if (!cardDetails.name.trim()) return setCardError('Please enter the cardholder name');
    
    setCardError('');
    setCardStep('processing');
    await new Promise(r => setTimeout(r, 2200));
    setCardStep('done');
    await new Promise(r => setTimeout(r, 800));
    
    setCheckoutLoading(true);
    try {
      const { data } = await api.post('/orders', {
        items: cart.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          variantName: i.variant?.name,
          addons: i.addons?.map(a => a.name),
          notes: i.notes,
        })),
        customerId: cart.customer?._id,
        tableNumber: cart.tableNumber,
        orderType: cart.orderType,
        paymentMethod: 'card',
        couponCode: usePoints ? null : cart.coupon?.code,
        pointsUsed: usePoints ? enteredPoints : 0,
      });
      
      printReceipt({
        order: data.order,
        cart,
        subtotal,
        discount: activeDiscount,
        discountLabel: activeDiscountLabel,
        taxAmount,
        totalAmount,
        paymentMethod: 'card',
        cardDetails,
      });
      
      setOrderSuccess(data);
      setPaymentStep(null);
      clearCart();
      setUsePoints(false); setPointsInput('');
      toast.success('Card payment done! Receipt printed 🧾');
    } catch { toast.error('Order failed, try again'); } finally { setCheckoutLoading(false); }
  };

  // Scanner Logic
  const startScanner = async () => {
    setScannerError('');
    setScannerActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      if (!window.jsQR) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      scannerIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });
        if (code && code.data) {
          const upiMatch = code.data.match(/pa=([^&]+)/);
          const detected = upiMatch ? upiMatch[1] : code.data;
          setScannedUpiId(detected);
          setUpiId(detected);
          stopScanner();
          toast.success('QR scanned! UPI ID detected ✓');
        }
      }, 300);
    } catch (err) {
      setScannerError('Camera access denied. Please allow camera permission and try again.');
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (scannerIntervalRef.current) { clearInterval(scannerIntervalRef.current); scannerIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setScannerActive(false);
  };

  if (orderSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="h-full flex items-center justify-center p-8">
        <div className="glass-card rounded-3xl p-10 max-w-md w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary-500" />
          </motion.div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">Order Placed!</h2>
          <p className="text-muted-foreground mb-2">{orderSuccess.order?.orderNumber}</p>
          <p className="text-4xl font-bold text-primary-500 my-6">{formatCurrency(orderSuccess.order?.totalAmount)}</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-secondary rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Payment</p>
              <p className="text-sm font-semibold capitalize">{orderSuccess.order?.paymentMethod}</p>
            </div>
            <div className="bg-secondary rounded-xl p-3">
              <p className="text-xs text-muted-foreground">Points Earned</p>
              <p className="text-sm font-semibold text-primary-500">+{orderSuccess.loyaltyPointsEarned} pts</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setOrderSuccess(null)}
              className="flex-1 py-3 bg-primary-500 hover:bg-primary-400 text-white font-semibold rounded-xl transition-colors shadow-glow">
              New Order
            </button>
            <button
              onClick={() => printReceipt({
                order: orderSuccess.order,
                cart: { items: orderSuccess.order?.items || [], orderType: orderSuccess.order?.orderType, tableNumber: orderSuccess.order?.tableNumber, customer: orderSuccess.order?.customer },
                subtotal: orderSuccess.order?.subtotal || 0,
                discount: orderSuccess.order?.discountAmount || 0,
                discountLabel: 'Discount',
                taxAmount: orderSuccess.order?.taxAmount || 0,
                totalAmount: orderSuccess.order?.totalAmount || 0,
                paymentMethod: orderSuccess.order?.paymentMethod || 'cash',
              })}
              className="flex-1 py-3 border border-border text-foreground hover:bg-secondary font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Products Panel ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
        <div className="p-4 border-b border-border space-y-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            <button onClick={() => setActiveCategory('all')}
              className={cn('flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                activeCategory === 'all' ? 'bg-primary-500 text-white shadow-glow' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              All
            </button>
            {categories.map(c => (
              <button key={c._id} onClick={() => setActiveCategory(c._id)}
                className={cn('flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                  activeCategory === c._id ? 'bg-primary-500 text-white shadow-glow' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
                <span>{c.icon}</span>{c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {filteredProducts.map(product => {
              const inCart = cart.items.some(i => i.productId === product._id);
              return (
                <motion.button key={product._id} whileTap={{ scale: 0.97 }}
                  onClick={() => addItem({
                    productId: product._id,
                    name: product.name,
                    image: product.image,
                    basePrice: product.basePrice,
                    variant: product.variants?.[0] ? { name: product.variants[0].name, priceModifier: product.variants[0].priceModifier } : null,
                    category: product.category?.name,
                  })}
                  className={cn('product-card text-left', inCart && 'in-cart')}>
                  {getProductImage(product) ? (
                    <img src={getProductImage(product)} alt={product.name}
                      className="w-full h-28 object-cover rounded-xl mb-3"
                      onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  ) : null}
                  <div className="w-full h-28 rounded-xl mb-3 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/20 items-center justify-center text-4xl"
                    style={{ display: getProductImage(product) ? 'none' : 'flex' }}>
                    {product.category?.icon || '☕'}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight mb-1 line-clamp-1">{product.name}</p>
                  <p className="text-primary-500 font-bold text-sm">{formatCurrency(product.basePrice)}</p>
                  {inCart && (
                    <div className="mt-2 text-xs text-primary-500 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> In cart
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Coffee className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Cart Panel ───────────────────────────────────────────────────── */}
      <div className="w-80 xl:w-96 flex flex-col bg-surface-card/50 flex-shrink-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-foreground">Current Order</h3>
            {itemCount > 0 && (
              <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{itemCount}</span>
            )}
          </div>
          {itemCount > 0 && (
            <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">Clear all</button>
          )}
        </div>

        {/* Customer search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={cart.customer ? cart.customer.name : customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
              placeholder="Search customer..."
              className="w-full pl-8 pr-8 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
            {cart.customer && (
              <button onClick={() => setCustomer(null)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {customerResults.length > 0 && !cart.customer && (
            <div className="mt-1 bg-surface-card border border-border rounded-lg overflow-hidden shadow-lg">
              {customerResults.map(c => (
                <button key={c._id} onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary text-left transition-colors">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-bold">{c.name[0]}</div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.loyaltyPoints} pts · {c.membership}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order type & table */}
        <div className="flex gap-2 p-3 border-b border-border">
          {['dine-in', 'takeaway'].map(type => (
            <button key={type} onClick={() => setOrderType(type)}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize',
                cart.orderType === type ? 'bg-primary-500 text-white' : 'bg-secondary text-muted-foreground hover:text-foreground')}>
              {type}
            </button>
          ))}
          <input value={cart.tableNumber} onChange={e => setTable(e.target.value)} placeholder="Table #"
            className="w-20 px-2 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          <AnimatePresence>
            {cart.items.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Add products from the menu</p>
              </motion.div>
            ) : (
              cart.items.map((item, index) => (
                <motion.div key={index} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} className="cart-item">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-lg flex-shrink-0">☕</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                    {item.variant?.name && <p className="text-xs text-muted-foreground">{item.variant.name}</p>}
                    <p className="text-xs text-primary-500 font-semibold">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => updateQty(index, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-secondary hover:bg-primary-500 hover:text-white text-foreground flex items-center justify-center transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold text-foreground w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(index, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-secondary hover:bg-primary-500 hover:text-white text-foreground flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem(index)}
                      className="w-6 h-6 rounded-full hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-colors ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Order summary & checkout */}
        {cart.items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">

            {/* ── Coupon row + Points checkbox ── */}
            <div className="space-y-2">

              {/* Row: coupon input | Apply | [☑ Points] */}
              <div className="flex items-center gap-2">

                {/* Coupon input */}
                <div className={cn("relative flex-1 transition-opacity", usePoints && "opacity-40 pointer-events-none")}>
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    disabled={usePoints}
                    className="w-full pl-8 pr-2 py-2 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Apply button */}
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode || usePoints}
                  className="px-3 py-2 bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                  Apply
                </button>

                {/* ── Points Checkbox — right next to Apply ── */}
                {cart.customer && (cart.customer.loyaltyPoints || 0) > 0 && (
                  <label
                    htmlFor="pts-cb"
                    title={subtotal < 500 ? 'Min order ₹500 required' : `Use loyalty points (${cart.customer.loyaltyPoints} available)`}
                    className={cn(
                      'flex-shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer select-none transition-all duration-150',
                      usePoints
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : subtotal < 500
                          ? 'bg-secondary border-border text-muted-foreground opacity-40 cursor-not-allowed'
                          : 'bg-secondary border-border text-muted-foreground hover:border-primary-500 hover:text-primary-500'
                    )}
                  >
                    {/* Hidden native checkbox */}
                    <input
                      type="checkbox"
                      id="pts-cb"
                      checked={usePoints}
                      disabled={subtotal < 500}
                      onChange={e => {
                        if (subtotal < 500) {
                          toast.error('Minimum order ₹500 required to use points');
                          return;
                        }
                        if (e.target.checked && cart.coupon) {
                          setCoupon(null);
                          setCouponCode('');
                          toast('Coupon removed — using points instead', { icon: '⭐' });
                        }
                        if (!e.target.checked) setPointsInput('');
                        setUsePoints(e.target.checked);
                      }}
                      className="sr-only"
                    />
                    {/* Visual checkbox square */}
                    <span className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150',
                      usePoints ? 'bg-white/20 border-white' : 'bg-transparent border-current'
                    )}>
                      {usePoints && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1,4 3.5,7 9,1" />
                        </svg>
                      )}
                    </span>
                    <span>⭐ Pts</span>
                  </label>
                )}
              </div>

              {/* ── Points input row — visible only when checkbox is ticked ── */}
              {usePoints && cart.customer && (
                <div className="flex items-center gap-2 p-2.5 bg-primary-500/8 border border-primary-500/30 rounded-xl animate-in slide-in-from-top-1 duration-150">
                  {/* Star icon */}
                  <span className="text-base flex-shrink-0">⭐</span>

                  {/* Points text input */}
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={10}
                      max={cart.customer.loyaltyPoints}
                      step={10}
                      value={pointsInput}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '');
                        // cap at available points
                        const capped = Math.min(parseInt(raw) || 0, cart.customer.loyaltyPoints);
                        setPointsInput(capped === 0 ? '' : String(capped));
                      }}
                      placeholder={`Enter points (max ${cart.customer.loyaltyPoints})`}
                      className="w-full px-3 py-1.5 bg-background border border-primary-500/40 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Live discount preview */}
                  <div className="flex-shrink-0 text-right min-w-[52px]">
                    {enteredPoints >= 10 ? (
                      <>
                        <p className="text-xs font-bold text-primary-500 leading-none">-{formatCurrency(pointsDiscount)}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{enteredPoints} pts</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-muted-foreground leading-tight">Min<br/>10 pts</p>
                    )}
                  </div>
                </div>
              )}

              {/* Info line below when points checked */}
              {usePoints && cart.customer && (
                <p className="text-[10px] text-muted-foreground px-1">
                  Available: <span className="font-semibold text-primary-500">{cart.customer.loyaltyPoints} pts</span>
                  &nbsp;·&nbsp;10 pts = ₹2&nbsp;·&nbsp;
                  {enteredPoints >= 10
                    ? <span className="text-green-500 font-semibold">Saving {formatCurrency(pointsDiscount)}</span>
                    : 'Enter points to redeem'}
                </p>
              )}

              {/* Coupon disabled hint */}
              {usePoints && (
                <p className="text-[10px] text-amber-500/80 px-1">⚠ Coupon cannot be combined with points</p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {activeDiscount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount ({activeDiscountLabel})</span>
                  <span>-{formatCurrency(activeDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>GST (5%)</span><span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2">
                <span>Total</span>
                <span className="text-primary-500">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Payment methods */}
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setPayment(id)}
                  className={cn('flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all',
                    cart.paymentMethod === id
                      ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                      : 'border-border text-muted-foreground hover:border-primary-300 hover:text-foreground')}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Checkout */}
            <button onClick={checkout} disabled={checkoutLoading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-bold rounded-xl transition-all shadow-glow hover:shadow-glow-lg disabled:opacity-60 flex items-center justify-center gap-2">
              {checkoutLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  Place Order · {formatCurrency(totalAmount)}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Card Payment Modal ─────────────────────────────────────────── */}
      {paymentStep === 'card' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-foreground">Card Payment</h3>
              </div>
              {cardStep === 'details' && (
                <button onClick={() => setPaymentStep(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="p-6 text-center">
              {cardStep === 'details' && (
                <>
                  {/* Card preview */}
                  <div className="w-full h-36 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 mb-5 text-white text-left shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <CreditCard className="w-6 h-6 opacity-80" />
                        <span className="text-xs opacity-70 font-semibold tracking-wider">CREDIT CARD</span>
                      </div>
                      <p className="font-mono text-lg tracking-widest mb-2">
                        {cardDetails.number || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs opacity-60">Card Holder</p>
                          <p className="text-sm font-semibold uppercase">{cardDetails.name || 'YOUR NAME'}</p>
                        </div>
                        <div>
                          <p className="text-xs opacity-60">Expires</p>
                          <p className="text-sm font-semibold">{cardDetails.expiry || 'MM/YY'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-3xl font-bold text-primary-500 mb-5">{formatCurrency(totalAmount)}</p>

                  {/* Card form */}
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Card Number</label>
                      <input
                        value={cardDetails.number}
                        onChange={e => setCardDetails(d => ({ ...d, number: formatCardNumber(e.target.value) }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Cardholder Name</label>
                      <input
                        value={cardDetails.name}
                        onChange={e => setCardDetails(d => ({ ...d, name: e.target.value }))}
                        placeholder="Name on card"
                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Expiry Date</label>
                        <input
                          value={cardDetails.expiry}
                          onChange={e => setCardDetails(d => ({ ...d, expiry: formatExpiry(e.target.value) }))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">CVV</label>
                        <input
                          value={cardDetails.cvv}
                          onChange={e => setCardDetails(d => ({ ...d, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                          placeholder="•••"
                          type="password"
                          maxLength={4}
                          className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                      </div>
                    </div>
                  </div>

                  {cardError && (
                    <div className="flex items-center gap-2 mt-3 p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-500">{cardError}</p>
                    </div>
                  )}

                  <button onClick={confirmCardPayment}
                    className="w-full mt-5 py-3 bg-primary-500 hover:bg-primary-400 text-white font-bold rounded-xl transition-colors shadow-glow">
                    Pay {formatCurrency(totalAmount)} →
                  </button>
                </>
              )}
              {cardStep === 'processing' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-2">Processing...</h4>
                  <p className="text-sm text-muted-foreground">Communicating with bank</p>
                </>
              )}
              {cardStep === 'done' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-green-500">Approved!</h4>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── UPI Payment Modal ──────────────────────────────────────────── */}
      {paymentStep === 'upi' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-foreground">UPI Payment</h3>
              </div>
              {upiStep === 'qr' && (
                <button onClick={() => { stopScanner(); setPaymentStep(null); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="p-4">
              {/* ── Step: QR / Scanner / Manual tabs ── */}
              {upiStep === 'qr' && (
                <>
                  <p className="text-2xl font-bold text-primary-500 text-center mb-3">{formatCurrency(totalAmount)}</p>

                  {/* Mode tabs */}
                  <div className="flex rounded-xl overflow-hidden border border-border mb-4 text-xs font-semibold">
                    {[
                      { id: 'qr',      label: '📲 Show QR'   },
                      { id: 'scanner', label: '📷 Scan QR'   },
                      { id: 'manual',  label: '⌨️ Manual'    },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => { setUpiMode(tab.id); if (tab.id !== 'scanner') stopScanner(); }}
                        className={cn('flex-1 py-2 transition-colors',
                          upiMode === tab.id
                            ? 'bg-primary-500 text-white'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary')}>
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* ═══ TAB: Show Merchant QR ═══ */}
                  {upiMode === 'qr' && (
                    <div className="flex flex-col items-center">
                      {/* UPI App strip */}
                      <div className="flex gap-2 mb-3 justify-center">
                        {UPI_APPS.slice(0,4).map(({ id, Icon }) => (
                          <div key={id} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center bg-white shadow-sm">
                            <Icon />
                          </div>
                        ))}
                      </div>

                      {/* Real QR Code from qrserver.com */}
                      <div className="relative bg-white rounded-2xl p-3 shadow-lg border-2 border-primary-500/30 mb-3">
                        {merchantQrUrl ? (
                          <img
                            src={merchantQrUrl}
                            alt="UPI QR Code"
                            className="w-52 h-52 rounded-xl"
                            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                          />
                        ) : null}
                        {/* Fallback if image fails */}
                        <div className="w-52 h-52 rounded-xl bg-gray-100 items-center justify-center text-center p-4 text-xs text-gray-500"
                          style={{ display: merchantQrUrl ? 'none' : 'flex', flexDirection:'column' }}>
                          <span className="text-3xl mb-2">📱</span>
                          QR not loaded.<br/>Use manual entry.
                        </div>
                        {/* Corner markers overlay */}
                        <div className="absolute top-2 left-2 w-6 h-6 border-t-3 border-l-3 border-primary-500 rounded-tl-md pointer-events-none" style={{borderWidth:'3px 0 0 3px'}} />
                        <div className="absolute top-2 right-2 w-6 h-6 border-t-3 border-r-3 border-primary-500 rounded-tr-md pointer-events-none" style={{borderWidth:'3px 3px 0 0'}} />
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-3 border-l-3 border-primary-500 rounded-bl-md pointer-events-none" style={{borderWidth:'0 0 3px 3px'}} />
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-3 border-r-3 border-primary-500 rounded-br-md pointer-events-none" style={{borderWidth:'0 3px 3px 0'}} />
                      </div>

                      <p className="text-xs text-muted-foreground mb-1 text-center">
                        Scan with any UPI app to pay
                      </p>
                      <p className="text-xs font-mono font-semibold text-foreground bg-secondary px-3 py-1 rounded-lg mb-4">
                        {MERCHANT_UPI_ID}
                      </p>

                      {/* Payment done button — cashier confirms after customer pays */}
                      <button onClick={() => setUpiStep('waiting')}
                        className="w-full py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Payment Received — Confirm
                      </button>
                    </div>
                  )}

                  {/* ═══ TAB: Scan Customer's QR ═══ */}
                  {upiMode === 'scanner' && (
                    <div>
                      {!scannerActive && !scannedUpiId && (
                        <button onClick={startScanner}
                          className="w-full flex items-center justify-center gap-2 py-10 mb-3 border-2 border-dashed border-primary-500/40 hover:border-primary-500 rounded-2xl text-primary-500 font-semibold text-sm transition-colors bg-primary-500/5 hover:bg-primary-500/10">
                          <Camera className="w-8 h-8" />
                          <span>Tap to Start Camera</span>
                        </button>
                      )}

                      {scannerActive && (
                        <div className="relative mb-3 rounded-2xl overflow-hidden bg-black border border-border">
                          <video ref={videoRef} className="w-full h-52 object-cover" playsInline muted autoPlay />
                          <canvas ref={canvasRef} className="hidden" />
                          {/* Animated scan overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-44 h-44 relative">
                              <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-primary-400 rounded-tl-md" />
                              <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-primary-400 rounded-tr-md" />
                              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-primary-400 rounded-bl-md" />
                              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-primary-400 rounded-br-md" />
                              {/* Scanning line */}
                              <div className="absolute left-0 right-0 h-0.5 bg-primary-400/80 shadow-[0_0_8px_2px_rgba(168,85,247,0.6)]"
                                style={{ animation: 'scanLine 2s ease-in-out infinite' }} />
                            </div>
                          </div>
                          <button onClick={stopScanner}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                            <X className="w-4 h-4" />
                          </button>
                          <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-medium bg-black/40 py-1">
                            Scan customer's UPI QR code
                          </p>
                        </div>
                      )}
                      <style>{`
                        @keyframes scanLine { 0%{top:0%} 50%{top:calc(100% - 2px)} 100%{top:0%} }
                        .absolute.left-0.right-0.h-0\\.5 { position: absolute; }

                        /* ── Points Checkbox Card ───────────────── */
                        .points-checkbox-card { position: relative; overflow: hidden; }
                        .points-checkbox-card::before {
                          content: '';
                          position: absolute;
                          inset: 0;
                          border-radius: inherit;
                          opacity: 0;
                          transition: opacity 0.2s ease;
                          background: radial-gradient(circle at 15% 50%, rgba(34,197,94,0.12) 0%, transparent 70%);
                        }
                        .points-checkbox-card--active::before { opacity: 1; }
                        .points-checkbox-box {
                          flex-shrink: 0;
                          transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
                        }
                        .points-checkbox-card:not(.opacity-50):hover .points-checkbox-box {
                          border-color: var(--color-primary-500, #22c55e);
                          box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
                        }
                        .points-checkbox-card:focus-within .points-checkbox-box {
                          box-shadow: 0 0 0 3px rgba(34,197,94,0.25);
                        }
                      `}</style>

                      {scannerError && (
                        <div className="flex items-center gap-2 mb-3 p-2.5 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <p className="text-xs text-red-500">{scannerError}</p>
                        </div>
                      )}
                      {scannedUpiId && (
                        <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-green-700">QR Scanned Successfully!</p>
                            <p className="text-xs text-green-600 font-mono">{scannedUpiId}</p>
                          </div>
                        </div>
                      )}
                      {scannedUpiId && (
                        <button onClick={() => setUpiStep('waiting')}
                          className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-white font-bold rounded-xl transition-colors">
                          Confirm Payment →
                        </button>
                      )}
                    </div>
                  )}

                  {/* ═══ TAB: Manual UPI ID ═══ */}
                  {upiMode === 'manual' && (
                    <div>
                      {/* UPI App selector */}
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Select App</p>
                      <div className="grid grid-cols-5 gap-1.5 mb-4">
                        {UPI_APPS.map(({ id, label, Icon }) => (
                          <button key={id} onClick={() => setSelectedUpiApp(id)}
                            className={cn('flex flex-col items-center py-2 px-0.5 rounded-xl border text-xs font-semibold transition-all',
                              selectedUpiApp === id
                                ? 'border-primary-500 bg-primary-500/10 text-primary-500 scale-105 shadow-md'
                                : 'border-border text-muted-foreground hover:border-primary-300')}>
                            <Icon />
                            <span className="mt-1 text-[9px] text-center leading-tight">{label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="relative mb-4">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input value={upiId} onChange={e => setUpiId(e.target.value)}
                          placeholder="Enter UPI ID (e.g. 9876543210@okaxis)"
                          className="w-full pl-9 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500" />
                      </div>
                      <button onClick={() => { if (selectedUpiApp || upiId) setUpiStep('waiting'); }}
                        disabled={!selectedUpiApp && !upiId}
                        className="w-full py-3 bg-primary-500 hover:bg-primary-400 text-white font-bold rounded-xl transition-colors shadow-glow disabled:opacity-50">
                        Confirm Payment →
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── Step: Waiting (processing) ── */}
              {upiStep === 'waiting' && (
                <div className="py-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-2">Processing Payment...</h4>
                  <p className="text-sm text-muted-foreground">Please wait</p>
                </div>
              )}

              {/* ── Step: Done ── */}
              {upiStep === 'done' && (
                <div className="py-10 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-green-500">Payment Successful!</h4>
                  <p className="text-sm text-muted-foreground mt-1">Printing receipt...</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}