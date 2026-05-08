import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast'; // Toast kütüphanesini içeri aktardık
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const showToast = useToast(); // Toast bildirim sistemini tanımladık
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');
  const authHeaders = { Authorization: `Bearer ${authToken}` };

  useEffect(() => {
    if (!userId) {
      // Guest mode — load from localStorage
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      setCartItems(guestCart);
      setLoading(false);
      return;
    }

    const fetchCart = async () => {
      try {
        // Merge any guest cart items into server cart first
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length > 0) {
          await Promise.all(guestCart.map(item =>
            fetch(`http://localhost:5000/api/users/${userId}/cart`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authHeaders },
              body: JSON.stringify({ productId: item._id, quantity: item.quantity })
            })
          ));
          localStorage.removeItem('guestCart');
        }

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
  }, [userId]);

  // Miktarı güncelleyen fonksiyon (Optimistic UI - Anında Tepki)
  const handleUpdateQuantity = async (itemId, currentQuantity, change, maxQuantity) => {
    const newQuantity = currentQuantity + change;

    // 1. STOK KONTROLÜ
    if (change > 0 && maxQuantity && newQuantity > maxQuantity) {
      showToast(`Stok sınırına ulaştınız! Bu üründen en fazla ${maxQuantity} adet alabilirsiniz.`, 'error');
      return;
    }

    // 2. SİLME KONTROLÜ
    if (newQuantity < 1) {
      return handleRemove(itemId);
    }

    // Guest mode — update localStorage only
    if (!userId) {
      const updated = cartItems.map(item =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updated);
      localStorage.setItem('guestCart', JSON.stringify(updated));
      return;
    }

   
    const previousCart = [...cartItems];

    setCartItems(prevItems => 
      prevItems.map(item => 
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );

    
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
      
      // Eğer veritabanına kaydederken bir sorun çıkarsa (örn. internet koptu)
      if (!response.ok) {
        setCartItems(previousCart); // Ekranı bozmamak için eski yedeğe geri dön
        showToast(data.message || "Miktar güncellenemedi, lütfen tekrar deneyin.", "error");
      }
      
    } catch (error) {
      console.error("Bağlantı hatası:", error);
      setCartItems(previousCart); // Hata durumunda ekrandaki sayıyı eski haline getir
      showToast("Sunucuya ulaşılamadı.", "error");
    }
  };

  const handleRemove = async (itemId) => {
    // Guest mode — remove from localStorage only
    if (!userId) {
      const updated = cartItems.filter(item => item._id !== itemId);
      setCartItems(updated);
      localStorage.setItem('guestCart', JSON.stringify(updated));
      return;
    }

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
      const numPrice = item.product?.price || 0;
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
                {cartItems.map((item) => {
                  // Ürünün mağazadaki toplam stoğu (Veritabanında stock mu quantity mi diye ikisine de bakıyoruz)
                  const productQuantity = item.product?.stock ?? item.product?.quantity; 
                  const currentCartQuantity = item.quantity || 1; // Sepetteki miktar

                  return (
                    <div key={item._id} className="watch-cart-card">
                      <img 
                        src={item.product?.image} 
                        alt={item.product?.name} 
                        className="watch-img-small" 
                      />
                      <div className="watch-details">
                        <h3>{item.product?.name}</h3>
                        <p>{item.product?.brand}</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                            <button 
                              onClick={() => handleUpdateQuantity(item._id, currentCartQuantity, -1, productQuantity)}
                              style={{ padding: '4px 10px', background: '#1a1a1a', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <span style={{ padding: '4px 12px', background: '#fff', color: '#1a1a1a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                              {currentCartQuantity}
                            </span>
                            {/* ARTIRMA BUTONU: disabled özelliği kaldırıldı, toast mesajını tetikleyebilmesi için tıklanabilir bırakıldı */}
                            <button 
                              onClick={() => handleUpdateQuantity(item._id, currentCartQuantity, 1, productQuantity)}
                              style={{ 
                                padding: '4px 10px', 
                                background: '#1a1a1a', 
                                color: '#fff', 
                                border: 'none', 
                                cursor: (productQuantity && currentCartQuantity >= productQuantity) ? 'not-allowed' : 'pointer', 
                                fontWeight: 'bold',
                                opacity: (productQuantity && currentCartQuantity >= productQuantity) ? 0.4 : 1
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="watch-price">
                        ${((item.product?.price || 0) * currentCartQuantity).toLocaleString()}
                      </div>
                      <button className="delete-item-btn" onClick={() => handleRemove(item._id)}>Remove</button>
                    </div>
                  );
                })}
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
                <button className="checkout-action-btn" onClick={() => userId ? navigate('/payment') : navigate('/login')}>
                  {userId ? 'Proceed to Checkout' : 'Sign in to Checkout'}
                </button>
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