import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  loading: true,

  initialize: async () => {
    // Check initial session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Get profile details for RBAC
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(name), branches(name)')
        .eq('id', session.user.id)
        .single();
        
      set({ 
        user: { ...session.user, ...profile, role: profile?.roles?.name }, 
        accessToken: session.access_token,
        loading: false 
      });
    } else {
      set({ user: null, accessToken: null, loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, roles(name), branches(name)')
          .eq('id', session.user.id)
          .single();
          
        set({ 
          user: { ...session.user, ...profile, role: profile?.roles?.name }, 
          accessToken: session.access_token 
        });
      } else {
        set({ user: null, accessToken: null });
      }
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, accessToken: null });
  },

  isAuthenticated: () => !!get().accessToken,
  hasRole: (role) => get().user?.role === role,
}));

export default useAuthStore;
