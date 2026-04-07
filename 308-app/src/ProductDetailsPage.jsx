import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailsPage.css'; // Birazdan CSS'ini de oluşturacağız

const ProductDetailsPage = () => {
  const { id } = useParams(); // URL'deki saatin ID'sini alıyoruz
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sadece bu ID'ye ait saati Backend'den çek
    const fetchSingleProduct = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setProduct(data);
        } else {
          console.error("Saat bulunamadı!");
        }
        setLoading(false);
      } catch (error) {
        console.error("Hata oluştu:", error);
        setLoading(false);
      }
    };

    fetchSingleProduct();
  }, [id]);

  if (loading) return <div className="loading-state">Saat detayları hazırlanıyor uwu...</div>;
  if (!product) return <div className="loading-state">Maalesef bu saat bulunamadı :(</div>;

  return (
    <div className="details-container">
      {/* Geri Dön Butonu */}
      <button className="back-btn" onClick={() => navigate('/home')}>
        ← Back to Marketplace
      </button>

      <div className="details-card">
        {/* Sol Taraf: Görsel */}
        <div className="details-image-wrapper">
          <img src={product.image} alt={product.name} />
        </div>

        {/* Sağ Taraf: Bilgiler */}
        <div className="details-info-wrapper">
          <span className="details-brand">{product.brand}</span>
          <h1 className="details-name">{product.name}</h1>
          <p className="details-price">{product.price}</p>
          
          <div className="details-divider"></div>
          
          <div className="details-description">
            <h3>About this timepiece</h3>
            <p>
              A magnificent piece from {product.brand}. The {product.name} represents 
              the pinnacle of horological engineering and timeless design. Perfect for collectors 
              and enthusiasts alike.
            </p>
          </div>

          <div className="details-specs">
            <div className="spec-item">
              <span className="spec-label">Condition:</span>
              <span className="spec-value">Excellent (Pre-owned)</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Delivery:</span>
              <span className="spec-value">Insured Worldwide Shipping</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Authenticity:</span>
              <span className="spec-value">100% Guaranteed</span>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-add-cart">Add to Cart</button>
            <button className="btn-make-offer">Make an Offer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;