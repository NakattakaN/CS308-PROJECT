import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './WishlistPage.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [userId]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/wishlist`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWishlist(Array.isArray(data) ? data : []);
      } else {
        console.error('Wishlist fetch failed:', data);
        showToast(data.message || 'Could not load wishlist', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      showToast('Could not connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setWishlist(prev => prev.filter(p => p._id !== productId));
        showToast('Removed from wishlist', 'success');
      }
    } catch (err) {
      showToast('Could not remove from wishlist. Please try again.', 'error');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Could not add to cart.', 'error');
        return;
      }
      showToast('Added to cart!', 'success');
    } catch {
      showToast('Could not add to cart. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="wishlist-container">
        <div className="wishlist-content">
          <h2>Loading your wishlist...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-content">
        <h1>My Wishlist</h1>

        {wishlist.length === 0 ? (
          <div className="wishlist-empty">
            <div className="wishlist-empty-icon">♡</div>
            <p>Your wishlist is empty.</p>
            <button className="browse-btn" onClick={() => navigate('/home')}>
              Browse Timepieces
            </button>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map(product => (
              <div key={product._id} className="wishlist-card">
                <div
                  className="wishlist-card-image"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="wishlist-image-placeholder">⌚</div>
                  )}
                </div>
                <div className="wishlist-card-info">
                  <span className="wishlist-brand">{product.brand}</span>
                  <h3
                    className="wishlist-name"
                    onClick={() => navigate(`/product/${product._id}`)}
                  >
                    {product.name}
                  </h3>
                  <p className="wishlist-price">${product.price?.toLocaleString()}</p>
                  <div className="wishlist-card-actions">
                    <button
                      className="wishlist-add-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.status !== 'available' || product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button
                      className="wishlist-remove-btn"
                      onClick={() => handleRemove(product._id)}
                      title="Remove from wishlist"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
