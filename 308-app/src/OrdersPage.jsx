import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrdersPage.css';

const STATUS_CONFIG = {
  processing: { label: 'Processing', color: '#854d0e', bg: '#fef9c3', step: 1 },
  in_transit: { label: 'In Transit', color: '#1e40af', bg: '#dbeafe', step: 2 },
  delivered:  { label: 'Delivered',  color: '#166534', bg: '#dcfce7', step: 3 },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '0.8rem' }}>
      {cfg.label}
    </span>
  );
};

const StatusTracker = ({ status }) => {
  const steps = ['processing', 'in_transit', 'delivered'];
  const current = STATUS_CONFIG[status]?.step || 1;
  return (
    <div className="order-tracker">
      {steps.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const done = cfg.step <= current;
        return (
          <React.Fragment key={s}>
            <div className={`tracker-step ${done ? 'done' : ''}`}>
              <div className="tracker-dot">{done ? '✓' : ''}</div>
              <span className="tracker-label">{cfg.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`tracker-line ${current > cfg.step ? 'done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !authToken) { navigate('/login'); return; }
    fetch(`http://localhost:5000/api/users/${userId}/orders`, {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, authToken, navigate]);

  if (loading) return <div className="orders-page"><p className="orders-loading">Loading your orders...</p></div>;

  return (
    <div className="orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="orders-empty">
          <p>You haven't placed any orders yet.</p>
          <button className="orders-shop-btn" onClick={() => navigate('/home')}>Start Shopping</button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div>
                  <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                  <span className="order-date">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="order-header-right">
                  <StatusBadge status={order.status} />
                  <span className="order-total">${order.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <StatusTracker status={order.status} />

              <div className="order-items">
                {order.items.map((item, i) => (
                  <div key={i} className="order-item">
                    <span className="order-item-name">{item.brand} {item.name}</span>
                    <span className="order-item-qty">×{item.quantity}</span>
                    <span className="order-item-price">${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {order.shippingAddress?.fullName && (
                <div className="order-shipping">
                  <span className="order-shipping-label">Ship to:</span>
                  {order.shippingAddress.fullName}, {order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.zipCode}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
