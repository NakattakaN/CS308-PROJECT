import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
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
  const showToast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [ratingDraft, setRatingDraft] = useState(0);
  const [commentDraft, setCommentDraft] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const reviewPrefilled = React.useRef(false);
  const [quantity, setQuantity] = useState(1);

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [imgError, setImgError] = useState(false);
  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName') || '';

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
      if (response.ok) {
        setProduct(data);
        setImgError(!data.image);
      }
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

  useEffect(() => {
    if (!userId || !authToken || !id) return;
    fetch(`http://localhost:5000/api/users/${userId}/wishlist`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then(r => r.json())
      .then(list => {
        if (Array.isArray(list)) {
          setIsInWishlist(list.some(p => p._id === id || p._id?.toString() === id));
        }
      })
      .catch(() => {});
  }, [userId, authToken, id]);

  const handleToggleWishlist = async () => {
    if (!userId || !authToken) { navigate('/login'); return; }
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/wishlist/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast(err.message || 'Could not remove from wishlist', 'error');
          return;
        }
        setIsInWishlist(false);
        showToast('Removed from wishlist', 'success');
      } else {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ productId: id })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast(err.message || 'Could not add to wishlist', 'error');
          return;
        }
        setIsInWishlist(true);
        showToast('Added to wishlist!', 'success');
      }
    } catch {
      showToast('Something went wrong', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

 
  const handleAddToCart = async () => {
    // Guest user — save to localStorage, login required only at checkout
    if (!userId || !authToken) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existingIdx = guestCart.findIndex(item => item._id === product._id);
      if (existingIdx >= 0) {
        guestCart[existingIdx].quantity = Math.min(
          guestCart[existingIdx].quantity + quantity,
          product.stock || 99
        );
      } else {
        guestCart.push({
          _id: product._id,
          product: { _id: product._id, name: product.name, brand: product.brand, image: product.image, price: product.price, stock: product.stock },
          quantity
        });
      }
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      showToast('Added to cart! Sign in to checkout.', 'success');
      return;
    }

    // Logged-in user — save to server
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ productId: product._id, quantity })
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Could not add to cart.', 'error');
        return;
      }
      showToast('Added to cart!', 'success');
    } catch (error) {
      console.error('Add to cart error:', error);
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  // Pre-fill drafts from existing review (only once on first load)
  useEffect(() => {
    if (reviewPrefilled.current) return;
    const myRev = reviews.find(r => r.user === userId);
    if (myRev) {
      reviewPrefilled.current = true;
      setRatingDraft(myRev.rating || 0);
      setCommentDraft(myRev.body || '');
    }
  }, [reviews, userId]);

  const handleSubmitRating = async () => {
    if (!authToken) { navigate('/login'); return; }
    if (ratingDraft === 0) { showToast('Please select a star rating.', 'error'); return; }
    setRatingSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ rating: ratingDraft })
      });
      const data = await response.json();
      if (!response.ok) { showToast(data.message || 'Could not submit rating', 'error'); return; }
      await fetchReviews();
      showToast('Thanks! Your rating has been posted.', 'success');
    } catch (err) {
      console.error('Submit rating error:', err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!authToken) { navigate('/login'); return; }
    if (!commentDraft.trim()) { showToast('Please write a comment before submitting.', 'error'); return; }
    setCommentSubmitting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ body: commentDraft })
      });
      const data = await response.json();
      if (!response.ok) { showToast(data.message || 'Could not submit comment', 'error'); return; }
      await fetchReviews();
      showToast('Thanks! Your comment is pending admin approval.', 'success');
    } catch (err) {
      console.error('Submit comment error:', err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleMakeOffer = async (e) => {
    e.preventDefault();
    if (!userId || !authToken) { navigate('/login'); return; }
    if (!offerPrice || Number(offerPrice) <= 0) { showToast('Please enter a valid offer price.', 'error'); return; }
    setOfferSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ offerPrice: Number(offerPrice), message: offerMessage, userName })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Your offer has been submitted!', 'success');
        setOfferModalOpen(false);
        setOfferPrice('');
        setOfferMessage('');
      } else {
        showToast(data.message || 'Could not submit offer.', 'error');
      }
    } catch {
      showToast('Server error. Please try again.', 'error');
    } finally {
      setOfferSubmitting(false);
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
          {imgError ? (
            <div className="details-image-placeholder">
              <span style={{ fontSize: '5rem' }}>⌚</span>
              <span style={{ fontSize: '1rem', opacity: 0.6, marginTop: '1.5rem' }}>
                {product.brand} — {product.name}
              </span>
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImgError(true)}
            />
          )}
        </div>

        <div className="details-info-wrapper">
          <span className="details-brand">{product.brand}</span>
          <h1 className="details-name">{product.name}</h1>
          {product.discountRate > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: '8px 0' }}>
              <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '1.1rem' }}>${product.originalPrice?.toLocaleString()}</span>
              <span className="details-price" style={{ margin: 0 }}>${product.price.toLocaleString()}</span>
              <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: '6px', padding: '3px 10px', fontWeight: 700, fontSize: '0.9rem' }}>-{product.discountRate}%</span>
            </div>
          ) : (
            <p className="details-price">${product.price.toLocaleString()}</p>
          )}

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
            <div className="spec-item">
              <span className="spec-label">Stock:</span>
              <span className="spec-value" style={{ color: product.stock === 0 ? '#6b7280' : product.stock <= 10 ? '#dc2626' : 'inherit', fontWeight: product.stock <= 10 ? 700 : 'inherit' }}>
                {product.stock == null ? '—' : product.stock === 0 ? 'Out of stock' : `${product.stock} units`}
              </span>
            </div>
          </div>

          <div className="action-buttons" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden', opacity: (product.status !== 'available' || product.stock === 0) ? 0.4 : 1 }}>
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={product.status !== 'available' || product.stock === 0} style={{ padding: '10px 15px', border: 'none', background: '#1a1a1a', color: '#fff', cursor: (product.status !== 'available' || product.stock === 0) ? 'not-allowed' : 'pointer', fontSize: '18px' }}>-</button>
              <span style={{ padding: '10px 20px', fontWeight: 'bold' }}>{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))} disabled={product.status !== 'available' || product.stock === 0} style={{ padding: '10px 15px', border: 'none', background: '#1a1a1a', color: '#fff', cursor: (product.status !== 'available' || product.stock === 0) ? 'not-allowed' : 'pointer', fontSize: '18px' }}>+</button>
            </div>

            <button
              className="btn-add-cart"
              style={{ flex: 1, opacity: (product.status !== 'available' || product.stock === 0) ? 0.5 : 1, cursor: (product.status !== 'available' || product.stock === 0) ? 'not-allowed' : 'pointer' }}
              onClick={handleAddToCart}
              disabled={product.status !== 'available' || product.stock === 0}
            >
              {product.stock === 0 ? 'Out of Stock' : product.status === 'available' ? 'Add to Cart' : 'Unavailable'}
            </button>

            <button className="btn-make-offer" onClick={() => {
              if (!userId) { navigate('/login'); return; }
              setOfferModalOpen(true);
            }}>
              Make an Offer
            </button>

            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              title={isInWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
              style={{
                padding: '10px 18px',
                border: `2px solid ${isInWishlist ? '#dc2626' : '#cbd5e1'}`,
                borderRadius: '8px',
                background: isInWishlist ? '#fee2e2' : 'transparent',
                color: isInWishlist ? '#dc2626' : '#64748b',
                cursor: wishlistLoading ? 'not-allowed' : 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1,
                transition: 'all 0.2s'
              }}
            >
              {isInWishlist ? '♥' : '♡'}
            </button>
          </div>

        </div>
      </div>

      {offerModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, color: '#0f172a' }}>Make an Offer</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{product.brand} — {product.name}</p>
            <form onSubmit={handleMakeOffer}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', color: '#0f172a' }}>Your Offer Price ($)</label>
                <input
                  type="number" min="1" required value={offerPrice}
                  onChange={e => setOfferPrice(e.target.value)}
                  placeholder={`Listed at $${product.price.toLocaleString()}`}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', color: '#0f172a' }}>Message (optional)</label>
                <textarea
                  value={offerMessage} onChange={e => setOfferMessage(e.target.value)}
                  placeholder="Add a note to the seller..." rows={3}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={offerSubmitting} style={{ flex: 1, padding: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  {offerSubmitting ? 'Submitting...' : 'Submit Offer'}
                </button>
                <button type="button" onClick={() => setOfferModalOpen(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="reviews-section" style={{ marginTop: '2.5rem', padding: '1.5rem', background: '#fff', borderRadius: '12px' }}>
        <h2 style={{ marginTop: 0 }}>Reviews</h2>

        {authToken ? (
          <div style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>

            {/* ── Rate this watch ── */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f0f0f0' }}>
              <h3 style={{ marginTop: 0 }}>{myReview?.rating ? 'Update your rating' : 'Rate this watch'}</h3>
              <p style={{ color: '#666', marginTop: '-4px', fontSize: '0.9rem' }}>Ratings are posted instantly.</p>
              {myReview?.rating && (
                <p style={{ color: '#888', fontSize: '0.85rem', margin: '4px 0 8px' }}>
                  Your current rating: {[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= myReview.rating ? '#f5a623' : '#d4d4d4' }}>★</span>)}
                </p>
              )}
              <div style={{ margin: '10px 0' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRatingDraft(n)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '28px', color: n <= ratingDraft ? '#f5a623' : '#d4d4d4', padding: '0 2px' }}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  >★</button>
                ))}
              </div>
              <button
                onClick={handleSubmitRating}
                disabled={ratingDraft === 0 || ratingSubmitting}
                style={{ marginTop: '8px', padding: '10px 18px', background: ratingDraft === 0 ? '#ccc' : '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: ratingDraft === 0 || ratingSubmitting ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {ratingSubmitting ? 'Submitting…' : myReview?.rating ? 'Update Rating' : 'Submit Rating'}
              </button>
            </div>

            {/* ── Write a comment ── */}
            <div>
              <h3 style={{ marginTop: 0 }}>{myReview?.body ? 'Update your comment' : 'Write a comment'}</h3>
              <p style={{ color: '#666', marginTop: '-4px', fontSize: '0.9rem' }}>Comments need admin approval before they're visible.</p>
              {myReview?.body && (
                <p style={{ color: '#888', fontSize: '0.85rem', margin: '4px 0 8px' }}>
                  Your current comment: "{myReview.body.length > 80 ? myReview.body.slice(0, 80) + '…' : myReview.body}"
                  {myReview.status === 'UNDER_REVIEW' && <span style={{ marginLeft: '8px', color: '#b26b00' }}>· Pending approval</span>}
                </p>
              )}
              <textarea
                value={commentDraft}
                onChange={e => setCommentDraft(e.target.value)}
                placeholder="Share your thoughts about this watch..."
                rows={4}
                maxLength={1000}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentDraft.trim() || commentSubmitting}
                style={{ marginTop: '8px', padding: '10px 18px', background: !commentDraft.trim() ? '#ccc' : '#1a1a1a', color: '#fff', border: 'none', borderRadius: '8px', cursor: !commentDraft.trim() || commentSubmitting ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {commentSubmitting ? 'Submitting…' : myReview?.body ? 'Update Comment' : 'Submit Comment'}
              </button>
            </div>

          </div>
        ) : (
          <p style={{ color: '#64748b' }}>
            <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#0f172a', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Sign in</button> to leave a review. Purchase required.
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
