import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIngredients, adjustStock, fetchLowStock } from '../api/queries';
import { Package, AlertTriangle, Plus, Minus, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ id: null, name: '', delta: 0, reason: 'manual_adjustment' });

  const { data: qData, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => fetchIngredients(), select: d => d.data.data });
  const { data: alertsRes } = useQuery({ queryKey: ['inventory', 'low'], queryFn: fetchLowStock, select: d => d.data.data });

  let ingredients = qData?.rows || [];
  if (search) ingredients = ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  const alerts = alertsRes || [];

  const adjustMutation = useMutation({
    mutationFn: (d) => adjustStock(d.id, { delta: parseFloat(d.delta), reason: d.reason }),
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      setModalOpen(false);
      qc.invalidateQueries(['inventory']);
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to adjust stock')
  });

  const handleAdjust = (e) => {
    e.preventDefault();
    if (adjustData.delta === 0) return toast.error('Delta cannot be 0');
    adjustMutation.mutate(adjustData);
  };

  const openAdjust = (ing) => {
    setAdjustData({ id: ing.id, name: ing.name, delta: 0, reason: 'manual_adjustment' });
    setModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Inventory Management</h1>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search ingredients..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem', width: 300 }} />
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ color: 'var(--warning)' }}><AlertTriangle size={36} /></div>
          <div>
            <h3 style={{ color: 'var(--warning)', marginBottom: '0.25rem' }}>Low Stock Alert</h3>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{alerts.length} item(s) are below their minimum threshold. Please restock soon.</p>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead><tr><th>Ingredient</th><th>Unit</th><th>Current Stock</th><th>Min Stock</th><th>Cost/Unit</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading inventory...</td></tr> : null}
            {ingredients.length === 0 && !isLoading && <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No ingredients found.</td></tr>}
            {ingredients.map(ing => {
              const isLow = Number(ing.stock_quantity) <= Number(ing.min_stock);
              return (
                <tr key={ing.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Package size={16} color="var(--text-muted)" /> {ing.name}
                    </div>
                  </td>
                  <td><span className="badge badge-muted">{ing.unit}</span></td>
                  <td style={{ fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text-primary)' }}>{Number(ing.stock_quantity).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{Number(ing.min_stock).toFixed(2)}</td>
                  <td>${Number(ing.cost_per_unit).toFixed(4)}</td>
                  <td>
                    {isLow ? <span className="badge badge-danger">Low Stock</span> : <span className="badge badge-success">OK</span>}
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => openAdjust(ing)}>Adjust Stock</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: '1rem' }}>Adjust Stock: {adjustData.name}</h3>
            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Adjustment Amount (can be negative)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setAdjustData({ ...adjustData, delta: adjustData.delta - 1 })}><Minus size={16} /></button>
                  <input type="number" step="0.01" className="form-control" style={{ textAlign: 'center', fontWeight: 700 }} value={adjustData.delta} onChange={e => setAdjustData({ ...adjustData, delta: parseFloat(e.target.value) || 0 })} />
                  <button type="button" className="btn btn-ghost" onClick={() => setAdjustData({ ...adjustData, delta: adjustData.delta + 1 })}><Plus size={16} /></button>
                </div>
                <div style={{ fontSize: '0.8rem', color: adjustData.delta > 0 ? 'var(--success)' : adjustData.delta < 0 ? 'var(--danger)' : 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
                  {adjustData.delta > 0 ? <><ArrowUpRight size={12} /> Adding stock</> : adjustData.delta < 0 ? <><ArrowDownRight size={12} /> Removing stock</> : 'No change'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <select className="form-control" value={adjustData.reason} onChange={e => setAdjustData({ ...adjustData, reason: e.target.value })}>
                  <option value="restock">Restock Delivery</option>
                  <option value="manual_adjustment">Manual Adjustment</option>
                  <option value="waste">Spoilage / Waste</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={adjustData.delta === 0 || adjustMutation.isPending}>
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
