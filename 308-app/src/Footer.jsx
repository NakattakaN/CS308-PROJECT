import React from 'react';
import { NavLink } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="global-footer">
      <div className="footer-content">
        <span className="footer-brand">Saatinden</span>
        <NavLink to="/about" className="footer-link">About Us</NavLink>
      </div>
    </footer>
  );
};

export default Footer;
