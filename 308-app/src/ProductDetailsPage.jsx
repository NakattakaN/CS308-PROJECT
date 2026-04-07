import React from 'react';
import './ProductDetailsPage.css';

const ProductDetailsPage = ({ product, navigateTo }) => {
  // Fallback if accessed directly without a product
  if (!product) {
    return (
      <div className="error-container">
        <h2>Product not found</h2>
        <button onClick={() => navigateTo('home')} className="btn-primary">Return Home</button>
      </div>
    );
  }

  // Mock reviews data
  const reviews = [
    { id: 1, user: "Ahmet Y.", rating: 5, text: "Yarrak gibi." },
    { id: 2, user: "Can K.", rating: 4, text: "Dürümümü geri ver." },
    { id: 3, user: "Mehmet D.", rating: 5, text: "A grail piece for my collection. Very satisfied with the purchase process." }
  ];

  return (
    <div className="product-details-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="brand-logo" onClick={() => navigateTo('home')} style={{cursor: 'pointer'}}>
          <h2>Saatinden</h2>
        </div>
        <button onClick={() => navigateTo('home')} className="back-link">
          &larr; Back to Marketplace
        </button>
      </nav>

      <main className="details-main">
        {/* Top Section: Image and Buy Box */}
        <section className="product-hero">
          <div className="product-image-large">
            <img src={product.image} alt={product.name} />
          </div>
          
          <div className="product-buy-box">
            <span className="brand-badge">{product.brand}</span>
            <h1 className="product-title">{product.name}</h1>
            <p className="product-price-large">{product.price}</p>
            
            <p className="product-description">{product.brand} omnitrix baba azmut yapmış fena</p>

            <div className="specs-list">
              <div className="spec-item">
                <span className="spec-label">Movement</span>
                <span className="spec-value">Automatic</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Condition</span>
                <span className="spec-value">Excellent / Pre-owned</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Box & Papers</span>
                <span className="spec-value">Included</span>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-add-cart">Add to Sepet</button>
              <button className="btn-buy-now">Buy Now</button>
            </div>
          </div>
        </section>

        {/* Bottom Section: Reviews */}
        <section className="reviews-section">
          <h2>Customer Reviews</h2>
          <div className="reviews-grid">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="reviewer-name">{review.user}</span>
                  <span className="review-rating">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                <p className="review-text">{review.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductDetailsPage;