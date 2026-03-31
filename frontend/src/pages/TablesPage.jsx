import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTables, createTable, updateTableStatus } from '../api/queries';
import useAuthStore from '../store/authStore';
import { Grid3X3, Plus, Users, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TablesPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const { data: tablesRes } = useQuery({
    queryKey: ['tables', user?.branch_id],
    queryFn: () => fetchTables({ branch_id: user?.branch_id }),
    select: d => d.data.data
  });
  const tables = tablesRes || [];

  const statusMutation = useMutation({
    mutationFn: (d) => updateTableStatus(d.id, d.status),
    onSuccess: () => qc.invalidateQueries(['tables'])
  });

  const nextStatus = (curr) => {
    const s = ['available','occupied','cleaning']; // simple cycle
    const i = s.indexOf(curr);
    return s[(i+1)%s.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Table Map</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: 'var(--success)' }}></span> Avail
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: 'var(--danger)' }}></span> Occup
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: 'var(--info)' }}></span> Clean
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'var(--dark-2)', minHeight: '60vh' }}>
        {tables.length === 0 ? (
          <div className="empty-state">
            <Grid3X3 size={48} />
            <p>No tables configured for this branch.</p>
          </div>
        ) : (
          <div className="tables-grid">
            {tables.map(t => (
              <div
                key={t.id}
                className={`table-card ${t.status}`}
                onClick={() => statusMutation.mutate({ id: t.id, status: nextStatus(t.status) })}
              >
                <div className="table-number">{t.number}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Users size={14} /> {t.capacity}
                </div>
                <div className="table-status">{t.status.toUpperCase()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
