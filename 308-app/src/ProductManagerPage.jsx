import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './AdminPage.css';

const TABS = ['Products', 'Categories', 'Orders', 'Reviews'];
const REVIEW_STATUSES = ['UNDER_REVIEW', 'APPROVED', 'REJECTED'];

const ProductManagerPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const authToken = localStorage.getItem('authToken');

  const [activeTab, setActiveTab] = useState('Products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [reviewStatus, setReviewStatus] = useState('UNDER_REVIEW');
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [busyReviewId, setBusyReviewId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStock, setEditingStock] = useState({});
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState(null);
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '', brand: '', price: '', image: '', description: '',
    model: '', referenceNumber: '', serialNumber: '', warrantyStatus: '', distributorInfo: '', stock: 50, status: 'available',
    gender: 'unisex', strapMaterial: 'metal', strapColor: 'black',
    caseShape: 'oval', displayType: 'analog', category: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'product_manager' && role !== 'admin') {
      showToast('Access denied.', 'error');
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
    } catch { setReviews([]); } finally { setLoading(false); }
  }, [authToken]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch { setCategories([]); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    if (activeTab === 'Reviews') fetchReviews(reviewStatus);
    else if (activeTab === 'Categories') fetchCategories();
    else fetchTab(activeTab);
  }, [activeTab, reviewStatus, fetchReviews, fetchCategories]);

  const fetchTab = async (tab) => {
    setLoading(true);
    try {
      const endpoints = { Products: '/admin/products', Orders: '/admin/orders' };
      const res = await fetch(`http://localhost:5000/api${endpoints[tab]}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (tab === 'Products') setProducts(data);
      else if (tab === 'Orders') setOrders(data);
    } catch {} finally { setLoading(false); }
  };

  const deleteProduct = async (id) => {
    await fetch(`http://localhost:5000/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    setProducts(prev => prev.filter(p => p._id !== id));
    showToast('Product deleted', 'success');
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.brand || !newProduct.price || !newProduct.image) {
      showToast('Name, brand, price and image are required', 'error');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ...newProduct, price: Number(newProduct.price), stock: Number(newProduct.stock), category: newProduct.category || null })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Failed to add product', 'error'); return; }
      setProducts(prev => [data, ...prev]);
      setShowAddForm(false);
      setNewProduct({ name: '', brand: '', price: '', image: '', description: '', model: '', referenceNumber: '', serialNumber: '', warrantyStatus: '', distributorInfo: '', stock: 50, status: 'available', gender: 'unisex', strapMaterial: 'metal', strapColor: 'black', caseShape: 'oval', displayType: 'analog', category: '' });
      showToast('Product added', 'success');
    } catch { showToast('Failed to add product', 'error'); }
  };

  const updateStock = async (id, stock) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ stock: Number(stock) })
      });
      const data = await res.json();
      if (!res.ok) { showToast('Failed to update stock', 'error'); return; }
      setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: data.stock } : p));
      setEditingStock(prev => { const n = { ...prev }; delete n[id]; return n; });
      showToast('Stock updated', 'success');
    } catch { showToast('Failed to update stock', 'error'); }
  };

  const updateOrderStatus = async (id, status) => {
    const res = await fetch(`http://localhost:5000/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ status })
    });
    const updated = await res.json();
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: updated.status } : o));
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) { showToast('Category name is required', 'error'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed to add category', 'error'); return; }
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      showToast('Category added', 'success');
    } catch { showToast('Failed to add category', 'error'); }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) { showToast('Failed to delete category', 'error'); return; }
      setCategories(prev => prev.filter(c => c._id !== id));
      setProducts(prev => prev.map(p => p.category === id ? { ...p, category: null } : p));
      showToast('Category deleted', 'success');
    } catch { showToast('Failed to delete category', 'error'); }
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
      if (!res.ok) { showToast('Moderation failed', 'error'); return; }
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch {} finally { setBusyReviewId(null); }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Product Manager Panel</h1>
        <button className="admin-btn-secondary" onClick={() => navigate('/home')}>← Back to Home</button>
      </div>

      <div className="admin-tabs">
        {TABS.map(tab => (
          <button key={tab} className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      <div className="admin-content">
        {loading && <p className="admin-loading">Loading...</p>}

        {!loading && activeTab === 'Products' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <button className="admin-btn-success" onClick={() => setShowAddForm(v => !v)}>
                {showAddForm ? '✕ Cancel' : '+ Add Product'}
              </button>
            </div>

            {showAddForm && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#0f172a' }}>New Product</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[['Name *', 'name', 'text'], ['Brand *', 'brand', 'text'], ['Model', 'model', 'text'], ['Price *', 'price', 'number'], ['Image URL *', 'image', 'text'], ['Reference No', 'referenceNumber', 'text'], ['Serial No', 'serialNumber', 'text'], ['Warranty', 'warrantyStatus', 'text'], ['Distributor Info', 'distributorInfo', 'text'], ['Stock', 'stock', 'number']].map(([label, key, type]) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>{label}</label>
                      <input type={type} min={type === 'number' ? '0' : undefined} value={newProduct[key]} onChange={e => {
                        let val = e.target.value;
                        if (type === 'number' && val !== '' && Number(val) < 0) val = '0';
                        setNewProduct(p => ({ ...p, [key]: val }));
                      }} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Category</label>
                    <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' }}>
                      <option value="">— None —</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Description</label>
                    <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <button className="admin-btn-success" style={{ marginTop: '1rem' }} onClick={addProduct}>Save Product</button>
              </div>
            )}

            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Brand</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.brand}</td>
                    <td>${p.price?.toLocaleString()}</td>
                    <td>
                      {editingStock[p._id] !== undefined ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input type="number" min="0" value={editingStock[p._id]} onChange={e => {
                            let val = e.target.value;
                            if (val !== '' && Number(val) < 0) val = '0';
                            setEditingStock(prev => ({ ...prev, [p._id]: val }));
                          }} style={{ width: '70px', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-input)', color: 'var(--text-main)' }} />
                          <button className="admin-btn-success" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => updateStock(p._id, editingStock[p._id])}>✓</button>
                          <button className="admin-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setEditingStock(prev => { const n = { ...prev }; delete n[p._id]; return n; })}>✕</button>
                        </div>
                      ) : (
                        <span onClick={() => setEditingStock(prev => ({ ...prev, [p._id]: p.stock }))} style={{ cursor: 'pointer', padding: '4px 8px', background: 'var(--bg-input)', color: 'var(--text-main)', borderRadius: '4px' }}>
                          {p.stock} <small style={{ color: 'var(--text-muted)' }}>✎</small>
                        </span>
                      )}
                    </td>
                    <td><span className={`status-badge ${p.stock === 0 ? 'out_of_stock' : 'available'}`}>{p.stock === 0 ? 'out_of_stock' : 'available'}</span></td>
                    <td>
                      {confirmDeleteProductId === p._id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>Sure?</span>
                          <button className="admin-btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => { setConfirmDeleteProductId(null); deleteProduct(p._id); }}>Yes</button>
                          <button className="admin-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setConfirmDeleteProductId(null)}>No</button>
                        </div>
                      ) : (
                        <button className="admin-btn-danger" onClick={() => setConfirmDeleteProductId(p._id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {!loading && activeTab === 'Categories' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
              <input
                type="text"
                value={newCategoryName}
                placeholder="New category name"
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCategory(); }}
                style={{ flex: 1, maxWidth: 320, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.9rem' }}
              />
              <button className="admin-btn-success" onClick={addCategory}>+ Add Category</button>
            </div>
            {categories.length === 0 ? (
              <p style={{ color: '#64748b' }}>No categories yet.</p>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Actions</th></tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>
                        {confirmDeleteCategoryId === c._id ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>Sure?</span>
                            <button className="admin-btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => { setConfirmDeleteCategoryId(null); deleteCategory(c._id); }}>Yes</button>
                            <button className="admin-btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setConfirmDeleteCategoryId(null)}>No</button>
                          </div>
                        ) : (
                          <button className="admin-btn-danger" onClick={() => setConfirmDeleteCategoryId(c._id)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {!loading && activeTab === 'Orders' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['All', 'Processing', 'In-Transit', 'Delivered', 'Cancelled'].map(f => (
                <button key={f} onClick={() => setDeliveryFilter(f)} style={{ padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: deliveryFilter === f ? '#0f172a' : '#f1f5f9', color: deliveryFilter === f ? '#fff' : '#475569' }}>
                  {f} <span style={{ marginLeft: '6px', background: deliveryFilter === f ? 'rgba(255,255,255,0.2)' : '#e2e8f0', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem' }}>{f === 'All' ? orders.length : orders.filter(o => o.status === f).length}</span>
                </button>
              ))}
            </div>
            <table className="admin-table">
              <thead>
                <tr><th>Delivery ID</th><th>Customer ID</th><th>Product ID × Qty</th><th>Total Price</th><th>Date</th><th>Delivery Address</th><th>Status</th></tr>
              </thead>
              <tbody>
                {orders.filter(o => deliveryFilter === 'All' || o.status === deliveryFilter).map(o => (
                  <tr key={o._id}>
                    <td>#{o._id.toString().slice(-8).toUpperCase()}</td>
                    <td>
                      <div>{o.userId?.firstName} {o.userId?.lastName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{o.userId?._id?.toString().slice(-8).toUpperCase()}</div>
                    </td>
                    <td><div style={{ fontSize: '0.85rem', color: '#475569' }}>{o.items?.map((item, i) => <span key={i} style={{ display: 'block' }}>{item.productId?._id?.toString().slice(-6).toUpperCase() || item.productId?.toString().slice(-6).toUpperCase()} × {item.quantity} ({item.name})</span>)}</div></td>
                    <td>${o.totalAmount?.toLocaleString()}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                      {o.shippingAddress ? <>{o.shippingAddress.fullName}<br />{o.shippingAddress.address}<br />{o.shippingAddress.city}, {o.shippingAddress.zipCode}</> : '—'}
                    </td>
                    <td>
                      {o.status === 'Cancelled' ? (
                        <span className="status-badge cancelled">Cancelled</span>
                      ) : (
                        <select className={`status-select ${o.status?.toLowerCase().replace('-', '') || 'processing'}`} value={o.status || 'Processing'} onChange={e => updateOrderStatus(o._id, e.target.value)}>
                          <option value="Processing">Processing</option>
                          <option value="In-Transit">In-Transit</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {!loading && activeTab === 'Reviews' && (
          <div className="admin-reviews-section">
            <div className="admin-review-status-tabs">
              {REVIEW_STATUSES.map(s => (
                <button key={s} className={`admin-review-status-btn ${s === reviewStatus ? 'active' : ''}`} onClick={() => setReviewStatus(s)}>{s.replace('_', ' ')}</button>
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

export default ProductManagerPage;
