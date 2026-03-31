import { useQuery } from '@tanstack/react-query';
import { fetchBranches, fetchUsers } from '../api/queries';
import useAuthStore from '../store/authStore';
import { Building2, Users, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore(s => s.user);

  const { data: branchesRes } = useQuery({ queryKey: ['branches'], queryFn: fetchBranches, select: d => d.data.data, enabled: user?.role === 'super_admin' });
  const { data: usersRes } = useQuery({ queryKey: ['users'], queryFn: fetchUsers, select: d => d.data.data });

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <div className="empty-state">
        <ShieldAlert size={64} style={{ color: 'var(--danger)', opacity: 0.5 }} />
        <h2 style={{ color: 'var(--text-primary)' }}>Access Denied</h2>
        <p>You do not have permission to view settings.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h1>System Settings</h1>

      {user?.role === 'super_admin' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Building2 size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Branches</h3>
          </div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Location</th><th>Phone</th><th>Status</th></tr></thead>
            <tbody>
              {(branchesRes || []).map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.name}</td>
                  <td>{b.location || '—'}</td>
                  <td>{b.phone || '—'}</td>
                  <td><span className={`badge ${b.is_active ? 'badge-success' : 'badge-danger'}`}>{b.is_active ? 'Active' : 'Disabled'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Users size={20} color="var(--accent)" />
          <h3 style={{ margin: 0 }}>Staff & Users</h3>
        </div>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Branch ID</th><th>Status</th></tr></thead>
          <tbody>
            {(usersRes?.rows || []).map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                <td><span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{u.role_name.replace('_', ' ')}</span></td>
                <td>{u.branch_name || `ID: ${u.branch_id}`}</td>
                <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Disabled'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
