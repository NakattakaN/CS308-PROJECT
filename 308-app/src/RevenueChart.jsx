import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './RevenueChart.css';

const fmt = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toInputDate = (d) => d.toISOString().split('T')[0];

const RevenueChart = () => {
  const today = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

  const [from, setFrom] = useState(toInputDate(thirtyDaysAgo));
  const [to, setTo]     = useState(toInputDate(today));
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalRefunds: 0, netProfit: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const authToken = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:5000/api/admin/revenue?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch revenue data');
      const json = await res.json();
      setData(json.data || []);
      setSummary({
        totalRevenue: json.totalRevenue || 0,
        totalRefunds: json.totalRefunds || 0,
        netProfit:    json.netProfit    || 0,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const shortDate = (iso) => {
    const [, month, day] = iso.split('-');
    return `${month}/${day}`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rc-tooltip">
        <p className="rc-tooltip-date">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="rc-container">
      <div className="rc-controls">
        <label className="rc-label">
          From
          <input type="date" className="rc-date-input" value={from} max={to} onChange={e => setFrom(e.target.value)} />
        </label>
        <label className="rc-label">
          To
          <input type="date" className="rc-date-input" value={to} min={from} max={toInputDate(today)} onChange={e => setTo(e.target.value)} />
        </label>
        <button className="rc-apply-btn" onClick={fetchData} disabled={loading}>
          {loading ? 'Loading…' : 'Apply'}
        </button>
      </div>

      {error && <p className="rc-error">{error}</p>}

      <div className="rc-stat-cards">
        <div className="rc-stat-card revenue">
          <span className="rc-stat-label">Total Revenue</span>
          <span className="rc-stat-value">{fmt(summary.totalRevenue)}</span>
        </div>
        <div className="rc-stat-card refunds">
          <span className="rc-stat-label">Total Refunds</span>
          <span className="rc-stat-value">{fmt(summary.totalRefunds)}</span>
        </div>
        <div className={`rc-stat-card net ${summary.netProfit >= 0 ? 'positive' : 'negative'}`}>
          <span className="rc-stat-label">Net Profit</span>
          <span className="rc-stat-value">{fmt(summary.netProfit)}</span>
        </div>
      </div>

      {!loading && data.length > 0 && (
        <div className="rc-chart-wrapper">
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={Math.floor(data.length / 10)}
              />
              <YAxis
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '12px' }} />
              <Bar dataKey="revenue" name="Revenue"  fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Bar dataKey="refunds" name="Refunds"  fill="#f87171" radius={[3, 3, 0, 0]} maxBarSize={24} />
              <Line dataKey="net"    name="Net Profit" type="monotone" stroke="#10b981" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && data.length === 0 && !error && (
        <p className="rc-empty">No order data found for the selected date range.</p>
      )}
    </div>
  );
};

export default RevenueChart;
