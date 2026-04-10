import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductPage.css';

const ProductPage = () => { 
  const navigate = useNavigate(); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStatus = localStorage.getItem('isLoggedIn');
    const storedName = localStorage.getItem('userName'); 
    
    if (userStatus === 'true') {
      setIsLoggedIn(true);
      if (storedName) setUserName(storedName); 
    }

    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        setProducts(data); 
        setLoading(false); 
      } catch (error) {
        console.error("Saatler çekilirken hata oluştu uwu:", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName'); 
    setIsLoggedIn(false);
    setUserName('');
  };

  return (
    <div className="product-page-container">
      <nav className="navbar">
        <div className="brand-logo"><h2>Saatinden</h2></div>
        <div className="nav-actions">
          {isLoggedIn ? (
            <>
              <span style={{ marginRight: '1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                Welcome, {userName}
              </span>
              
              {/* --- UPDATED BUTTON --- */}
              <button 
                className="nav-link" 
                onClick={() => navigate('/cart')}
              >
                My Cart
              </button>
              
              <button onClick={handleLogout} className="nav-btn-primary" style={{ backgroundColor: '#dc2626' }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="nav-link">Log In</button>
              <button onClick={() => navigate('/register')} className="nav-btn-primary">Sign Up</button>
            </>
          )}
        </div>
      </nav>

      <header className="hero-section">
        <h1>Discover Exceptional Timepieces</h1>
        <p>Explore our curated collection of luxury and vintage watches.</p>
      </header>

      <main className="product-grid">
        {loading ? (
          <p style={{ textAlign: 'center', width: '100%' }}>Saatler yükleniyor lütfen bekleyin uwu...</p>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image-container">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-info">
                <span className="product-brand">{product.brand}</span>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">${(product.price || 0).toLocaleString()}</p>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default ProductPage;