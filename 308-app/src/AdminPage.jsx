import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import RevenueChart from './RevenueChart';
import './AdminPage.css';

const TABS = ['Products', 'Users', 'Offers', 'Reviews', 'Orders', 'Returns', 'Revenue'];
const REVIEW_STATUSES = ['UNDER_REVIEW', 'APPROVED', 'REJECTED'];

const AdminPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const authToken = localStorage.getItem('authToken');

  const [activeTab, setActiveTab] = useState('Products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [reviewStatus, setReviewStatus] = useState('UNDER_REVIEW');
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [busyReviewId, setBusyReviewId] = useState(null);

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
  }, [activeTab, reviewStatus, fetchReviews]);

  const fetchTab = async (tab) => {
    setLoading(true);
    try {
      const endpoints = { Products: '/admin/products', Users: '/admin/users', Offers: '/admin/offers', Orders: '/admin/orders', Returns: '/admin/returns' };
      const res = await fetch(`http://localhost:5000/api${endpoints[tab]}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (tab === 'Products') setProducts(data);
      else if (tab === 'Users') setUsers(data);
      else if (tab === 'Offers') setOffers(data);
      else if (tab === 'Orders') setOrders(data);
      else if (tab === 'Returns') setReturns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await fetch(`http://localhost:5000/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    setProducts(prev => prev.filter(p => p._id !== id));
  };

  const updateOfferStatus = async (id, status) => {
    const res = await fetch(`http://localhost:5000/api/admin/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    setOffers(prev => prev.map(o => o._id === id ? updated : o));
  };

  const handleReturnAction = async (orderId, action) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/return`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ action })
      });
      if (!res.ok) { showToast('Action failed', 'error'); return; }
      const updated = await res.json();
      setReturns(prev => prev.map(o => o._id === orderId ? { ...o, returnStatus: updated.returnStatus, refundAmount: updated.refundAmount } : o));
      showToast(action === 'approve' ? 'Return approved & refund issued' : 'Return rejected', 'success');
    } catch {
      showToast('Something went wrong', 'error');
    }
  };

  const updateAdminOrderStatus = async (id, status) => {
    const res = await fetch(`http://localhost:5000/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: updated.status } : o));
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
            onClick={() => setActiveTab(tab)}
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
                  <td><span className={`status-badge ${p.stock === 0 ? 'out_of_stock' : 'available'}`}>{p.stock === 0 ? 'out_of_stock' : 'available'}</span></td>
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

        {!loading && activeTab === 'Orders' && (
          <>
            {/* Delivery filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['All', 'Processing', 'In-Transit', 'Delivered', 'Cancelled'].map(f => (
                <button
                  key={f}
                  onClick={() => setDeliveryFilter(f)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    background: deliveryFilter === f ? 'var(--primary-color)' : 'var(--bg-input)',
                    color: deliveryFilter === f ? 'var(--text-invert)' : 'var(--text-muted)'
                  }}
                >
                  {f}
                  <span style={{ marginLeft: '6px', background: deliveryFilter === f ? 'rgba(255,255,255,0.2)' : 'var(--border-color)', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem' }}>
                    {f === 'All' ? orders.length : orders.filter(o => o.status === f).length}
                  </span>
                </button>
              ))}
            </div>

            <table className="admin-table">
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Date</th><th>Ship To</th><th>Status</th><th>Invoice</th></tr>
              </thead>
              <tbody>
                {orders
                  .filter(o => deliveryFilter === 'All' || o.status === deliveryFilter)
                  .map(o => (
                  <tr key={o._id}>
                    <td>#{o._id.toString().slice(-8).toUpperCase()}</td>
                    <td>{o.userId?.firstName} {o.userId?.lastName}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {o.items?.map((item, idx) => (
                          <span key={idx}>{item.quantity}× {item.name}</span>
                        ))}
                      </div>
                    </td>
                    <td>${o.totalAmount?.toLocaleString()}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                      {o.shippingAddress ? (
                        <>
                          {o.shippingAddress.fullName}<br />
                          {o.shippingAddress.address}<br />
                          {o.shippingAddress.city}, {o.shippingAddress.zipCode}
                        </>
                      ) : '—'}
                    </td>
                    <td>
                      {o.status === 'Cancelled' ? (
                        <span className="status-badge cancelled">Cancelled</span>
                      ) : (
                        <select
                          className={`status-select ${o.status?.toLowerCase().replace('-', '') || 'processing'}`}
                          value={o.status || 'Processing'}
                          onChange={(e) => updateAdminOrderStatus(o._id, e.target.value)}
                        >
                          <option value="Processing">Processing</option>
                          <option value="In-Transit">In-Transit</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <button className="admin-btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }} onClick={() => navigate(`/invoice/${o._id}`)}>Invoice</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {!loading && activeTab === 'Returns' && (
          <table className="admin-table">
            <thead>
              <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Requested</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {returns.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No return requests found.</td></tr>
              )}
              {returns.map(o => (
                <tr key={o._id}>
                  <td>#{o._id.toString().slice(-8).toUpperCase()}</td>
                  <td>{o.userId?.firstName} {o.userId?.lastName}<br /><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{o.userId?.email}</span></td>
                  <td>${o.totalAmount?.toLocaleString()}</td>
                  <td>{o.returnRequestedAt ? new Date(o.returnRequestedAt).toLocaleDateString() : '—'}</td>
                  <td>
                    <span className={`status-badge ${o.returnStatus}`}>{o.returnStatus}</span>
                    {o.returnStatus === 'approved' && o.refundAmount > 0 && (
                      <span style={{ display: 'block', fontSize: '0.8rem', color: '#15803d', marginTop: '4px' }}>
                        Refunded ${o.refundAmount?.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td>
                    {o.returnStatus === 'requested' ? (
                      <>
                        <button className="admin-btn-success" onClick={() => handleReturnAction(o._id, 'approve')}>Approve</button>
                        <button className="admin-btn-danger" style={{ marginLeft: '6px' }} onClick={() => handleReturnAction(o._id, 'reject')}>Reject</button>
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'Revenue' && <RevenueChart />}

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
