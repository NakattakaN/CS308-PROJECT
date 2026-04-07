import React from 'react';
import './ProductPage.css';

const ProductPage = ({ navigateTo }) => {
  // Sample data for the marketplace
  const products = [
    { id: 1, name: "Submariner Date", brand: "Rolex", price: "$10,250", image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=600" },
    { id: 2, name: "Speedmaster Professional", brand: "Omega", price: "$6,600", image: "https://images.unsplash.com/photo-1639006570490-79c0c53f1080?auto=format&fit=crop&q=80&w=600" },
    { id: 3, name: "Black Bay 58", brand: "Tudor", price: "$3,950", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600" },
    { id: 4, name: "Navitimer B01", brand: "Breitling", price: "$8,500", image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=600" },
  ];

  return (
    <div className="product-page-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="brand-logo">
          <h2>Saatinden</h2>
        </div>
        <div className="nav-actions">
          <button onClick={() => navigateTo('login')} className="nav-link">Log In</button>
          <button onClick={() => navigateTo('register')} className="nav-btn-primary">Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <h1>Discover Exceptional Timepieces</h1>
        <p>Explore our curated collection of luxury and vintage watches.</p>
      </header>

      {/* Product Grid */}
      <main className="product-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image-container">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <span className="product-brand">{product.brand}</span>
              <h3 className="product-name">{product.name}</h3>
              <p className="product-price">{product.price}</p>
              <button className="add-to-cart-btn">View Details</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default ProductPage;