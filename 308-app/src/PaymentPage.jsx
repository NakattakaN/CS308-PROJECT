import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentPage.css';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

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
        if (!response.ok) {
          throw new Error(`Cart fetch failed (${response.status})`);
        }
        const data = await response.json();
        const items = Array.isArray(data) ? data : [];
        setCartItems(items);
        setLoading(false);

        if (items.length === 0) {
          alert('Your cart is empty! Redirecting to marketplace.');
          navigate('/home');
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        setLoading(false);
      }
    };

    fetchCart();
  }, [userId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateTotal = () => {
    const sub = cartItems.reduce((acc, item) => {
      const numPrice = item.product.price || 0;
      return acc + (numPrice * (item.quantity || 1));
    }, 0);
    const ship = cartItems.length > 0 ? 50 : 0;
    return { sub, ship, total: sub + ship };
  };

  const { sub, ship, total } = calculateTotal();

  const handlePayment = async (e) => {
    e.preventDefault();
    // Synchronous guard: React state updates are async, so two back-to-back
    // invocations (e.g. submit + click bubble) would both see isProcessing=false.
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      // Mock processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear the cart on successful payment
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (response.ok) {
        alert(`Payment of $${total.toLocaleString()} was successful! Thank you for your purchase.`);
        navigate('/home');
      } else {
        alert("Something went wrong with the payment API.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment error occurred.");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="payment-page-container"><h2>Loading Secure Checkout...</h2></div>;

  return (
    <div className="payment-page-container">
      <div className="payment-layout">
        
        {/* Left Section: Forms */}
        <div className="payment-left-column">
          <button className="back-link" onClick={() => navigate('/cart')}>
            ← Return to Cart
          </button>

          <form onSubmit={handlePayment}>
            <div className="payment-form-section" style={{ marginBottom: '2rem' }}>
              <h2>Shipping Address</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input required type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="123 Watch St, Apt. 4B" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="New York" />
                </div>
                <div className="form-group">
                  <label>ZIP Code</label>
                  <input required type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} placeholder="10001" />
                </div>
              </div>
            </div>

            <div className="payment-form-section">
              <h2>Payment Details</h2>
              <div className="form-group">
                <label>Name on Card</label>
                <input required type="text" name="cardName" value={formData.cardName} onChange={handleInputChange} placeholder="JOHN DOE" />
              </div>
              <div className="form-group">
                <label>Card Number</label>
                <input required type="text" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="0000 0000 0000 0000" maxLength="19" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input required type="text" name="expiry" value={formData.expiry} onChange={handleInputChange} placeholder="MM/YY" maxLength="5" />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input required type="password" name="cvv" value={formData.cvv} onChange={handleInputChange} placeholder="123" maxLength="4" />
                </div>
              </div>
            </div>
            
            {/* Mobile shows button below forms usually. We will put the button in the summary. */}
          </form>
        </div>

        {/* Right Section: Order Summary */}
        <div className="payment-summary-section">
          <h2>Order Summary</h2>
          <div className="cart-items-preview">
            {cartItems.map((item) => (
              <div key={item._id} className="preview-item">
                <div className="preview-item-info">
                  <span className="preview-item-name">{item.product.name}</span>
                  <span className="preview-item-qty">Qty: {item.quantity || 1} • {item.product.brand}</span>
                </div>
                <div className="preview-item-price">
                  ${(item.product.price * (item.quantity || 1)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-details">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${sub.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping (Insured)</span>
              <span>${ship.toLocaleString()}</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            className="pay-btn"
            disabled={isProcessing || cartItems.length === 0}
          >
            {isProcessing ? 'Processing Securely...' : `Pay $${total.toLocaleString()}`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentPage;
