import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

const TABS = ['Products', 'Users', 'Offers'];

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Products');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      alert('Access denied. Admins only.');
      navigate('/home');
    }
  }, [navigate]);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab]);

  const fetchTab = async (tab) => {
    setLoading(true);
    try {
      const endpoints = { Products: '/admin/products', Users: '/admin/users', Offers: '/admin/offers' };
      const res = await fetch(`http://localhost:5000/api${endpoints[tab]}`);
      const data = await res.json();
      if (tab === 'Products') setProducts(data);
      else if (tab === 'Users') setUsers(data);
      else if (tab === 'Offers') setOffers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      </div>
    </div>
  );
};

export default AdminPage;
