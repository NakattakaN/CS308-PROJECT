import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isOnHome = location.pathname === '/home' || location.pathname === '/';
  const [searchInput, setSearchInput] = useState('');
  
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    setSearchInput(isOnHome ? (searchParams.get('q') || '') : '');
  }, [location.pathname]);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName') || '';
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';
  const isProductManager = userRole === 'product_manager';
  const isSalesManager = userRole === 'sales_manager';
  
  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const updateCounts = async () => {
    if (!userId) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const count = guestCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setCartCount(count);
      setWishlistCount(0);
    } else {
      try {
        const cartRes = await fetch(`http://localhost:5000/api/users/${userId}/cart`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          const count = cartData.reduce((sum, item) => sum + (item.quantity || 0), 0);
          setCartCount(count);
        }
      } catch (err) {
        console.error('Navbar cart fetch error:', err);
      }

      try {
        const wishlistRes = await fetch(`http://localhost:5000/api/users/${userId}/wishlist`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (wishlistRes.ok) {
          const wishlistData = await wishlistRes.json();
          setWishlistCount(Array.isArray(wishlistData) ? wishlistData.length : 0);
        }
      } catch (err) {
        console.error('Navbar wishlist fetch error:', err);
      }
    }
  };

  useEffect(() => {
    updateCounts();
    const handleCartUpdated = () => updateCounts();
    const handleWishlistUpdated = () => updateCounts();
    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);
    window.addEventListener('focus', handleCartUpdated);
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
      window.removeEventListener('focus', handleCartUpdated);
    };
  }, [userId, authToken]);

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    try { localStorage.setItem('theme', theme); } catch {}
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    setCartCount(0);
    setWishlistCount(0);
    navigate('/home');
  };

  useEffect(() => {
    const clickOutside = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const addRecentSearch = (query) => {
    if (!query || !query.trim()) return;
    const clean = query.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try { localStorage.setItem('recentSearches', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleSelectRecentSearch = (term) => {
    setSearchInput(term);
    addRecentSearch(term);
    setShowHistory(false);
    if (isOnHome) {
      const next = new URLSearchParams(searchParams);
      next.set('q', term);
      setSearchParams(next, { replace: true });
    } else {
      navigate(`/home?q=${encodeURIComponent(term)}`);
    }
  };

  const handleRemoveRecentSearch = (e, term) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== term);
      try { localStorage.setItem('recentSearches', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (isOnHome) {
      const next = new URLSearchParams(searchParams);
      val ? next.set('q', val) : next.delete('q');
      setSearchParams(next, { replace: true });
    }
  };

  const handleSearchClear = () => {
    setSearchInput('');
    if (isOnHome) {
      const next = new URLSearchParams(searchParams);
      next.delete('q');
      setSearchParams(next, { replace: true });
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const term = searchInput.trim();
      if (term) {
        addRecentSearch(term);
        setShowHistory(false);
        if (!isOnHome) {
          navigate(`/home?q=${encodeURIComponent(term)}`);
        }
      }
    }
  };





  return (
    <nav className={`global-navbar ${isOnHome ? 'sticky-navbar' : ''}`}>
      <div className="nav-brand" onClick={() => navigate('/home')}>
        Saatinden
      </div>

      <div className="nav-search-wrapper" ref={searchWrapperRef}>
        <svg className="nav-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="nav-search-input"
          placeholder="Search by name or description..."
          value={searchInput}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => setShowHistory(true)}
        />
        {searchInput && (
          <button className="nav-search-clear" onClick={handleSearchClear}>×</button>
        )}

        {showHistory && recentSearches.length > 0 && (
          <div className="nav-search-history-dropdown">
            <div className="nav-search-history-header">Recent Searches</div>
            {recentSearches.map((term, index) => (
              <div
                key={`${term}-${index}`}
                className="nav-search-history-item"
                onClick={() => handleSelectRecentSearch(term)}
              >
                <div className="nav-search-history-text">
                  <span className="nav-search-history-clock">🕒</span>
                  <span>{term}</span>
                </div>
                <button
                  type="button"
                  className="nav-search-history-delete"
                  onClick={(e) => handleRemoveRecentSearch(e, term)}
                  aria-label={`Delete search history item ${term}`}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="nav-actions-right">
        <div className="theme-select">
          <select value={theme} onChange={e => setTheme(e.target.value)} aria-label="Theme selector">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="yotsuba">Yotsuba B</option>
          </select>
        </div>
        {isLoggedIn ? (
          <>
            <span className="nav-welcome">Welcome, {userName}</span>
            {isAdmin && (
              <>
                <button className="nav-btn" onClick={() => navigate('/admin')}>Admin Panel</button>
                <button className="nav-btn" onClick={() => navigate('/product-manager')}>Product Panel</button>
                <button className="nav-btn" onClick={() => navigate('/sales-manager')}>Sales Panel</button>
              </>
            )}
            {isProductManager && (
              <button className="nav-btn" onClick={() => navigate('/product-manager')}>Manager Panel</button>
            )}
            {isSalesManager && (
              <button className="nav-btn" onClick={() => navigate('/sales-manager')}>Manager Panel</button>
            )}
            {!isProductManager && !isSalesManager && (
              <>
                <button className="nav-btn" onClick={() => navigate('/profile')}>My Profile</button>
                <button className="nav-btn" onClick={() => navigate('/orders')}>My Orders</button>
                <button className="nav-btn nav-btn-badge-container" onClick={() => navigate('/wishlist')}>
                  My Wishlist {wishlistCount > 0 && <span className="nav-badge">{wishlistCount}</span>}
                </button>
                <button className="nav-btn nav-btn-badge-container" onClick={() => navigate('/cart')}>
                  My Cart {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                </button>
              </>
            )}
            <button className="nav-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button className="nav-btn nav-btn-badge-container" onClick={() => navigate('/cart')}>
              My Cart {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </button>
            <NavLink to="/login" className="nav-btn">Login</NavLink>
            <NavLink to="/register" className="nav-btn-primary">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
