import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import RevenueChart from './RevenueChart';
import './AdminPage.css';

const TABS = ['Discounts', 'Invoices', 'Revenue'];

const SalesManagerPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const authToken = localStorage.getItem('authToken');

  const [activeTab, setActiveTab] = useState('Discounts');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [discountInputs, setDiscountInputs] = useState({});
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'sales_manager' && role !== 'admin') {
      showToast('Access denied.', 'error');
      navigate('/home');
    }
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'Discounts') fetchProducts();
    else if (activeTab === 'Invoices') fetchOrders();
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/products', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const res = await fetch(`http://localhost:5000/api/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  const applyDiscount = async (productId, rate) => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${productId}/discount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ discountRate: Number(rate) })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed to apply discount', 'error'); return; }
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, price: data.price, originalPrice: data.originalPrice, discountRate: data.discountRate } : p));
      setDiscountInputs(prev => { const n = { ...prev }; delete n[productId]; return n; });
      showToast(`Discount applied! New price: $${data.price?.toLocaleString()}`, 'success');
    } catch { showToast('Failed to apply discount', 'error'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Sales Manager Panel</h1>
        <button className="admin-btn-secondary" onClick={() => navigate('/home')}>← Back to Home</button>
      </div>

      <div className="admin-tabs">
        {TABS.map(tab => (
          <button key={tab} className={`admin-tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </div>

      <div className="admin-content">
        {loading && <p className="admin-loading">Loading...</p>}

        {!loading && activeTab === 'Discounts' && (
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Brand</th><th>Original Price</th><th>Current Price</th><th>Discount %</th><th>Set Discount</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>${(p.originalPrice || p.price)?.toLocaleString()}</td>
                  <td>
                    ${p.price?.toLocaleString()}
                    {p.discountRate > 0 && (
                      <span style={{ marginLeft: '6px', background: '#dcfce7', color: '#15803d', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem' }}>-{p.discountRate}%</span>
                    )}
                  </td>
                  <td>{p.discountRate || 0}%</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0–100"
                        value={discountInputs[p._id] ?? ''}
                        onChange={e => setDiscountInputs(prev => ({ ...prev, [p._id]: e.target.value }))}
                        style={{ width: '70px', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.9rem' }}
                      />
                      <button className="admin-btn-success" style={{ padding: '4px 10px', fontSize: '0.85rem' }} onClick={() => applyDiscount(p._id, discountInputs[p._id] ?? 0)}>Apply</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && activeTab === 'Invoices' && (
          <>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>From</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>To</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              </div>
              <button className="admin-btn-secondary" onClick={fetchOrders}>Filter</button>
            </div>
            <table className="admin-table">
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Date</th><th>Status</th><th>Invoice</th></tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No orders found.</td></tr>
                )}
                {orders.map(o => (
                  <tr key={o._id}>
                    <td>#{o._id.toString().slice(-8).toUpperCase()}</td>
                    <td>{o.userId?.firstName} {o.userId?.lastName}<br /><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{o.userId?.email}</span></td>
                    <td>${o.totalAmount?.toLocaleString()}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td><span className={`status-badge ${o.status?.toLowerCase()}`}>{o.status}</span></td>
                    <td>
                      <button className="admin-btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }} onClick={() => navigate(`/invoice/${o._id}`)}>PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'Revenue' && <RevenueChart />}
      </div>
    </div>
  );
};

export default SalesManagerPage;
