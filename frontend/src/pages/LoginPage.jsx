import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '../api/queries';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      // login natively updates the authStore in Supabase Auth now
      toast.success(`Welcome back, ${data.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', padding: '1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-200px', left: '-200px', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.12), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-200px', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,194,168,0.1), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, animation: 'slideUp 0.4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#FF6B35,#e85520)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 30px rgba(255,107,53,0.35)' }}>
            <ChefHat size={36} color="#fff" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Serve<span style={{ color: 'var(--primary)' }}>X</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Restaurant Management System</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>Welcome back</h2>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.75rem', color: 'var(--text-muted)' }}>Sign in to your account</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@servex.io"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '3rem' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><Loader2 size={18} className="spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
