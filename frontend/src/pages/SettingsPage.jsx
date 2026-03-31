import { useQuery } from '@tanstack/react-query';
import { fetchBranches, fetchUsers, fetchTenants } from '../api/queries';
import useAuthStore from '../store/authStore';
import { Building2, Users, ShieldAlert, Globe } from 'lucide-react';

export default function SettingsPage() {
  const user = useAuthStore(s => s.user);
  
  // God-Mode Verification: Is it Mustafa (Tenant 1 or hardcoded email)?
  const isPlatformAdmin = user?.tenant_id === 1 || user?.email === 'mustafadiab2942000@gmail.com';

  const { data: branchesRes } = useQuery({ queryKey: ['branches'], queryFn: fetchBranches, select: d => d.data.data, enabled: user?.role === 'super_admin' || isPlatformAdmin });
  const { data: usersRes } = useQuery({ queryKey: ['users'], queryFn: fetchUsers, select: d => d.data.data });
  const { data: tenantsRes } = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants, select: d => d.data.data, enabled: !!isPlatformAdmin });

  if (user?.role !== 'super_admin' && user?.role !== 'admin' && !isPlatformAdmin) {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>System Settings</h1>
        {isPlatformAdmin && <div className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>👑 God-Mode Active</div>}
      </div>

      {/* SaaS CONTROL PANEL (ONLY VISIBLE TO PLATFORM OWNER) */}
      {isPlatformAdmin && (
        <div className="card" style={{ borderColor: 'var(--warning)', boxShadow: '0 4px 20px rgba(245,158,11,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Globe size={24} color="var(--warning)" />
            <h3 style={{ margin: 0, color: 'var(--warning)' }}>SaaS Control Panel (Clients)</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            You are the platform owner. Below are all the restaurants that have subscribed to your software using your Activation Key.
          </p>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Workspace ID</th><th>Restaurant Name</th><th>Domain</th><th>Subscription</th><th>Joined Date</th></tr></thead>
              <tbody>
                {(tenantsRes || []).map(t => (
                  <tr key={t.id}>
                    <td>#{t.id}</td>
                    <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{t.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{t.domain || `servex.io/t/${t.id}`}</td>
                    <td>
                      <span className={`badge ${t.subscription_status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {t.subscription_status?.toUpperCase() || 'ACTIVE'}
                      </span>
                    </td>
                    <td>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!tenantsRes && <tr><td colSpan={5} style={{textAlign:'center', color: 'var(--text-muted)'}}>Loading clients data...</td></tr>}
                {tenantsRes?.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', color: 'var(--text-muted)'}}>No clients registered yet. Start selling your activation key!</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESTAURANT INTERNAL SETTINGS */}
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
