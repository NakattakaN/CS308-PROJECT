import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './InvoicePage.css';

const InvoicePage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const authToken = localStorage.getItem('authToken');

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authToken) { navigate('/login'); return; }

    const fetchPdf = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/orders/${orderId}/invoice`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!res.ok) throw new Error('Could not load invoice');
        const blob = await res.blob();
        setPdfUrl(URL.createObjectURL(blob));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [orderId, authToken, navigate]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `saatinden-invoice-${orderId.slice(-8).toUpperCase()}.pdf`;
    a.click();
  };

  if (loading) return <div className="invoice-page"><h2>Loading your invoice...</h2></div>;
  if (error) return <div className="invoice-page"><h2>Error: {error}</h2></div>;

  return (
    <div className="invoice-page">
      <div className="invoice-header">
        <div>
          <h1>Order Confirmed</h1>
          <p className="invoice-subtitle">Your invoice has been emailed to you. You can also view and download it below.</p>
        </div>
        <div className="invoice-actions">
          <button className="invoice-btn" onClick={handleDownload}>Download PDF</button>
          <button className="invoice-btn-secondary" onClick={() => navigate('/home')}>Back to Marketplace</button>
        </div>
      </div>

      <div className="invoice-embed">
        <iframe src={pdfUrl} title="Invoice" />
      </div>
    </div>
  );
};

export default InvoicePage;
