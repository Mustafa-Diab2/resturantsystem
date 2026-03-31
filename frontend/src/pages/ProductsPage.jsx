import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct } from '../api/queries';
import { Package, Plus, Edit2, Trash2, X, Search, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', category_id: '', description: '', image_url: '', is_available: true });

  const { data: categoriesRes } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories, select: d => d.data.data });
  const { data: productsRes, isLoading } = useQuery({ queryKey: ['products'], queryFn: () => fetchProducts(), select: d => d.data.data });

  const categories = categoriesRes || [];
  let products = productsRes || [];

  if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (catFilter) products = products.filter(p => p.category_id === parseInt(catFilter));

  const saveMutation = useMutation({
    mutationFn: (d) => editingId ? updateProduct(editingId, d) : createProduct(d),
    onSuccess: () => {
      toast.success(`Product ${editingId ? 'updated' : 'created'}`);
      setModalOpen(false);
      qc.invalidateQueries(['products']);
    },
    onError: e => toast.error(e.response?.data?.message || 'Error saving product')
  });

  const delMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries(['products']); },
    onError: e => toast.error('Check if product is used in orders')
  });

  const openForm = (prod = null) => {
    if (prod) {
      setEditingId(prod.id);
      setForm({ name: prod.name, price: prod.price, category_id: prod.category_id, description: prod.description || '', image_url: prod.image_url || '', is_available: prod.is_available });
    } else {
      setEditingId(null);
      setForm({ name: '', price: '', category_id: categories[0]?.id || '', description: '', image_url: '', is_available: true });
    }
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, price: parseFloat(form.price), category_id: parseInt(form.category_id) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Products Menu</h1>
        <button className="btn btn-primary" onClick={() => openForm()}><Plus size={16} /> New Product</button>
      </div>

      <div className="card" style={{ display: 'flex', gap: '1rem', background: 'var(--dark-2)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
        </div>
        <select className="form-control" style={{ width: 200 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Availability</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr> : null}
            {products.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--dark-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : <ImageIcon size={20} color="var(--text-muted)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.description.slice(0, 30)}...</div>}
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-muted">{p.category_name}</span></td>
                <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${parseFloat(p.price).toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.is_available ? 'badge-success' : 'badge-danger'}`}>
                    {p.is_available ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openForm(p)}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => { if(confirm('Delete product?')) delMutation.mutate(p.id) }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Product' : 'New Product'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price ($)</label>
                  <input type="number" step="0.01" min="0" className="form-control" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select className="form-control" required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="" disabled>Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Availability</label>
                <select className="form-control" value={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.value === 'true' })}>
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={saveMutation.isPending} style={{ marginTop: '1rem' }}>
                {saveMutation.isPending ? 'Saving...' : 'Save Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
