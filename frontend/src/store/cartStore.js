/**
 * Cart / POS Zustand Store
 */
import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items:      [],
  orderType:  'dine_in',
  tableId:    null,
  notes:      '',

  setOrderType: (orderType) => set({ orderType }),
  setTableId:   (tableId)   => set({ tableId }),
  setNotes:     (notes)     => set({ notes }),

  addItem: (product, variant = null) => {
    const items = get().items;
    const key = `${product.id}-${variant?.id || 'base'}`;
    const existing = items.find(i => i.key === key);

    if (existing) {
      set({ items: items.map(i => i.key === key ? { ...i, qty: i.qty + 1 } : i) });
    } else {
      set({
        items: [...items, {
          key,
          productId:   product.id,
          variantId:   variant?.id || null,
          name:        variant ? `${product.name} – ${variant.name}` : product.name,
          unitPrice:   variant ? variant.price : product.price,
          qty:         1,
        }],
      });
    }
  },

  updateQty: (key, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter(i => i.key !== key) });
    } else {
      set({ items: get().items.map(i => i.key === key ? { ...i, qty } : i) });
    }
  },

  removeItem: (key) => set({ items: get().items.filter(i => i.key !== key) }),

  clearCart: () => set({ items: [], tableId: null, notes: '' }),

  get subtotal() {
    return get().items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  },

  get totalItems() {
    return get().items.reduce((sum, i) => sum + i.qty, 0);
  },
}));

export default useCartStore;
