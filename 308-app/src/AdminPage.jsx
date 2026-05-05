import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './AdminPage.css';

const TABS = ['Products', 'Users', 'Orders', 'Offers', 'Reviews'];
const REVIEW_STATUSES = ['UNDER_REVIEW', 'APPROVED', 'REJECTED'];
const ORDER_STATUSES = ['processing', 'in_transit', 'delivered'];
const ORDER_STATUS_LABELS = { processing: 'Processing', in_transit: 'In Transit', delivered: 'Delivered' };

const AdminPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const authToken = localStorage.getItem('authToken');

  const [activeTab, setActiveTab] = useState('Products');
  const [refreshKey, setRefreshKey] = useState(0);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [offers, setOffers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStatus, setReviewStatus] = useState('UNDER_REVIEW');
  const [loading, setLoading] = useState(false);
  const [busyReviewId, setBusyReviewId] = useState(null);
  const [busyOrderId, setBusyOrderId] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      showToast('Access denied. Admins only.', 'error');
      navigate('/home');
    }
  }, [navigate]);

  const fetchReviews = useCallback(async (status) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/reviews?status=${status}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) { setReviews([]); return; }
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (activeTab === 'Reviews') {
      fetchReviews(reviewStatus);
    } else {
      fetchTab(activeTab);
    }
  }, [activeTab, reviewStatus, refreshKey, fetchReviews]);

  const fetchTab = async (tab) => {
    setLoading(true);
    try {
      const endpoints = { Products: '/admin/products', Users: '/admin/users', Offers: '/admin/offers', Orders: '/admin/orders' };
      const res = await fetch(`http://localhost:5000/api${endpoints[tab]}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) { console.error(`Fetch ${tab} failed: ${res.status}`); return; }
      const data = await res.json();
      if (!Array.isArray(data)) { console.error(`Expected array for ${tab}`, data); return; }
      if (tab === 'Products') setProducts(data);
      else if (tab === 'Users') setUsers(data);
      else if (tab === 'Offers') setOffers(data);
      else if (tab === 'Orders') setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (id, status) => {
    if (busyOrderId) return;
    setBusyOrderId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) { showToast('Failed to update order status', 'error'); return; }
      const updated = await res.json();
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: updated.status } : o));
    } catch (e) {
      console.error(e);
    } finally {
      setBusyOrderId(null);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await fetch(`http://localhost:5000/api/admin/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p._id !== id));
  };

  const updateOfferStatus = async (id, status) => {
    const res = await fetch(`http://localhost:5000/api/admin/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    setOffers(prev => prev.map(o => o._id === id ? updated : o));
  };

  const moderateReview = async (id, nextStatus) => {
    if (busyReviewId) return;
    setBusyReviewId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || 'Moderation failed', 'error');
        return;
      }
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      console.error('Moderation error:', err);
    } finally {
      setBusyReviewId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button className="admin-btn-secondary" onClick={() => navigate('/home')}>← Back to Home</button>
      </div>

      <div className="admin-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); setRefreshKey(k => k + 1); }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {loading && <p className="admin-loading">Loading...</p>}

        {!loading && activeTab === 'Products' && (
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Brand</th><th>Price</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>${p.price.toLocaleString()}</td>
                  <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                  <td>
                    <button className="admin-btn-danger" onClick={() => deleteProduct(p._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && activeTab === 'Users' && (
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && activeTab === 'Orders' && (
          <table className="admin-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{o._id.slice(-8).toUpperCase()}</td>
                  <td>
                    {o.userId ? `${o.userId.firstName || ''} ${o.userId.lastName || ''}`.trim() : '—'}
                    {o.userId?.email && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.userId.email}</div>}
                  </td>
                  <td>{o.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</td>
                  <td>${(o.totalAmount || 0).toLocaleString()}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <select
                      value={o.status || 'processing'}
                      disabled={busyOrderId === o._id}
                      onChange={e => updateOrderStatus(o._id, e.target.value)}
                      className={`order-status-select status-${o.status || 'processing'}`}
                    >
                      {ORDER_STATUSES.map(s => (
                        <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && activeTab === 'Offers' && (
          <table className="admin-table">
            <thead>
              <tr><th>Product</th><th>From</th><th>Offer Price</th><th>Message</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {offers.map(o => (
                <tr key={o._id}>
                  <td>{o.productId?.name || '—'} <span style={{ color: '#64748b' }}>({o.productId?.brand})</span></td>
                  <td>{o.userName}</td>
                  <td>${o.offerPrice.toLocaleString()}</td>
                  <td>{o.message || '—'}</td>
                  <td><span className={`status-badge ${o.status}`}>{o.status}</span></td>
                  <td>
                    {o.status === 'pending' && (
                      <>
                        <button className="admin-btn-success" onClick={() => updateOfferStatus(o._id, 'accepted')}>Accept</button>
                        <button className="admin-btn-danger" style={{ marginLeft: '6px' }} onClick={() => updateOfferStatus(o._id, 'rejected')}>Reject</button>
                      </>
                    )}
                    {o.status !== 'pending' && <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && activeTab === 'Reviews' && (
          <div className="admin-reviews-section">
            <div className="admin-review-status-tabs">
              {REVIEW_STATUSES.map(s => (
                <button
                  key={s}
                  className={`admin-review-status-btn ${s === reviewStatus ? 'active' : ''}`}
                  onClick={() => setReviewStatus(s)}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            {reviews.length === 0 ? (
              <p className="admin-reviews-empty">Nothing to show in this queue.</p>
            ) : (
              <ul className="admin-reviews-list">
                {reviews.map(r => (
                  <li key={r._id} className="admin-review-card">
                    <div className="admin-review-product">
                      {r.product?.image && <img src={r.product.image} alt={r.product?.name || ''} />}
                      <div>
                        <div className="admin-review-product-name">{r.product?.brand} {r.product?.name}</div>
                        <div className="admin-review-meta">{r.reviewerName} · {new Date(r.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="admin-review-rating">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    {r.body ? <p className="admin-review-body">{r.body}</p> : <p className="admin-review-body muted">(no written review)</p>}
                    {reviewStatus === 'UNDER_REVIEW' && (
                      <div className="admin-review-actions">
                        <button className="admin-btn-success" disabled={busyReviewId === r._id} onClick={() => moderateReview(r._id, 'APPROVED')}>Approve</button>
                        <button className="admin-btn-danger" disabled={busyReviewId === r._id} onClick={() => moderateReview(r._id, 'REJECTED')}>Reject</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
