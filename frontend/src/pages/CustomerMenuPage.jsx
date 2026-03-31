import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchProducts, fetchCategories, createOrder, addOrderItem } from '../api/queries';
import { ShoppingBag, ChevronLeft, Plus, Minus, ChefHat, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerMenuPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [catId, setCatId] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const { data: categories } = useQuery({ queryKey: ['public-cat'], queryFn: fetchCategories, select: d => d.data.data });
  const { data: productsRes } = useQuery({
    queryKey: ['public-prod', catId],
    queryFn: () => fetchProducts({ category_id: catId || undefined, is_available: true }),
    select: d => d.data.data,
  });

  const products = productsRes || [];

  const addToCart = (prod) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === prod.id);
      if (existing) return prev.map(i => i.id === prod.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...prod, qty: 1 }];
    });
    toast.success('Added to order');
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };

  const total = cart.reduce((s, i) => s + (i.price * i.qty), 0);

  const orderMutation = useMutation({
    mutationFn: async () => {
      const { data: orderRes } = await createOrder({
        type: 'dine_in',
        branch_id: 1, // Defaulting to main branch for demo
        table_id: parseInt(tableId),
        status: 'pending',
        total_price: total + (total * 0.08), // tax
        table_number: tableId,
        notes: 'Self-ordered via QR',
      });
      const orderId = orderRes.id;
      for (const item of cart) {
        await addOrderItem(orderId, {
          product_id: item.id,
          quantity: item.qty,
          unit_price: item.price,
        });
      }
      return orderId;
    },
    onSuccess: () => {
      toast.success('Order sent to kitchen! 👨‍🍳', { duration: 4000 });
      setCart([]);
      setShowCart(false);
    }
  });

  if (showCart) return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      <header className="glass" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><ChevronLeft /></button>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Your Order</h2>
      </header>
      <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
        {cart.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Your order is empty</p> : cart.map(item => (
          <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>${item.price}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--dark-3)', padding: '0.4rem', borderRadius: 'var(--radius)' }}>
              <button onClick={() => updateQty(item.id, -1)} style={{ background: 'none', border: 'none', color: '#fff', padding: '0.2rem' }}><Minus size={16}/></button>
              <span style={{ fontWeight: 700, minWidth: '1.2rem', textAlign: 'center' }}>{item.qty}</span>
              <button onClick={() => updateQty(item.id, 1)} style={{ background: 'none', border: 'none', color: '#fff', padding: '0.2rem' }}><Plus size={16}/></button>
            </div>
          </div>
        ))}
      </div>
      <div className="glass" style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}><span>Tax (8%)</span><span>${(total * 0.08).toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontWeight: 800, fontSize: '1.4rem' }}><span>Total</span><span style={{ color: 'var(--primary)' }}>${(total * 1.08).toFixed(2)}</span></div>
        
        <button className="btn btn-primary btn-lg" style={{ width: '100%', fontSize: '1.1rem' }} disabled={cart.length === 0 || orderMutation.isPending} onClick={() => orderMutation.mutate()}>
          {orderMutation.isPending ? <><Loader2 className="spin" size={20}/> Sending...</> : <><CheckCircle2 size={20}/> Confirm Order</>}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', paddingBottom: '80px' }}>
      <div style={{ padding: '2rem 1.5rem 1rem', background: 'linear-gradient(135deg, var(--dark) 0%, var(--dark-2) 100%)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChefHat color="#fff" /></div>
          <div>
            <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 800 }}>ServeX</h1>
            <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>Table {tableId}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
          <button className={`btn btn-sm ${catId === null ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatId(null)} style={{ flexShrink: 0, borderRadius: '99px' }}>All Menu</button>
          {(categories || []).map(c => (
            <button key={c.id} className={`btn btn-sm ${catId === c.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatId(c.id)} style={{ flexShrink: 0, borderRadius: '99px' }}>{c.name}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {products.map(p => (
          <div key={p.id} className="card" style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
            <div style={{ width: 80, height: 80, borderRadius: 'var(--radius)', background: 'var(--dark-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🍔</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{p.name}</h3>
                <p style={{ fontSize: '0.8rem', margin: '0.2rem 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description || 'Delicious freshly prepared.'}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>${p.price}</span>
                <button className="btn btn-sm btn-ghost" onClick={() => addToCart(p)} style={{ padding: '0.4rem', borderRadius: '50%', background: 'rgba(255,107,53,0.1)', color: 'var(--primary)', border: 'none' }}><Plus size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="glass" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', zIndex: 100, animation: 'slideUp 0.3s ease' }}>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(255,107,53,0.4)' }} onClick={() => setShowCart(true)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingBag size={20} /> <span style={{ background: '#fff', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 800 }}>{cart.reduce((s,i)=>s+i.qty,0)}</span></div>
            <span>View Order • ${(total * 1.08).toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}
