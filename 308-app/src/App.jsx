import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProductPage from './ProductPage';

function App() {
  return (
    <Router>
      {/* Dev Navigation Bar */}
      <div style={{ 
        padding: '1rem', 
        background: '#f8fafc', 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center', 
        borderBottom: '1px solid #e2e8f0' 
      }}>
        {/* NavLink, bulunduğumuz sayfaya göre otomatik "isActive" durumu verir */}
        <NavLink 
          to="/home"
          style={({ isActive }) => ({ 
            padding: '0.5rem 1rem', 
            textDecoration: 'none', 
            color: '#333',
            fontWeight: isActive ? 'bold' : 'normal' 
          })}
        >
          Home
        </NavLink>
        <NavLink 
          to="/login"
          style={({ isActive }) => ({ 
            padding: '0.5rem 1rem', 
            textDecoration: 'none', 
            color: '#333',
            fontWeight: isActive ? 'bold' : 'normal' 
          })}
        >
          Login
        </NavLink>
        <NavLink 
          to="/register"
          style={({ isActive }) => ({ 
            padding: '0.5rem 1rem', 
            textDecoration: 'none', 
            color: '#333',
            fontWeight: isActive ? 'bold' : 'normal' 
          })}
        >
          Register
        </NavLink>
      </div>

      {/* Page Rendering (Sayfaların URL'e göre gösterilmesi) */}
      <Routes>
        {/* Kullanıcı siteye ilk girdiğinde (/) otomatik olarak /home'a at */}
        <Route path="/" element={<Navigate to="/home" />} />
        
        <Route path="/home" element={<ProductPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;