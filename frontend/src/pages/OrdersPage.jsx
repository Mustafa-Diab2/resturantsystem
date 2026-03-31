import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, updateOrderStatus, fetchOrder } from '../api/queries';
import useAuthStore from '../store/authStore';
import { Clock, ChefHat, CheckCircle2, Truck, X, Eye, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FLOW = {
  pending:   { next: 'preparing', label: 'Start Preparing', color: 'var(--warning)',  icon: ChefHat },
  preparing: { next: 'ready',     label: 'Mark Ready',      color: 'var(--info)',     icon: CheckCircle2 },
  ready:     { next: 'delivered', label: 'Delivered',       color: 'var(--success)',  icon: Truck },
  delivered: { next: null,        label: 'Completed',       color: 'var(--success)',  icon: CheckCircle2 },
  cancelled: { next: null,        label: 'Cancelled',       color: 'var(--danger)',   icon: X },
};

const ORDER_STATUS_COLORS = {
  pending:   'badge-warning',
  preparing: 'badge-info',
  ready:     'badge-accent',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

export default function OrdersPage() {
  const qc   = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: res, isLoading, refetch } = useQuery({
    queryKey: ['orders', statusFilter, user?.branch_id],
    queryFn: () => fetchOrders({ status: statusFilter || undefined, branch_id: user?.branch_id }),
    select: d => d.data,
    refetchInterval: 15_000,
  });

  const { data: detailRes } = useQuery({
    queryKey: ['order', selectedOrder],
    queryFn: () => fetchOrder(selectedOrder),
    enabled: !!selectedOrder,
    select: d => d.data.data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Order status updated');
      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['order', selectedOrder]);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to update'),
  });

  const orders = res?.data || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1>Orders</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {['', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'].map(s => (
            <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(s)}>
              {s || 'All'}
            </button>
          ))}
          <button className="btn btn-ghost btn-icon" onClick={() => refetch()} id="orders-refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <p>No orders found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Type</th>
                <th>Table</th>
                <th>Status</th>
                <th>Total</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const flow = STATUS_FLOW[order.status];
                return (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      #{order.id.slice(0, 8)}
                    </td>
                    <td>
                      <span className="badge badge-muted">{order.type.replace('_', ' ')}</span>
                    </td>
                    <td>{order.table_number ? `Table ${order.table_number}` : '—'}</td>
                    <td><span className={`badge ${ORDER_STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(order.total_price).toFixed(2)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          id={`order-view-${order.id}`}
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setSelectedOrder(order.id); setDetailOpen(true); }}
                        >
                          <Eye size={14} />
                        </button>
                        {flow?.next && (
                          <button
                            id={`order-next-${order.id}`}
                            className="btn btn-sm"
                            style={{ background: `${flow.color}20`, color: flow.color, border: `1px solid ${flow.color}40` }}
                            onClick={() => statusMutation.mutate({ id: order.id, status: flow.next })}
                            disabled={statusMutation.isPending}
                          >
                            <flow.icon size={13} /> {flow.label}
                          </button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}
                            onClick={() => statusMutation.mutate({ id: order.id, status: 'cancelled' })}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination info */}
      {res?.pagination && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Showing {orders.length} of {res.pagination.total} orders
        </div>
      )}

      {/* Order Detail Modal */}
      {detailOpen && detailRes && (
        <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDetailOpen(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem', marginBottom: '1.25rem' }}>
              {[
                { l: 'Order ID',   v: `#${detailRes.id.slice(0, 8)}` },
                { l: 'Status',     v: <span className={`badge ${ORDER_STATUS_COLORS[detailRes.status]}`}>{detailRes.status}</span> },
                { l: 'Type',       v: detailRes.type.replace('_',' ') },
                { l: 'Table',      v: detailRes.table_number ? `Table ${detailRes.table_number}` : '—' },
                { l: 'Branch',     v: detailRes.branch_name },
                { l: 'Cashier',    v: detailRes.cashier_name || '—' },
              ].map(({ l, v }) => (
                <div key={l}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            <table className="data-table" style={{ marginBottom: '1rem' }}>
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detailRes.items?.map(item => (
                  <tr key={item.id}>
                    <td>{item.product_name}{item.variant_name ? ` (${item.variant_name})` : ''}</td>
                    <td>{item.quantity}</td>
                    <td>${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td style={{ fontWeight: 700 }}>${(item.quantity * item.unit_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
              Total: ${parseFloat(detailRes.total_price).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
