import { useQuery } from '@tanstack/react-query';
import { fetchDailyReport, fetchHourlyReport } from '../api/queries';
import useAuthStore from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, Receipt, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const branch_id = useAuthStore(s => s.user?.branch_id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: daily } = useQuery({ queryKey: ['reports','daily', date], queryFn: () => fetchDailyReport({ branch_id, date }), select: d => d.data.data });
  const { data: hourly } = useQuery({ queryKey: ['reports','hourly', date], queryFn: () => fetchHourlyReport({ branch_id, date }), select: d => d.data.data });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <h1>Analytics & Reports</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--dark-2)', padding: '0.5rem 1rem', borderRadius: 'var(--radius)' }}>
          <Calendar size={18} color="var(--primary)" />
          <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} style={{ background: 'transparent', border: 'none', padding: 0 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.1), var(--card))', borderColor: 'rgba(255,107,53,0.2)' }}>
          <div className="stat-icon" style={{ background: 'rgba(255,107,53,0.2)' }}><DollarSign color="var(--primary)" /></div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>${parseFloat(daily?.total_revenue||0).toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--dark-3)' }}><Receipt color="var(--text-primary)" /></div>
          <div className="stat-value">{daily?.total_orders || 0}</div>
          <div className="stat-label">Completed Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,194,168,0.2)' }}><TrendingUp color="var(--accent)" /></div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>${parseFloat(daily?.avg_order_value||0).toFixed(2)}</div>
          <div className="stat-label">Average Order Value</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem' }}>Hourly Sales Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourly||[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} tick={{ fill: 'var(--text-muted)' }} />
            <YAxis yAxisId="left" orientation="left" stroke="var(--primary)" tick={{ fill: 'var(--text-muted)' }} tickFormatter={v => `$${v}`} />
            <YAxis yAxisId="right" orientation="right" stroke="var(--accent)" tick={{ fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="var(--primary)" radius={[4,4,0,0]} />
            <Bar yAxisId="right" dataKey="orders" name="Orders" fill="var(--accent)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ensure useState is imported
import React, { useState } from 'react';
