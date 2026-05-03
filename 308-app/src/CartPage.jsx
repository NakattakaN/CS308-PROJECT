import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');
  const authHeaders = { Authorization: `Bearer ${authToken}` };

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

  // Miktarı güncelleyen fonksiyon
  const handleUpdateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    
    // EĞER MİKTAR 1'DEN KÜÇÜKSE (yani 0 oluyorsa) SİLME FONKSİYONUNU ÇALIŞTIR
    if (newQuantity < 1) {
      return handleRemove(itemId);
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ quantity: newQuantity })
      });
      
      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart);
      }
    } catch (error) {
      console.error("Miktar güncellenemedi:", error);
    }
  };

  const handleRemove = async (itemId) => {
    // Silme işlemi öncesi kullanıcıya sormak istersen bu satırı açabilirsin:
    // if (!window.confirm("Bu ürünü sepetten çıkarmak istediğinize emin misiniz?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart/${itemId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await response.json();
      if (response.ok) {
        setCartItems(data.cart);
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
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
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                          <button 
                            onClick={() => handleUpdateQuantity(item._id, (item.quantity || 1), -1)}
                            style={{ padding: '4px 10px', background: '#1a1a1a', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                            // disabled özelliğini kaldırdık, böylece 1'deyken basılabilir ve silme tetiklenir
                          >
                            -
                          </button>
                          <span style={{ padding: '4px 12px', background: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                            {item.quantity || 1}
                          </span>
                          <button 
                            onClick={() => handleUpdateQuantity(item._id, (item.quantity || 1), 1)}
                            style={{ padding: '4px 10px', background: '#1a1a1a', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="watch-price">
                      ${((item.product.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </div>
                    <button className="delete-item-btn" onClick={() => handleRemove(item._id)}>Remove</button>
                  </div>
                ))}
              </div>

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