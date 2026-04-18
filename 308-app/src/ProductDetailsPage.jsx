import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailsPage.css';

const Stars = ({ value, size = 18 }) => {
  const rounded = Math.round(value || 0);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= rounded ? '#f5a623' : '#d4d4d4' }}>★</span>
      ))}
    </span>
  );
};

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [draft, setDraft] = useState({ rating: 5, body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}/reviews`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (!response.ok) return;
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  }, [id, authToken]);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`);
      const data = await response.json();
      if (response.ok) setProduct(data);
    } catch (err) {
      console.error('An error occurred:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [fetchProduct, fetchReviews]);

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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!authToken) {
      navigate('/login');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ rating: draft.rating, body: draft.body })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Could not submit review');
        return;
      }
      const wasRatingOnly = !draft.body.trim();
      setDraft({ rating: 5, body: '' });
      await fetchReviews();
      alert(wasRatingOnly
        ? 'Thanks! Your rating has been posted.'
        : 'Thanks! Your review is pending admin approval.');
    } catch (err) {
      console.error('Submit review error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  if (loading) return <div className="loading-state">Preparing watch details...</div>;
  if (!product) return <div className="loading-state">Unfortunately, this watch could not be found :(</div>;

  const myReview = reviews.find(r => r.user === userId);

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

          {product.reviewCount > 0 && (
            <div className="details-rating-summary" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <Stars value={product.averageRating} />
              <span style={{ color: '#555' }}>
                {product.averageRating.toFixed(1)} · {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}
              </span>
            </div>
          )}

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
            <div className="spec-item"><span className="spec-label">Box & Papers:</span><span className="spec-value">{product.specs?.boxAndPapers ? 'Yes' : 'No'}</span></div>
            <div className="spec-item"><span className="spec-label">Reference:</span><span className="spec-value">{product.referenceNumber}</span></div>
          </div>

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

      <section className="reviews-section" style={{ marginTop: '2.5rem', padding: '1.5rem', background: '#fff', borderRadius: '12px' }}>
        <h2 style={{ marginTop: 0 }}>Reviews</h2>

        {authToken ? (
          <form onSubmit={handleSubmitReview} style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>{myReview ? 'Update your review' : 'Leave a review'}</h3>
            <p style={{ color: '#666', marginTop: '-4px' }}>Ratings are posted instantly. Reviews with a comment need admin approval first.</p>
            <div style={{ margin: '12px 0' }}>
              <label style={{ marginRight: '10px' }}>Rating:</label>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, rating: n }))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: n <= draft.rating ? '#f5a623' : '#d4d4d4',
                    padding: '0 2px'
                  }}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                >★</button>
              ))}
            </div>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft(d => ({ ...d, body: e.target.value }))}
              placeholder="Share your thoughts (optional)"
              rows={4}
              maxLength={1000}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit' }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '10px',
                padding: '10px 18px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: submitting ? 'wait' : 'pointer',
                fontWeight: 600
              }}
            >
              {submitting ? 'Submitting…' : myReview ? 'Resubmit' : 'Submit review'}
            </button>
          </form>
        ) : (
          <p>
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Sign in</a> to leave a review.
          </p>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: '#777' }}>No reviews yet. Be the first!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map(r => {
              const isMine = r.user === userId;
              const pending = r.status === 'UNDER_REVIEW';
              const rejected = r.status === 'REJECTED';
              return (
                <li key={r._id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{r.reviewerName}</strong>
                    <Stars value={r.rating} size={16} />
                  </div>
                  {r.body && <p style={{ margin: '8px 0 0' }}>{r.body}</p>}
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#888' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                    {isMine && pending && <span style={{ marginLeft: '8px', color: '#b26b00' }}>· Pending admin approval</span>}
                    {isMine && rejected && <span style={{ marginLeft: '8px', color: '#b00020' }}>· Rejected</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProductDetailsPage;
