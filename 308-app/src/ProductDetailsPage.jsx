import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailsPage.css'; 

const ProductDetailsPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // YENİ: Kaç adet ekleneceğini tutan State
  const [quantity, setQuantity] = useState(1); 

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');

  const handleAddToCart = async () => {
    if (!userId || !authToken) {
      navigate('/login');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        // GÜNCELLENDİ: Sadece ID değil, tüm ürünü ve adedi gönderiyoruz
        body: JSON.stringify({ productId: product._id, quantity: quantity })
      });
      
      const data = await response.json();
      if (response.ok) {
        alert(`${quantity} adet saat koleksiyonuna eklendi!`);
      } else {
        alert('Could not add to cart: ' + data.message);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  useEffect(() => {
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

  // Sayıyı Artır/Azalt Fonksiyonları
  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

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
          style={{ padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }} 
          onClick={() => navigate('/cart')}
        >
          Go to Cart 🛒
        </button>
      </div>

      <div className="details-card">
        <div className="details-image-wrapper">
          <img src={product.image} alt={product.name} />
        </div>

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
            <div className="spec-item"><span className="spec-label">Condition:</span><span className="spec-value">{product.specs?.condition}</span></div>
            <div className="spec-item"><span className="spec-label">Movement:</span><span className="spec-value">{product.specs?.movement}</span></div>
            <div className="spec-item"><span className="spec-label">Case Size:</span><span className="spec-value">{product.specs?.caseSize}</span></div>
            <div className="spec-item"><span className="spec-label">Year:</span><span className="spec-value">{product.specs?.year}</span></div>
            <div className="spec-item"><span className="spec-label">Reference:</span><span className="spec-value">{product.referenceNumber}</span></div>
          </div>

          {/* YENİ: Adet (Quantity) Seçici ve Butonlar */}
          <div className="action-buttons" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
              <button onClick={decreaseQuantity} style={{ padding: '10px 15px', border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: '18px' }}>-</button>
              <span style={{ padding: '10px 20px', fontWeight: 'bold' }}>{quantity}</span>
              <button onClick={increaseQuantity} style={{ padding: '10px 15px', border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: '18px' }}>+</button>
            </div>

            <button className="btn-add-cart" style={{ flex: 1 }} onClick={handleAddToCart}>
              Add to Cart
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;