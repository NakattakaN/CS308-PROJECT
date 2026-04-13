import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Re-renders the navbar when routing changes

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName') || '';

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    navigate('/home');
  };

  return (
    <nav className="global-navbar">
      <div className="nav-brand" onClick={() => navigate('/home')}>
        Saatinden
      </div>

      <div className="nav-actions-right">
        <NavLink 
          to="/home" 
          className={({ isActive }) => isActive ? "nav-btn active" : "nav-btn"}
          style={{ marginRight: '1rem' }}
        >
          Home
        </NavLink>

        {isLoggedIn ? (
          <>
            <span className="nav-welcome">Welcome, {userName}</span>
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
