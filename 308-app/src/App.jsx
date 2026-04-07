import React, { useState } from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ProductPage from './ProductPage';
import ProductDetailsPage from './ProductDetailsPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  // New state to hold the product the user clicked on
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Updated navigateTo to accept data
  const navigateTo = (page, data = null) => {
    setCurrentPage(page);
    if (data) {
      setSelectedProduct(data);
    }
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
      {currentPage === 'product_details' && (
        <ProductDetailsPage product={selectedProduct} navigateTo={navigateTo} />
      )}
    </>
  );
}

export default App;