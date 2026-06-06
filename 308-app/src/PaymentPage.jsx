import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './PaymentPage.css';

// ---- Card network detection ----
// Based on real IIN/BIN ranges: https://en.wikipedia.org/wiki/Payment_card_number

const CARD_NETWORKS = [
  { name: 'Visa',             pattern: /^4/,                         lengths: [13, 16, 19], icon: 'https://cdn.simpleicons.org/visa' },
  { name: 'Mastercard',       pattern: /^(5[1-5]|2[2-7])/,          lengths: [16],         icon: 'https://cdn.simpleicons.org/mastercard' },
  { name: 'American Express', pattern: /^3[47]/,                     lengths: [15],         icon: 'https://cdn.simpleicons.org/americanexpress' },
  { name: 'Discover',         pattern: /^(6011|65|64[4-9]|622)/,     lengths: [16, 19],     icon: 'https://cdn.simpleicons.org/discover' },
  { name: 'Diners Club',      pattern: /^(30[0-5]|36|38)/,           lengths: [14, 16],     icon: 'https://cdn.simpleicons.org/dinersclub' },
  { name: 'JCB',              pattern: /^35(2[89]|[3-8])/,           lengths: [16, 19],     icon: 'https://cdn.simpleicons.org/jcb' },
  { name: 'UnionPay',         pattern: /^62/,                        lengths: [16, 17, 18, 19], icon: 'https://cdn.simpleicons.org/unionpay' },
  { name: 'Maestro',          pattern: /^(5018|5020|5038|6304|6759|676[1-3])/, lengths: [12, 13, 14, 15, 16, 17, 18, 19], icon: 'https://cdn.simpleicons.org/maestro' },
  { name: 'Troy',             pattern: /^(9792)/,                    lengths: [16],         icon: null },
];

const detectNetwork = (digits) => {
  if (!digits) return null;
  return CARD_NETWORKS.find(n => n.pattern.test(digits)) || null;
};

// ---- Formatters ----

const formatCardNumber = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 19);
  const network = detectNetwork(digits);
  // Amex uses 4-6-5 grouping, everything else uses 4-4-4-4+
  if (network?.name === 'American Express') {
    return digits.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '));
  }
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
};

const formatCVV = (val, network) => {
  const max = network?.name === 'American Express' ? 4 : 3;
  return val.replace(/\D/g, '').slice(0, max);
};

const formatZip = (val) => val.replace(/\D/g, '').slice(0, 5);

// ---- Validators ----

const luhn = (num) => {
  const digits = num.replace(/\D/g, '');
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
};

const validate = (form) => {
  const errors = {};
  if (form.fullName.trim().length < 2) errors.fullName = 'Enter your full name';
  if (form.address.trim().length < 5) errors.address = 'Enter a valid street address';
  if (form.city.trim().length < 2) errors.city = 'Enter a valid city';

  const zip = form.zipCode.replace(/\D/g, '');
  if (zip.length !== 5) errors.zipCode = 'ZIP code must be 5 digits';

  if (form.cardName.trim().length < 2) errors.cardName = 'Enter the name on your card';

  const cardDigits = form.cardNumber.replace(/\D/g, '');
  const network = detectNetwork(cardDigits);

  if (cardDigits.length === 0) {
    errors.cardNumber = 'Enter your card number';
  } else if (!network) {
    errors.cardNumber = 'Unrecognized card network';
  } else if (!network.lengths.includes(cardDigits.length)) {
    errors.cardNumber = `${network.name} cards must be ${network.lengths.join(' or ')} digits`;
  } else if (!luhn(cardDigits)) {
    errors.cardNumber = 'Invalid card number';
  }

  const expiryParts = form.expiry.split('/');
  if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
    errors.expiry = 'Use MM/YY format';
  } else {
    const month = parseInt(expiryParts[0], 10);
    const year = parseInt(expiryParts[1], 10) + 2000;
    if (month < 1 || month > 12) errors.expiry = 'Invalid month';
    else {
      const now = new Date();
      const exp = new Date(year, month);
      if (exp <= now) errors.expiry = 'Card has expired';
    }
  }

  const cvvLen = network?.name === 'American Express' ? 4 : 3;
  const cvv = form.cvv.replace(/\D/g, '');
  if (cvv.length !== cvvLen) errors.cvv = `CVV must be ${cvvLen} digits`;

  return errors;
};

// ---- Component ----

const PaymentPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  const processingRef = useRef(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');
  const authHeaders = { Authorization: `Bearer ${authToken}` };

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    zipCode: '',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}/cart`, {
          headers: authHeaders
        });
        if (!response.ok) throw new Error(`Cart fetch failed (${response.status})`);
        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        setCartItems(items);
        setLoading(false);

        if (items.length === 0) {
          showToast('Your cart is empty! Redirecting to marketplace.', 'info');
          navigate('/home');
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        setLoading(false);
      }
    };

    const fetchWallet = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/wallet`, { headers: authHeaders });
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data.walletBalance || 0);
        }
      } catch {}
    };

    fetchCart();
    fetchWallet();
  }, [userId, navigate]);

  const cardDigits = formData.cardNumber.replace(/\D/g, '');
  const detectedNetwork = detectNetwork(cardDigits);

  const handleField = (name, value) => {
    let formatted = value;
    if (name === 'cardNumber') formatted = formatCardNumber(value);
    else if (name === 'expiry') formatted = formatExpiry(value);
    else if (name === 'cvv') formatted = formatCVV(value, detectedNetwork);
    else if (name === 'zipCode') formatted = formatZip(value);

    setFormData(prev => ({ ...prev, [name]: formatted }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const safeQty = (q) => {
    const n = Number.parseInt(q, 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 1000) : 1;
  };

  const safePrice = (p) => {
    const n = Number(p);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const calculateTotal = () => {
    const sub = cartItems.reduce((acc, item) => {
      return acc + safePrice(item?.product?.price) * safeQty(item?.quantity);
    }, 0);
    const ship = cartItems.length > 0 ? 50 : 0;
    const total = sub + ship;
    const walletApplied = useWallet ? Math.min(walletBalance, total) : 0;
    const cardTotal = total - walletApplied;
    return { sub, ship, total, walletApplied, cardTotal };
  };

  const { sub, ship, total, walletApplied, cardTotal } = calculateTotal();

  const handlePayment = async (e) => {
    e.preventDefault();

    // Only validate card fields when the card is actually needed
    if (cardTotal > 0) {
      const validationErrors = validate(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        showToast('Please fix the highlighted fields.', 'error');
        return;
      }
    } else {
      // Wallet covers everything — still validate shipping address fields
      const addressErrors = {};
      if (formData.fullName.trim().length < 2) addressErrors.fullName = 'Enter your full name';
      if (formData.address.trim().length < 5) addressErrors.address = 'Enter a valid street address';
      if (formData.city.trim().length < 2) addressErrors.city = 'Enter a valid city';
      if (formData.zipCode.replace(/\D/g, '').length !== 5) addressErrors.zipCode = 'ZIP code must be 5 digits';
      if (Object.keys(addressErrors).length > 0) {
        setErrors(addressErrors);
        showToast('Please fill in your shipping address.', 'error');
        return;
      }
    }

    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderRes = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.product._id,
            name: item.product.name,
            brand: item.product.brand,
            price: safePrice(item.product.price),
            quantity: safeQty(item.quantity)
          })),
          totalAmount: total,
          shippingAddress: {
            fullName: formData.fullName,
            address: formData.address,
            city: formData.city,
            zipCode: formData.zipCode
          },
          useWallet: useWallet && walletApplied > 0
        })
      });

      const order = await orderRes.json().catch(() => ({}));

      if (!orderRes.ok || !order?._id) {
        showToast(order?.error || order?.message || 'Order could not be created.', 'error');
        return;
      }

      // Fire-and-forget cart clear — order succeeded, don't block invoice navigation on it.
      fetch(`http://localhost:5000/api/users/${userId}/cart`, {
        method: 'DELETE',
        headers: authHeaders
      }).catch(() => {});

      const paidMsg = walletApplied > 0
        ? `$${walletApplied.toLocaleString()} from wallet + $${cardTotal.toLocaleString()} by card`
        : `$${total.toLocaleString()}`;
      showToast(`Payment of ${paidMsg} was successful!`, 'success');
      navigate(`/invoice/${order._id}`);
    } catch (error) {
      console.error('Payment error:', error);
      showToast('Payment error occurred. Please try again.', 'error');
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="payment-page-container"><h2>Loading Secure Checkout...</h2></div>;

  const fieldProps = (name, placeholder, opts = {}) => ({
    name,
    value: formData[name],
    onChange: (e) => handleField(name, e.target.value),
    placeholder,
    className: errors[name] ? 'input-error' : '',
    ...opts
  });

  return (
    <div className="payment-page-container">
      <div className="payment-layout">

        <div className="payment-left-column">
          <button className="back-link" onClick={() => navigate('/cart')}>
            ← Return to Cart
          </button>

          <form id="payment-form" onSubmit={handlePayment} noValidate>
            <div className="payment-form-section" style={{ marginBottom: '2rem' }}>
              <h2>Shipping Address</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" {...fieldProps('fullName', 'John Doe')} />
                {errors.fullName && <span className="form-error">{errors.fullName}</span>}
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input type="text" {...fieldProps('address', '123 Watch St, Apt. 4B')} />
                {errors.address && <span className="form-error">{errors.address}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" {...fieldProps('city', 'New York')} />
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input type="text" {...fieldProps('zipCode', '10001', { maxLength: 5 })} />
                  {errors.zipCode && <span className="form-error">{errors.zipCode}</span>}
                </div>
              </div>
            </div>

            {cardTotal > 0 && (
            <div className="payment-form-section">
              <h2>Payment Details</h2>
              <div className="form-group">
                <label>Name on Card</label>
                <input type="text" {...fieldProps('cardName', 'JOHN DOE')} />
                {errors.cardName && <span className="form-error">{errors.cardName}</span>}
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Card Number</label>
                  {detectedNetwork && (
                    <span className="card-network-badge">
                      {detectedNetwork.icon
                        ? <img src={detectedNetwork.icon} alt={detectedNetwork.name} className="card-network-icon" />
                        : detectedNetwork.name}
                    </span>
                  )}
                </div>
                <input type="text" {...fieldProps('cardNumber', '0000 0000 0000 0000', { maxLength: 23 })} />
                {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input type="text" {...fieldProps('expiry', 'MM/YY', { maxLength: 5 })} />
                  {errors.expiry && <span className="form-error">{errors.expiry}</span>}
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input type="password" {...fieldProps('cvv', '123', { maxLength: 4 })} />
                  {errors.cvv && <span className="form-error">{errors.cvv}</span>}
                </div>
              </div>
            </div>
            )}
          </form>
        </div>

        <div className="payment-summary-section">
          <h2>Order Summary</h2>
          <div className="cart-items-preview">
            {cartItems.map((item) => (
              <div key={item._id} className="preview-item">
                <div className="preview-item-info">
                  <span className="preview-item-name">{item.product.name}</span>
                  <span className="preview-item-qty">Qty: {safeQty(item.quantity)} • {item.product.brand}</span>
                </div>
                <div className="preview-item-price">
                  ${(safePrice(item.product.price) * safeQty(item.quantity)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {walletBalance > 0 && (
            <div style={{ margin: '1rem 0', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={e => setUseWallet(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                />
                <span style={{ fontWeight: 600, color: '#15803d' }}>
                  Use wallet balance (${walletBalance.toLocaleString()} available)
                </span>
              </label>
              {useWallet && walletApplied > 0 && (
                <p style={{ margin: '6px 0 0 28px', fontSize: '0.9rem', color: '#166534' }}>
                  −${walletApplied.toLocaleString()} from wallet · {cardTotal === 0 ? 'No card needed' : `$${cardTotal.toLocaleString()} remaining by card`}
                </p>
              )}
            </div>
          )}

          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${sub.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping (Insured)</span>
              <span>${ship.toLocaleString()}</span>
            </div>
            {useWallet && walletApplied > 0 && (
              <div className="summary-row" style={{ color: '#16a34a' }}>
                <span>Wallet discount</span>
                <span>−${walletApplied.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-total">
              <span>Total</span>
              <span>${(useWallet ? cardTotal : total).toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            form="payment-form"
            className="pay-btn"
            disabled={isProcessing || cartItems.length === 0}
          >
            {isProcessing ? 'Processing Securely...' : cardTotal === 0 ? 'Pay with Wallet' : `Pay $${cardTotal.toLocaleString()}`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
