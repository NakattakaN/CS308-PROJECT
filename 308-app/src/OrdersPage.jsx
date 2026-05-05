import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrdersPage.css';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken');
  const authHeaders = { Authorization: `Bearer ${authToken}` };

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}/orders`, {
          headers: authHeaders
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          console.error("Failed to fetch orders");
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId, navigate, authToken]);

  if (loading) {
    return (
      <div className="orders-page-container">
        <div className="orders-page-content">
          <h2>Loading your orders...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-container">
      <div className="orders-page-content">
        <h1>My Orders</h1>
        
        {orders.length === 0 ? (
          <div className="no-orders-message">
            <p>You haven't placed any orders yet.</p>
            <button className="browse-btn" onClick={() => navigate('/home')}>
              Browse Timepieces
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-header-info">
                    <div className="order-meta">
                      <span className="order-meta-label">Order Placed</span>
                      <span className="order-meta-value">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="order-meta">
                      <span className="order-meta-label">Total Amount</span>
                      <span className="order-meta-value">${order.totalAmount?.toLocaleString() || 0}</span>
                    </div>
                    <div className="order-meta">
                      <span className="order-meta-label">Order ID</span>
                      <span className="order-meta-value">#{order._id.toString().slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="order-meta">
                      <span className="order-meta-label">Status</span>
                      <span className={`order-status-badge ${order.status?.toLowerCase() || 'processing'}`}>
                        {order.status || 'Processing'}
                      </span>
                    </div>
                  </div>
                  <div className="order-actions">
                    <button 
                      className="view-invoice-btn"
                      onClick={() => navigate(`/invoice/${order._id}`)}
                    >
                      View Invoice
                    </button>
                  </div>
                </div>

                <div className="order-body">
                  <div className="order-items-list">
                    {order.items && order.items.map((item, index) => (
                      <div key={`${order._id}-item-${index}`} className="order-item">
                        {item.productId?.image ? (
                          <img 
                            src={item.productId.image} 
                            alt={item.name} 
                            className="order-item-image" 
                            style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          <div className="order-item-image-placeholder">
                             {/* Using an icon or placeholder since Order.js model doesn't explicitly save the image URL */}
                             <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                               <circle cx="12" cy="12" r="10"></circle>
                               <polyline points="12 6 12 12 16 14"></polyline>
                             </svg>
                          </div>
                        )}
                        <div className="order-item-details">
                          <h3 className="order-item-name">{item.name}</h3>
                          <p className="order-item-brand">{item.brand}</p>
                          <p className="order-item-qty">Qty: {item.quantity}</p>
                        </div>
                        <div className="order-item-price">
                          ${item.price?.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.shippingAddress && (
                     <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                        <div className="order-meta">
                          <span className="order-meta-label">Shipped To</span>
                          <span style={{ fontSize: '0.9rem', color: '#475569', marginTop: '0.5rem' }}>
                            {order.shippingAddress.fullName}<br />
                            {order.shippingAddress.address}<br />
                            {order.shippingAddress.city}, {order.shippingAddress.zipCode}
                          </span>
                        </div>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
