import { createContext, useContext, useReducer, useCallback } from 'react';

const CartContext = createContext(null);

const GST_RATE = 0.18;

const calcItem = (item) => {
  const unitPrice = item.basePrice + (item.variant?.priceModifier || 0) +
    (item.addons?.reduce((s, a) => s + a.price, 0) || 0);
  const totalPrice = unitPrice * item.quantity;
  const taxAmount = totalPrice - (totalPrice / (1 + GST_RATE));
  return { ...item, unitPrice, totalPrice, taxAmount };
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      const exists = state.items.findIndex(i =>
        i.productId === action.item.productId &&
        i.variant?.name === action.item.variant?.name
      );
      let items;
      if (exists >= 0) {
        items = state.items.map((it, idx) =>
          idx === exists ? calcItem({ ...it, quantity: it.quantity + 1 }) : it
        );
      } else {
        items = [...state.items, calcItem({ ...action.item, quantity: 1 })];
      }
      return { ...state, items };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((_, i) => i !== action.index) };
    case 'UPDATE_QTY': {
      if (action.qty < 1) {
        return { ...state, items: state.items.filter((_, i) => i !== action.index) };
      }
      const items = state.items.map((it, i) =>
        i === action.index ? calcItem({ ...it, quantity: action.qty }) : it
      );
      return { ...state, items };
    }
    case 'SET_CUSTOMER':
      return { ...state, customer: action.customer };
    case 'SET_COUPON':
      return { ...state, coupon: action.coupon, discount: action.discount };
    case 'SET_PAYMENT':
      return { ...state, paymentMethod: action.method };
    case 'SET_TABLE':
      return { ...state, tableNumber: action.table };
    case 'SET_ORDER_TYPE':
      return { ...state, orderType: action.orderType };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
};

const initialState = {
  items: [],
  customer: null,
  coupon: null,
  discount: 0,
  paymentMethod: 'cash',
  tableNumber: '',
  orderType: 'dine-in',
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(reducer, initialState);

  const subtotal = cart.items.reduce((s, i) => s + i.totalPrice, 0);
  const taxAmount = cart.items.reduce((s, i) => s + i.taxAmount, 0);
  const totalAmount = Math.max(0, subtotal - (cart.discount || 0));
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  const addItem = useCallback((item) => dispatch({ type: 'ADD', item }), []);
  const removeItem = useCallback((index) => dispatch({ type: 'REMOVE', index }), []);
  const updateQty = useCallback((index, qty) => dispatch({ type: 'UPDATE_QTY', index, qty }), []);
  const setCustomer = useCallback((customer) => dispatch({ type: 'SET_CUSTOMER', customer }), []);
  const setCoupon = useCallback((coupon, discount) => dispatch({ type: 'SET_COUPON', coupon, discount }), []);
  const setPayment = useCallback((method) => dispatch({ type: 'SET_PAYMENT', method }), []);
  const setTable = useCallback((table) => dispatch({ type: 'SET_TABLE', table }), []);
  const setOrderType = useCallback((orderType) => dispatch({ type: 'SET_ORDER_TYPE', orderType }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  return (
    <CartContext.Provider value={{
      cart, subtotal, taxAmount, totalAmount, itemCount,
      addItem, removeItem, updateQty, setCustomer, setCoupon,
      setPayment, setTable, setOrderType, clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
