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

  const userObj = { ...authData.user, ...profile, name: profile?.name || 'User' };
  
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

// ── Inventory / Reports (Bypass for now / Empty Arrays for speed) ──
export const fetchIngredients = async () => ({ data: { data: { rows: [] } } });
export const fetchLowStock    = async () => ({ data: { data: [] } });
export const adjustStock      = async () => ({ data: {} });

export const createTable = async (data) => {
  const { error } = await supabase.from('tables').insert([data]);
  if (error) throw error;
  return { data: {} };
};
export const fetchDailyReport = async () => ({ data: { data: { total_revenue: 0, total_orders: 0, avg_order_value: 0 } } });
export const fetchWeeklyReport= async () => ({ data: { data: [] } });
export const fetchTopProducts = async () => ({ data: { data: [] } });
export const fetchHourlyReport= async () => ({ data: { data: [] } });

// ── Branches/Users ───────────────────────────────────────────
export const fetchBranches = async () => {
  const { data, error } = await supabase.from('branches').select('*');
  if (error) throw error;
  return { data: { data } };
};
export const fetchUsers = async () => ({ data: { data: { rows: [] } } });
