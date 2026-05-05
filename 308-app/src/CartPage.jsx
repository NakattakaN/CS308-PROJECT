import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');
  const isGuest = !userId || !authToken;

  useEffect(() => {
    if (isGuest) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      setCartItems(guestCart);
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}/cart`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await response.json();
        setCartItems(data);
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [userId, authToken]);

  // --- Guest handlers ---
  const guestUpdateQuantity = (productId, change) => {
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    const updated = guestCart
      .map(i => i.productId === productId ? { ...i, quantity: i.quantity + change } : i)
      .filter(i => i.quantity > 0);
    localStorage.setItem('guestCart', JSON.stringify(updated));
    setCartItems(updated);
  };

  const guestRemove = (productId) => {
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]').filter(i => i.productId !== productId);
    localStorage.setItem('guestCart', JSON.stringify(guestCart));
    setCartItems(guestCart);
  };

  // --- Auth user handlers ---
  const handleUpdateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return handleRemove(itemId);
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ quantity: newQuantity })
      });
      const data = await response.json();
      if (response.ok) setCartItems(data.cart);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok) setCartItems(data.cart);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const calculateTotal = () => {
    if (isGuest) {
      const sub = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
      const ship = cartItems.length > 0 ? 50 : 0;
      return { sub, ship, total: sub + ship };
    }
    const sub = cartItems.reduce((acc, item) => acc + (item.product.price || 0) * (item.quantity || 1), 0);
    const ship = cartItems.length > 0 ? 50 : 0;
    return { sub, ship, total: sub + ship };
  };

  const { sub, ship, total } = calculateTotal();

  if (loading) return <div className="cart-page-wrapper"><h2>Loading Collection...</h2></div>;

  return (
    <div className="cart-page-wrapper">
      <main className="cart-main-content">
        <header className="cart-header-section">
          <h1>Your Collection</h1>
          <button className="back-to-shop" onClick={() => navigate('/home')}>← Continue Shopping</button>
        </header>

        <div className="cart-layout-grid">
          {cartItems.length > 0 ? (
            <>
              <div className="items-column">
                {isGuest ? (
                  cartItems.map((item) => (
                    <div key={item.productId} className="watch-cart-card">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="watch-img-small" />
                      ) : (
                        <div className="watch-img-small" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌚</div>
                      )}
                      <div className="watch-details">
                        <h3>{item.name}</h3>
                        <p>{item.brand}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                            <button onClick={() => guestUpdateQuantity(item.productId, -1)} style={{ padding: '4px 10px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                            <span style={{ padding: '4px 12px', background: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>{item.quantity}</span>
                            <button onClick={() => guestUpdateQuantity(item.productId, 1)} style={{ padding: '4px 10px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                          </div>
                        </div>
                      </div>
                      <div className="watch-price">${(item.price * item.quantity).toLocaleString()}</div>
                      <button className="delete-item-btn" onClick={() => guestRemove(item.productId)}>Remove</button>
                    </div>
                  ))
                ) : (
                  cartItems.map((item) => (
                    <div key={item._id} className="watch-cart-card">
                      <img src={item.product.image} alt={item.product.name} className="watch-img-small" />
                      <div className="watch-details">
                        <h3>{item.product.name}</h3>
                        <p>{item.product.brand}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                            <button onClick={() => handleUpdateQuantity(item._id, item.quantity || 1, -1)} style={{ padding: '4px 10px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                            <span style={{ padding: '4px 12px', background: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>{item.quantity || 1}</span>
                            <button onClick={() => handleUpdateQuantity(item._id, item.quantity || 1, 1)} style={{ padding: '4px 10px', background: '#f5f5f5', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                          </div>
                        </div>
                      </div>
                      <div className="watch-price">${((item.product.price || 0) * (item.quantity || 1)).toLocaleString()}</div>
                      <button className="delete-item-btn" onClick={() => handleRemove(item._id)}>Remove</button>
                    </div>
                  ))
                )}
              </div>

              <div className="summary-card-white">
                <h2 className="summary-heading">Order Summary</h2>
                <div className="summary-list">
                  <div className="summary-item"><span>Subtotal</span><span>${sub.toLocaleString()}</span></div>
                  <div className="summary-item"><span>Shipping</span><span>${ship.toLocaleString()}</span></div>
                  <div className="summary-line-break"></div>
                  <div className="summary-item total-final"><span>Total</span><span>${total.toLocaleString()}</span></div>
                </div>
                <button
                  className="checkout-action-btn"
                  onClick={() => isGuest ? navigate('/login?returnTo=/payment') : navigate('/payment')}
                >
                  {isGuest ? 'Login to Checkout' : 'Proceed to Checkout'}
                </button>
                {isGuest && (
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                    Your cart will be saved when you log in.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="empty-cart-message">
              <p>Your collection is currently empty.</p>
              <button className="checkout-action-btn" onClick={() => navigate('/home')}>Browse Timepieces</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CartPage;
