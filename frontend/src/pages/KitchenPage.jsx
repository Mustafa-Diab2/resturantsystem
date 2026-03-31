import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOrders, updateOrderStatus } from '../api/queries';
import useAuthStore from '../store/authStore';
import { supabase } from '../lib/supabase';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KitchenPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const { data: qData, refetch } = useQuery({
    queryKey: ['kitchen', user?.branch_id],
    queryFn: () => fetchOrders({ status: 'preparing', branch_id: user?.branch_id }),
    select: d => d.data.data,
  });

  const orders = qData || [];

  const statusMutation = useMutation({
    mutationFn: (id) => updateOrderStatus(id, 'ready'),
    onSuccess: () => {
      toast.success('Order marked as ready!');
      qc.invalidateQueries(['kitchen']);
      qc.invalidateQueries(['orders']); 
    },
  });

  useEffect(() => {
    if (!user?.branch_id) return;

    // Supabase Realtime Channel
    const kitchenChannel = supabase.channel('custom-kitchen-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `branch_id=eq.${user.branch_id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast('New order received!', { icon: '🔔' });
          }
          refetch();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime Connected to Kitchen updates ✨');
        }
      });

    return () => {
      supabase.removeChannel(kitchenChannel);
    };
  }, [user?.branch_id, refetch]);

  const calculateElaspsed = (createdAt) => {
    const min = Math.floor((new Date() - new Date(createdAt)) / 60000);
    return min;
  };

  return (
    <div style={{ height: 'calc(100vh - 105px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Kitchen Display System</h1>
        <div className="badge badge-danger pulse" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
          <AlertCircle size={16} /> Live (Supabase Realtime)
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {orders.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={64} style={{ color: 'var(--success)', opacity: 0.5 }} />
            <h2>All Caught Up!</h2>
            <p>No active orders in the kitchen.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {orders.map(order => {
              const elapsed = calculateElaspsed(order.created_at);
              const isUrgent = elapsed > 15;

              return (
                <div key={order.id} className="card" style={{ borderColor: isUrgent ? 'var(--danger)' : 'var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Order #{typeof order.id === 'string' ? order.id.slice(0, 4) : order.id}</h3>
                      <div className="badge badge-muted" style={{ marginTop: '0.5rem' }}>{order.type.replace('_',' ')}</div>
                      {order.table_number && <div className="badge badge-info" style={{ marginTop: '0.5rem', marginLeft: '0.5rem' }}>Table {order.table_number}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isUrgent ? 'var(--danger)' : 'var(--warning)', fontWeight: 700 }}>
                      <Clock size={18} /> {elapsed}m
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', fontSize: '1.1rem' }}
                    onClick={() => statusMutation.mutate(order.id)}
                    disabled={statusMutation.isPending}
                  >
                    Mark Ready <CheckCircle2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
