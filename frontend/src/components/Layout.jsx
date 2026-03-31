import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Package,
  BarChart3, Settings, ChefHat, Grid3X3, Users,
  LogOut, ChevronLeft, ChevronRight, Bell, Search, Menu
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { logout as apiLogout } from '../api/queries';
import toast from 'react-hot-toast';

const NAV = [
  { label: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard },
  { label: 'POS',        path: '/pos',         icon: ShoppingCart },
  { label: 'Orders',     path: '/orders',      icon: ClipboardList },
  { label: 'Kitchen',    path: '/kitchen',     icon: ChefHat },
  { label: 'Tables',     path: '/tables',      icon: Grid3X3 },
  { label: 'Products',   path: '/products',    icon: Package },
  { label: 'Inventory',  path: '/inventory',   icon: Package },
  { label: 'Reports',    path: '/reports',     icon: BarChart3 },
  { label: 'Settings',   path: '/settings',    icon: Settings },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();

  // close mobile menu instantly when a link is clicked
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    try { await apiLogout(); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <div className="layout">
      {/* ── Mobile Overlay ── */}
      <div className={`sidebar-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#FF6B35,#e85520)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ChefHat size={20} color="#fff" />
          </div>
          {!collapsed && <span className="logo-text">ServeX</span>}
        </div>

        <nav className="sidebar-nav">
          {!collapsed && <div className="nav-section-label">Menu</div>}
          {NAV.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              className={`nav-item ${location.pathname === path ? 'active' : ''}`}
              onClick={() => navigate(path)}
              data-tooltip={collapsed ? label : undefined}
            >
              <Icon size={19} className="nav-icon" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {!collapsed && (
            <div style={{ padding: '1rem', background: 'var(--dark-3)', borderRadius: 'var(--radius)', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          )}

          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--danger)' }} data-tooltip={collapsed ? 'Logout' : undefined}>
            <LogOut size={19} className="nav-icon" />
            {!collapsed && <span>Logout</span>}
          </button>
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{ position: 'absolute', top: '50%', right: -12, transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: 'var(--dark-4)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* ── Main ── */}
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <header className="topbar glass">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="mobile-toggle" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={22} />
            </button>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              {NAV.find(n => n.path === location.pathname)?.label || 'ServeX'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-ghost btn-icon" id="topbar-notifications">
              <Bell size={18} />
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#FF6B35,#00C2A8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <main className="page-content fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
