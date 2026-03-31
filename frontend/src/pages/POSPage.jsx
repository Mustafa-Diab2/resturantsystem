import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, fetchCategories, fetchTables, createOrder, addOrderItem } from '../api/queries';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { ShoppingCart, Trash2, Plus, Minus, X, Loader2, CheckCircle2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const statusColor = { available: 'var(--success)', occupied: 'var(--danger)', reserved: 'var(--warning)', cleaning: 'var(--info)' };

export default function POSPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);

  const [catId, setCatId]   = useState(null);
  const [search, setSearch] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);

  const { items, addItem, updateQty, removeItem, clearCart, orderType, setOrderType, tableId, setTableId, notes, setNotes } = useCartStore();

  const subtotal   = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const tax        = subtotal * 0.08;
  const total      = subtotal + tax;

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories, select: d => d.data.data });
  const { data: productsRes } = useQuery({
    queryKey: ['products', catId],
    queryFn: () => fetchProducts({ category_id: catId || undefined, is_available: true }),
    select: d => d.data.data,
  });
  const { data: tablesRes } = useQuery({
    queryKey: ['tables', user?.branch_id],
    queryFn: () => fetchTables({ branch_id: user?.branch_id }),
    select: d => d.data.data,
    enabled: orderType === 'dine_in',
  });

  const products = (productsRes || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      // 1. Create empty order
      const { data: orderRes } = await createOrder({
        type: orderType,
        branch_id: user?.branch_id || 1,
        user_id: user?.id,
        status: 'pending',
        total_price: total,
        table_id: tableId || null,
        notes,
      });
      const orderId = orderRes.id;
      // 2. Add all items
      for (const item of items) {
        await addOrderItem(orderId, {
          product_id: item.productId,
          variant_id: item.variantId || null,
          quantity:   item.qty,
          unit_price: item.unitPrice,
        });
      }
      return orderId;
    },
    onSuccess: () => {
      toast.success('Order placed successfully!');
      clearCart();
      setShowCheckout(false);
      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['tables']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to place order'),
  });

  return (
    <div className="pos-grid" style={{ marginTop: '-2rem', marginLeft: '-2rem', marginRight: '-2rem', height: 'calc(100vh - 65px)' }}>
      {/* ── Left: Products ── */}
      <div className="pos-left">
        {/* Search + Categories */}
        <div style={{ position: 'sticky', top: 0, background: 'var(--dark)', paddingBottom: '1rem', zIndex: 10 }}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="pos-search"
              type="text"
              className="form-control"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${catId === null ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatId(null)}>All</button>
            {(categories || []).map(c => (
              <button key={c.id} className={`btn btn-sm ${catId === c.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatId(c.id)}>{c.name}</button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '1rem' }}>
          {products.map(product => (
            <div
              key={product.id}
              id={`product-${product.id}`}
              className={`product-card ${!product.is_available ? 'no-stock' : ''}`}
              onClick={() => product.is_available && addItem(product)}
            >
              <div className="product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-3)', fontSize: '2.5rem' }}>
                🍔
              </div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div className="product-price">${parseFloat(product.price).toFixed(2)}</div>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={16} color="#fff" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>No products found</div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <div className="pos-right" style={{ background: 'var(--dark-2)' }}>
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={20} color="var(--primary)" /> Current Order
            </h3>
            {items.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{ color: 'var(--danger)' }}>
                <Trash2 size={15} /> Clear
              </button>
            )}
          </div>

          {/* Order type tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            {['dine_in','takeaway','delivery'].map(t => (
              <button
                key={t}
                className={`btn btn-sm ${orderType === t ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setOrderType(t)}
              >
                {t.replace('_',' ')}
              </button>
            ))}
          </div>

          {/* Table picker for dine-in */}
          {orderType === 'dine_in' && (
            <div style={{ marginTop: '0.75rem' }}>
              <select
                id="pos-table-select"
                className="form-control"
                value={tableId || ''}
                onChange={e => setTableId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Select table...</option>
                {(tablesRes || []).filter(t => t.status === 'available').map(t => (
                  <option key={t.id} value={t.id}>Table {t.number} (cap {t.capacity})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="cart-items">
          {items.length === 0 && (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <ShoppingCart size={48} />
              <p>Cart is empty</p>
              <p style={{ fontSize: '0.8rem' }}>Click a product to add</p>
            </div>
          )}
          {items.map(item => (
            <div key={item.key} className="cart-item">
              <div style={{ flex: 1 }}>
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">${(item.unitPrice * item.qty).toFixed(2)}</div>
              </div>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => updateQty(item.key, item.qty - 1)}><Minus size={12} /></button>
                <span className="qty-value">{item.qty}</span>
                <button className="qty-btn" onClick={() => updateQty(item.key, item.qty + 1)}><Plus size={12} /></button>
              </div>
              <button className="qty-btn" onClick={() => removeItem(item.key)} style={{ marginLeft: '0.25rem', color: 'var(--danger)' }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Cart Footer */}
        <div className="cart-footer">
          <div className="cart-total-row"><span className="cart-total-label">Subtotal</span><span className="cart-total-value">${subtotal.toFixed(2)}</span></div>
          <div className="cart-total-row"><span className="cart-total-label">Tax (8%)</span><span className="cart-total-value">${tax.toFixed(2)}</span></div>
          <hr className="divider" />
          <div className="cart-total-row cart-grand-total"><span className="cart-total-label" style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span><span className="cart-total-value">${total.toFixed(2)}</span></div>

          <textarea
            className="form-control"
            placeholder="Order notes..."
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ marginTop: '0.75rem', resize: 'none', fontSize: '0.8rem' }}
          />

          <button
            id="pos-checkout-btn"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.75rem' }}
            disabled={items.length === 0 || placeOrderMutation.isPending}
            onClick={() => placeOrderMutation.mutate()}
          >
            {placeOrderMutation.isPending
              ? <><Loader2 size={18} className="spin" /> Placing Order...</>
              : <><CheckCircle2 size={18} /> Place Order</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
