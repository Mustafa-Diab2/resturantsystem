import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';

// ── Auth ──────────────────────────────────────────────────────
export const login = async (data) => {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (error) throw error;
  
  // Fetch profile via manual query since auth happens fast
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', authData.user.id)
    .single();

  const userObj = { 
    ...authData.user, 
    ...profile, 
    name: profile?.name || 'User',
    role: profile?.roles?.name?.toLowerCase().replace(' ', '_')
  };
  
  // Manually stick into store so app routes immediately
  useAuthStore.setState({ user: userObj, accessToken: authData.session.access_token });
  return { data: { data: { user: userObj } } };
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// ── Orders ───────────────────────────────────────────────────
export const fetchOrders = async (params) => {
  let query = supabase
    .from('orders')
    .select(`
      *,
      branches (name),
      tables (number),
      profiles (name)
    `)
    .order('created_at', { ascending: false });

  if (params?.status) query = query.eq('status', params.status);
  if (params?.branch_id) query = query.eq('branch_id', params.branch_id);

  const { data, error } = await query;
  if (error) throw error;
  
  // Format to match old node.js response structure
  const formattedRows = data.map(d => ({
    ...d,
    branch_name: d.branches?.name,
    table_number: d.tables?.number,
    cashier_name: d.profiles?.name
  }));
  return { data: { data: formattedRows, pagination: { total: data.length } } };
};

export const fetchOrder = async (id) => {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, branches(name), tables(number), profiles(name)')
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*, products(name), product_variants(name)')
    .eq('order_id', id);
  if (itemsError) throw itemsError;

  return { 
    data: { 
      data: {
        ...order,
        branch_name: order.branches?.name,
        table_number: order.tables?.number,
        cashier_name: order.profiles?.name,
        items: items.map(i => ({
          ...i,
          product_name: i.products?.name,
          variant_name: i.product_variants?.name
        }))
      } 
    } 
  };
};

export const createOrder = async (data) => {
  const { data: order, error } = await supabase
    .from('orders')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return { data: { id: order.id } }; // Return raw object mapped to old style
};

export const addOrderItem = async (orderId, data) => {
  const { data: item, error } = await supabase
    .from('order_items')
    .insert([{ ...data, order_id: orderId }])
    .select()
    .single();
  
  if (error) throw error;
  
  // Also recalculate order total in supabase natively:
  // Usually done by DB trigger or calling a function. For now we will just compute locally for DB.
  return { data: item };
};

export const updateOrderStatus = async (id, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return { data };
};

// ── Products ─────────────────────────────────────────────────
export const fetchProducts = async (params) => {
  let query = supabase.from('products').select('*, categories(name)').order('name');
  if (params?.category_id) query = query.eq('category_id', params.category_id);
  if (params?.is_available !== undefined) query = query.eq('is_available', params.is_available);

  const { data, error } = await query;
  if (error) throw error;

  const formattedRows = data.map(d => ({ ...d, category_name: d.categories?.name }));
  return { data: { data: formattedRows, pagination: { total: data.length } } };
};

export const createProduct = async (data) => {
  const { error } = await supabase.from('products').insert([data]);
  if (error) throw error;
};

export const updateProduct = async (id, data) => {
  const { error } = await supabase.from('products').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteProduct = async (id) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};

// ── Categories ───────────────────────────────────────────────
export const fetchCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) throw error;
  return { data: { data } };
};

// ── Tables ───────────────────────────────────────────────────
export const fetchTables = async (params) => {
  let query = supabase.from('tables').select('*').order('number');
  if (params?.branch_id) query = query.eq('branch_id', params.branch_id);
  const { data, error } = await query;
  if (error) throw error;
  return { data: { data } };
};

export const updateTableStatus = async (id, status) => {
  const { data, error } = await supabase.from('tables').update({ status }).eq('id', id);
  if (error) throw error;
  return { data };
};

export const fetchIngredients = async () => {
  const { data, error } = await supabase.from('ingredients').select('*').order('name');
  if (error) throw error;
  return { data: { data: { rows: data } } };
};

export const fetchLowStock = async () => {
  const { data, error } = await supabase.from('ingredients').select('*');
  if (error) throw error;
  return { data: { data: data.filter(i => Number(i.stock_quantity) <= Number(i.min_stock)) } };
};

export const adjustStock = async (payload) => {
  const { data: ing } = await supabase.from('ingredients').select('stock_quantity').eq('id', payload.id).single();
  const newQty = Number(ing?.stock_quantity || 0) + Number(payload.delta);
  const { error } = await supabase.from('ingredients').update({ stock_quantity: newQty }).eq('id', payload.id);
  if (error) throw error;
  return { data: {} };
};

export const createTable = async (data) => {
  const { error } = await supabase.from('tables').insert([data]);
  if (error) throw error;
  return { data: {} };
};

export const fetchDailyReport = async (params) => {
  const start = new Date(); start.setHours(0,0,0,0);
  let q = supabase.from('orders').select('total_price, type').gte('created_at', start.toISOString()).neq('status', 'cancelled');
  if (params?.branch_id) q = q.eq('branch_id', params.branch_id);
  const { data, error } = await q;
  if (error) throw error;
  
  let rev = 0, dine = 0, tk = 0, del = 0;
  data.forEach(o => {
    rev += Number(o.total_price);
    if(o.type === 'dine_in') dine++;
    if(o.type === 'takeaway') tk++;
    if(o.type === 'delivery') del++;
  });
  return { data: { data: { total_revenue: rev, total_orders: data.length, avg_order_value: data.length ? (rev / data.length) : 0, dine_in_count: dine, takeaway_count: tk, delivery_count: del } } };
};

export const fetchWeeklyReport = async (params) => {
  const start = new Date(); start.setDate(start.getDate() - 7);
  let q = supabase.from('orders').select('total_price, created_at').gte('created_at', start.toISOString()).neq('status', 'cancelled');
  if (params?.branch_id) q = q.eq('branch_id', params.branch_id);
  const { data, error } = await q;
  if (error) throw error;
  const days = {};
  for(let i=6; i>=0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days[d.toISOString().split('T')[0]] = 0; }
  data.forEach(o => { const date = o.created_at.split('T')[0]; if(days[date] !== undefined) days[date] += Number(o.total_price); });
  return { data: { data: Object.keys(days).map(date => ({ date, revenue: days[date] })) } };
};

export const fetchTopProducts = async () => {
  const { data, error } = await supabase.from('order_items').select('quantity, products(name)');
  if (error) throw error;
  const map = {};
  data.forEach(i => { const n = i.products?.name; if(n){ map[n] = (map[n]||0) + i.quantity; } });
  return { data: { data: Object.keys(map).map(name => ({ name, total_qty: map[name] })).sort((a,b)=>b.total_qty - a.total_qty) } };
};

export const fetchHourlyReport = async (params) => {
  const start = new Date(); start.setHours(0,0,0,0);
  let q = supabase.from('orders').select('total_price, created_at').gte('created_at', start.toISOString()).neq('status', 'cancelled');
  if (params?.branch_id) q = q.eq('branch_id', params.branch_id);
  const { data, error } = await q;
  if (error) throw error;
  const hMap = {};
  data.forEach(o => {
    const h = new Date(o.created_at).getHours();
    if(!hMap[h]) hMap[h] = { revenue: 0, orders: 0 };
    hMap[h].revenue += Number(o.total_price); hMap[h].orders += 1;
  });
  return { data: { data: Object.keys(hMap).map(h => ({ hour: h, revenue: hMap[h].revenue, orders: hMap[h].orders })).sort((a,b)=>a.hour-b.hour) } };
};

export const fetchBranches = async () => {
  const { data, error } = await supabase.from('branches').select('*');
  if (error) throw error;
  return { data: { data } };
};

export const fetchUsers = async () => {
  const { data, error } = await supabase.from('profiles').select('*, roles(name), branches(name)');
  if (error) throw error;
  const mapped = data.map(u => ({ ...u, role_name: u.roles?.name, branch_name: u.branches?.name }));
  return { data: { data: { rows: mapped } } };
};
