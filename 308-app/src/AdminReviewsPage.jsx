import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './AdminReviewsPage.css';

const STATUSES = ['UNDER_REVIEW', 'APPROVED', 'REJECTED'];

const AdminReviewsPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const authToken = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');

  const [status, setStatus] = useState('UNDER_REVIEW');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchQueue = useCallback(async (nextStatus) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/reviews?status=${nextStatus}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.status === 401 || response.status === 403) {
        navigate('/login');
        return;
      }
      if (!response.ok) {
        setReviews([]);
        return;
      }
      const data = await response.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load moderation queue:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [authToken, navigate]);

  useEffect(() => {
    if (!authToken || userRole !== 'admin') {
      navigate('/home');
      return;
    }
    fetchQueue(status);
  }, [authToken, userRole, status, navigate, fetchQueue]);

  const moderate = async (id, nextStatus) => {
    if (busyId) return;
    setBusyId(id);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.message || 'Moderation failed', 'error');
        return;
      }
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error('Moderation error:', err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-reviews-page">
      <header className="admin-reviews-header">
        <h1>Review Moderation</h1>
        <div className="admin-reviews-tabs">
          {STATUSES.map(s => (
            <button
              key={s}
              className={s === status ? 'tab active' : 'tab'}
              onClick={() => setStatus(s)}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : reviews.length === 0 ? (
        <p className="admin-reviews-empty">Nothing to show in this queue.</p>
      ) : (
        <ul className="admin-reviews-list">
          {reviews.map(r => (
            <li key={r._id} className="admin-review-card">
              <div className="admin-review-product">
                {r.product?.image && <img src={r.product.image} alt={r.product?.name || ''} />}
                <div>
                  <div className="admin-review-product-name">
                    {r.product?.brand} {r.product?.name}
                  </div>
                  <div className="admin-review-meta">
                    {r.reviewerName} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="admin-review-rating">
                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </div>

              {r.body ? <p className="admin-review-body">{r.body}</p> : <p className="admin-review-body muted">(no written review)</p>}

              {status === 'UNDER_REVIEW' && (
                <div className="admin-review-actions">
                  <button
                    className="btn-approve"
                    disabled={busyId === r._id}
                    onClick={() => moderate(r._id, 'APPROVED')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-reject"
                    disabled={busyId === r._id}
                    onClick={() => moderate(r._id, 'REJECTED')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminReviewsPage;
