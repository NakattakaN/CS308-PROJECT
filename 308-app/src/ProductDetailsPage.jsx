import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailsPage.css'; // Importing CSS styles

const ProductDetailsPage = () => {
  const { id } = useParams(); // Fetching watch ID from URL
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');

  const handleAddToCart = async () => {
    if (!userId) {
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product._id, quantity: 1 })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Watch added to your collection!');
      } else {
        alert('Could not add to cart: ' + data.message);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  useEffect(() => {
    // Fetch single watch by ID from Backend
    const fetchSingleProduct = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setProduct(data);
        } else {
          console.error("Watch not found!");
        }
        setLoading(false);
      } catch (error) {
        console.error("An error occurred:", error);
        setLoading(false);
      }
    };

    fetchSingleProduct();
  }, [id]);

  if (loading) return <div className="loading-state">Preparing watch details...</div>;
  if (!product) return <div className="loading-state">Unfortunately, this watch could not be found :(</div>;

  return (
    <div className="details-container">
      <div className="details-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: '1rem' }}>
        <button className="back-btn" style={{ margin: 0 }} onClick={() => navigate('/home')}>
          ← Back to Marketplace
        </button>
        <button 
          className="go-to-cart-btn" 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#1a1a1a', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: '600' 
          }} 
          onClick={() => navigate('/cart')}
        >
          Go to Cart 🛒
        </button>
      </div>

      <div className="details-card">
        {/* Left Side: Image */}
        <div className="details-image-wrapper">
          <img src={product.image} alt={product.name} />
        </div>

        {/* Right Side: Information */}
        <div className="details-info-wrapper">
          <span className="details-brand">{product.brand}</span>
          <h1 className="details-name">{product.name}</h1>
          <p className="details-price">${product.price.toLocaleString()}</p>
          
          <div className="details-divider"></div>
          
          <div className="details-description">
            <h3>About this timepiece</h3>
            <p>{product.description}</p>
          </div>

          <div className="details-specs">
            <div className="spec-item">
              <span className="spec-label">Condition:</span>
              <span className="spec-value">{product.specs?.condition}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Movement:</span>
              <span className="spec-value">{product.specs?.movement}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Case Size:</span>
              <span className="spec-value">{product.specs?.caseSize}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Year:</span>
              <span className="spec-value">{product.specs?.year}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Box & Papers:</span>
              <span className="spec-value">{product.specs?.boxAndPapers ? 'Yes' : 'No'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Reference:</span>
              <span className="spec-value">{product.referenceNumber}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-add-cart" onClick={handleAddToCart}>Add to Cart</button>
            <button className="btn-make-offer">Make an Offer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;