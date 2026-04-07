import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProductPage from './ProductPage';

function App() {
  // Simple state-based routing for demonstration
  const [currentPage, setCurrentPage] = useState('home');

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      {/* Dev Navigation Bar */}
      <div style={{ 
        padding: '1rem', 
        background: '#f8fafc', 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center', 
        borderBottom: '1px solid #e2e8f0' 
      }}>
        <button 
          onClick={() => navigateTo('home')}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: currentPage === 'home' ? 'bold' : 'normal' }}
        >
          Home
        </button>
        <button 
          onClick={() => navigateTo('login')}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: currentPage === 'login' ? 'bold' : 'normal' }}
        >
          Login
        </button>
        <button 
          onClick={() => navigateTo('register')}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: currentPage === 'register' ? 'bold' : 'normal' }}
        >
          Register
        </button>
      </div>

      {/* Page Rendering */}
      {currentPage === 'home' && <ProductPage navigateTo={navigateTo} />}
      {currentPage === 'login' && <LoginPage navigateTo={navigateTo} />}
      {currentPage === 'register' && <RegisterPage navigateTo={navigateTo} />}
    </>
  );
}

export default App;