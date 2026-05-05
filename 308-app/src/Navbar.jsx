import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isOnHome = location.pathname === '/home' || location.pathname === '/';
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    setSearchInput(isOnHome ? (searchParams.get('q') || '') : '');
  }, [location.pathname]);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName') || '';
  const isAdmin = localStorage.getItem('userRole') === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/home');
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
    if (e.key === 'Enter' && !isOnHome && searchInput) {
      navigate(`/home?q=${encodeURIComponent(searchInput)}`);
    }
  };

  return (
    <nav className="global-navbar">
      <div className="nav-brand" onClick={() => navigate('/home')}>
        Saatinden
      </div>

      <div className="nav-search-wrapper">
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
        />
        {searchInput && (
          <button className="nav-search-clear" onClick={handleSearchClear}>×</button>
        )}
      </div>

      <div className="nav-actions-right">
        {isLoggedIn ? (
          <>
            <span className="nav-welcome">Welcome, {userName}</span>
            {isAdmin && (
              <button className="nav-btn" onClick={() => navigate('/admin')}>Admin Panel</button>
            )}
            <button className="nav-btn" onClick={() => navigate('/orders')}>My Orders</button>
            <button className="nav-btn" onClick={() => navigate('/cart')}>My Cart</button>
            <button className="nav-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-btn">Login</NavLink>
            <NavLink to="/register" className="nav-btn-primary">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
