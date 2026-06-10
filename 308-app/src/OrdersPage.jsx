import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import './OrdersPage.css';

const OrdersPage = () => {
  const navigate = useNavigate();
  const showToast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [confirmReturnId, setConfirmReturnId] = useState(null);

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

  const handleCancelOrder = async (orderId) => {
    setActionBusy(orderId + '-cancel');
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Could not cancel order.', 'error'); return; }
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o));
      showToast('Order cancelled successfully.', 'success');
    } catch {
      showToast('Something went wrong.', 'error');
    } finally {
      setActionBusy(null);
    }
  };

  const isReturnWindowExpired = (order) => {
    const deliveredDate = order.deliveredAt || order.updatedAt;
    if (!deliveredDate) return false;
    const daysElapsed = (Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysElapsed >= 30;
  };

  const handleReturnRequest = async (orderId, itemId) => {
    setActionBusy(`${orderId}-${itemId}-return`);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/items/${itemId}/return`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Could not submit return request.', 'error'); return; }
      
      // Update state locally
      setOrders(prev => prev.map(o => {
        if (o._id === orderId) {
          return {
            ...o,
            items: o.items.map(item => item._id === itemId ? { ...item, returnStatus: 'requested' } : item)
          };
        }
        return o;
      }));
      showToast('Return request submitted! We will review it shortly.', 'success');
    } catch {
      showToast('Something went wrong.', 'error');
    } finally {
      setActionBusy(null);
    }
  };

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
                    {order.status === 'Processing' && (
                      confirmCancelId === order._id ? (
                        <div className="cancel-confirm-inline" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: '600' }}>Are you sure?</span>
                          <button 
                            className="cancel-order-btn" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => { setConfirmCancelId(null); handleCancelOrder(order._id); }}
                            disabled={actionBusy === order._id + '-cancel'}
                          >
                            Yes
                          </button>
                          <button 
                            className="view-invoice-btn"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={() => setConfirmCancelId(null)}
                            disabled={actionBusy === order._id + '-cancel'}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="cancel-order-btn"
                          onClick={() => setConfirmCancelId(order._id)}
                          disabled={actionBusy === order._id + '-cancel'}
                        >
                          {actionBusy === order._id + '-cancel' ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )
                    )}
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
                        <div className="order-item-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <span>${item.price?.toLocaleString()}</span>
                          {order.status === 'Delivered' && (!item.returnStatus || item.returnStatus === 'none') && !isReturnWindowExpired(order) && (
                            confirmReturnId === item._id ? (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '600' }}>Confirm?</span>
                                <button
                                  className="return-order-btn"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: '#ef4444', color: 'white', border: 'none' }}
                                  onClick={() => { setConfirmReturnId(null); handleReturnRequest(order._id, item._id); }}
                                  disabled={actionBusy === `${order._id}-${item._id}-return`}
                                >
                                  Yes
                                </button>
                                <button
                                  className="view-invoice-btn"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  onClick={() => setConfirmReturnId(null)}
                                  disabled={actionBusy === `${order._id}-${item._id}-return`}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                className="return-order-btn"
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                                onClick={() => setConfirmReturnId(item._id)}
                                disabled={actionBusy === `${order._id}-${item._id}-return`}
                              >
                                {actionBusy === `${order._id}-${item._id}-return` ? 'Submitting...' : 'Return Item'}
                              </button>
                            )
                          )}
                          {order.status === 'Delivered' && (!item.returnStatus || item.returnStatus === 'none') && isReturnWindowExpired(order) && (
                            <span className="return-expired-badge" style={{ fontSize: '0.75rem' }}>Return Window Closed</span>
                          )}
                          {item.returnStatus && item.returnStatus !== 'none' && (
                            <span className={`return-status-badge ${item.returnStatus}`} style={{ fontSize: '0.75rem' }}>
                              Return: {item.returnStatus.charAt(0).toUpperCase() + item.returnStatus.slice(1)}
                            </span>
                          )}
                          {item.returnStatus === 'approved' && item.refundAmount > 0 && (
                            <span className="refund-badge" style={{ fontSize: '0.75rem' }}>
                              Refunded: ${item.refundAmount?.toLocaleString()}
                            </span>
                          )}
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
