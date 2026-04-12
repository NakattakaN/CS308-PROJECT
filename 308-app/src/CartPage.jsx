import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Getting the ID from your LoginPage localStorage
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}/cart`);
        const data = await response.json();
        setCartItems(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching cart:", error);
        setLoading(false);
      }
    };

    fetchCart();
  }, [userId, navigate]);

  const handleRemove = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart/${itemId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  // Logic to handle the "$35,000" strings from your DB
  const calculateTotal = () => {
    const sub = cartItems.reduce((acc, item) => {
      const numPrice = item.product.price || 0;
      return acc + (numPrice * (item.quantity || 1));
    }, 0);
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
          <button className="back-to-shop" onClick={() => navigate('/home')}>
            ← Continue Shopping
          </button>
        </header>

        <div className="cart-layout-grid">
          {cartItems.length > 0 ? (
            <>
              {/* Left Column: Your Watches */}
              <div className="items-column">
                {cartItems.map((item) => (
                  <div key={item._id} className="watch-cart-card">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      className="watch-img-small" 
                    />
                    <div className="watch-details">
                      <h3>{item.product.name}</h3>
                      <p>{item.product.brand}</p>
                    </div>
                    <div className="watch-price">${(item.product.price || 0).toLocaleString()}</div>
                    <button className="delete-item-btn" onClick={() => handleRemove(item._id)}>Remove</button>
                  </div>
                ))}
              </div>

              {/* Right Column: Checkout Info */}
              <div className="summary-card-white">
                <h2 className="summary-heading">Order Summary</h2>
                <div className="summary-list">
                  <div className="summary-item">
                    <span>Subtotal</span>
                    <span>${sub.toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <span>Shipping</span>
                    <span>${ship.toLocaleString()}</span>
                  </div>
                  <div className="summary-line-break"></div>
                  <div className="summary-item total-final">
                    <span>Total</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>
                <button className="checkout-action-btn" onClick={() => navigate('/payment')}>Proceed to Checkout</button>
              </div>
            </>
          ) : (
            <div className="empty-cart-message">
              <p>Your collection is currently empty.</p>
              <button className="checkout-action-btn" onClick={() => navigate('/home')}>
                Browse Timepieces
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CartPage;