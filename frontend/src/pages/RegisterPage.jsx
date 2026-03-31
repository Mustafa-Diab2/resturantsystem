import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChefHat, Loader2, Building2, User, Mail, Lock, Rocket, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ restaurantName: '', ownerName: '', email: '', password: '', activationKey: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Security Check: Enforce Paid License Key
      if (form.activationKey !== 'SERVEX-PREMIUM-2026' && form.activationKey !== import.meta.env.VITE_ADMIN_KEY) {
        throw new Error('Invalid Activation Key! Please contact sales to purchase a license.');
      }
      // 1. Sign up purely in Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authErr) throw authErr;

      // 2. Create the Tenant Workspace
      const { data: tenant, error: tenantErr } = await supabase
        .from('tenants')
        .insert([{ name: form.restaurantName }])
        .select()
        .single();
      if (tenantErr) throw tenantErr;

      // 3. Create Default Branch for this Restaurant
      const { data: branch, error: branchErr } = await supabase
        .from('branches')
        .insert([{ name: 'Main Branch', tenant_id: tenant.id }])
        .select()
        .single();
      if (branchErr) throw branchErr;

      // 4. Create the Super Admin Profile
      const { error: profileErr } = await supabase.from('profiles').insert([{
        id: authData.user.id,
        name: form.ownerName,
        email: form.email,
        role_id: 1, // super_admin
        branch_id: branch.id,
        tenant_id: tenant.id
      }]);
      if (profileErr) throw profileErr;

      toast.success('Restaurant Workspace created! Welcome to ServeX SaaS 🚀', { duration: 5000 });
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--dark)', fontFamily: 'var(--font-sans)' }}>
      {/* Visual Left Side */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--dark-2) 0%, var(--dark) 100%)', display: 'none', '@media (minWidth: 1024px)': { display: 'flex' }, flexDirection: 'column', padding: '4rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#FF6B35,#e85520)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChefHat size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>ServeX SaaS</h1>
          </div>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Empower your <br /><span className="gradient-text">Restaurant Empire</span>
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: 450 }}>
            Join hundreds of restaurants relying on our cloud POS, AI analytics, and multi-branch control.
          </p>
        </div>
        
        {/* Abstract shapes */}
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.15 }} />
        <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.1 }} />
      </div>

      {/* Registration Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Workspace</h2>
            <p style={{ color: 'var(--text-muted)' }}>Start your 14-day free trial. No credit card required.</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Restaurant Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input required className="form-control" style={{ paddingLeft: '2.75rem' }} value={form.restaurantName} onChange={e => setForm({...form, restaurantName: e.target.value})} placeholder="e.g. Burger King" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input required className="form-control" style={{ paddingLeft: '2.75rem' }} value={form.ownerName} onChange={e => setForm({...form, ownerName: e.target.value})} placeholder="John Doe" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input required type="email" className="form-control" style={{ paddingLeft: '2.75rem' }} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@restaurant.com" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input required type="password" minLength={6} className="form-control" style={{ paddingLeft: '2.75rem' }} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min. 6 characters" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Activation Key (License)</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input required className="form-control" style={{ paddingLeft: '2.75rem', borderColor: 'var(--primary)' }} value={form.activationKey} onChange={e => setForm({...form, activationKey: e.target.value})} placeholder="Enter your premium access code" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem', fontSize: '1.05rem' }} disabled={loading}>
              {loading ? <Loader2 className="spin" size={20} /> : <><Rocket size={20} /> Launch Workspace</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
