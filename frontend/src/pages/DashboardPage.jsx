import { useQuery } from '@tanstack/react-query';
import { fetchDailyReport, fetchWeeklyReport, fetchTopProducts, fetchOrders } from '../api/queries';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ShoppingBag, DollarSign, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import useAuthStore from '../store/authStore';

const COLORS = ['#FF6B35','#00C2A8','#3b82f6','#f59e0b','#22c55e','#a855f7'];

const StatCard = ({ icon: Icon, label, value, change, color }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <Icon size={22} color={color} />
      </div>
      {change !== undefined && (
        <div className="stat-change" style={{ color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
          {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.includes('revenue') ? `$${p.value.toFixed(2)}` : p.value}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const branch_id = user?.branch_id;

  const { data: daily }   = useQuery({ queryKey: ['reports','daily'], queryFn: () => fetchDailyReport({ branch_id }), select: d => d.data.data });
  const { data: weekly }  = useQuery({ queryKey: ['reports','weekly'], queryFn: () => fetchWeeklyReport({ branch_id }), select: d => d.data.data });
  const { data: topProds } = useQuery({ queryKey: ['reports','top'], queryFn: () => fetchTopProducts({ branch_id }), select: d => d.data.data });
  const { data: ordersRes } = useQuery({ queryKey: ['orders','active'], queryFn: () => fetchOrders({ status: 'preparing', branch_id }), select: d => d.data });

  const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ fontSize: '0.875rem' }}>{today}</p>
        </div>
        <div className="badge badge-accent" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
          Live Dashboard
          <span className="notif-dot" style={{ marginLeft: 4 }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: '1rem' }}>
        <StatCard icon={DollarSign}   label="Today's Revenue"  value={`$${parseFloat(daily?.total_revenue || 0).toFixed(2)}`} color="var(--primary)" change={12} />
        <StatCard icon={ShoppingBag}  label="Total Orders"     value={daily?.total_orders || 0}  color="var(--accent)"  change={8}  />
        <StatCard icon={TrendingUp}   label="Avg Order Value"  value={`$${parseFloat(daily?.avg_order_value || 0).toFixed(2)}`} color="var(--info)" />
        <StatCard icon={Clock}        label="Active Orders"    value={ordersRes?.pagination?.total || 0} color="var(--warning)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Weekly Revenue Area Chart */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={weekly || []} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products bar */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Top Products</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={(topProds || []).slice(0, 5)} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={90} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_qty" name="Qty" radius={[0, 4, 4, 0]}>
                {(topProds || []).slice(0, 5).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order type breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {[
          { label: 'Dine-In',  value: daily?.dine_in_count  || 0, color: '#FF6B35' },
          { label: 'Takeaway', value: daily?.takeaway_count || 0, color: '#00C2A8' },
          { label: 'Delivery', value: daily?.delivery_count || 0, color: '#3b82f6' },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{item.label} Orders</div>
          </div>
        ))}
      </div>
    </div>
  );
}
