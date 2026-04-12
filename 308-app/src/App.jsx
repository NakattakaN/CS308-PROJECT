import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProductPage from './ProductPage';
import CartPage from './CartPage';
// YENİ SAYFAYI İÇERİ AKTARIYORUZ
import ProductDetailsPage from './ProductDetailsPage';
import PaymentPage from './PaymentPage'; // YENİ ÖDEME SAYFASI

function App() {
  return (
    <Router>
      <div style={{ padding: '1rem', background: '#f8fafc', display: 'flex', gap: '1rem', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
        <NavLink to="/home" style={({ isActive }) => ({ padding: '0.5rem 1rem', textDecoration: 'none', color: '#333', fontWeight: isActive ? 'bold' : 'normal' })}>Home</NavLink>
        <NavLink to="/login" style={({ isActive }) => ({ padding: '0.5rem 1rem', textDecoration: 'none', color: '#333', fontWeight: isActive ? 'bold' : 'normal' })}>Login</NavLink>
        <NavLink to="/register" style={({ isActive }) => ({ padding: '0.5rem 1rem', textDecoration: 'none', color: '#333', fontWeight: isActive ? 'bold' : 'normal' })}>Register</NavLink>
      </div>

      <Routes>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<ProductPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* YENİ ROTA BURASI: Dinamik ID alacak şekilde ayarladık */}
        <Route path="/product/:id" element={<ProductDetailsPage />} />

        {/* ÖDEME SAYFASI ROTASI */}
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
    </Router>
  );
}

export default App;