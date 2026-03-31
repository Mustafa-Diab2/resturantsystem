-- ============================================================
-- SAAS MULTI-TENANT MIGRATION SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the core Tenants (Restaurants/Companies) table
CREATE TABLE IF NOT EXISTS public.tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    domain VARCHAR(100) UNIQUE,
    subscription_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Insert the very first Tenant (Your existing demo restaurant)
INSERT INTO public.tenants (id, name, domain) 
VALUES (1, 'ServeX First Client', 'demo')
ON CONFLICT DO NOTHING;

-- 3. Add tenant_id to all major tables with a default of 1 for existing data
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES public.tenants(id) DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES public.tenants(id) DEFAULT 1;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES public.tenants(id) DEFAULT 1;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES public.tenants(id) DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES public.tenants(id) DEFAULT 1;
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES public.tenants(id) DEFAULT 1;
ALTER TABLE public.ingredients ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES public.tenants(id) DEFAULT 1;

-- 4. Update the profiles login trigger or queries (Optional if using Supabase Auth Triggers)
-- For now, the Frontend RegisterPage will manually populate these columns during signup.

-- Congratulations! Your database is now a Multi-Tenant SaaS Engine! 🚀
