-- ============================================================
-- ServeX Database Schema for SUPABASE
-- ============================================================

-- Enable Realtime for specific tables (crucial for Kitchen Screen)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================

CREATE TABLE public.roles (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.permissions (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.role_permissions (
    role_id       INT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE public.branches (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    location  TEXT,
    phone     VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS (Linked to Supabase Auth)
-- ============================================================

-- This table holds extra profile info for users managed by Supabase Auth
CREATE TABLE public.profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    role_id       INT REFERENCES public.roles(id),
    branch_id     INT REFERENCES public.branches(id) ON DELETE SET NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLES, PRODUCTS, INVENTORY, ORDERS
-- ============================================================

CREATE TABLE public.tables (
    id        SERIAL PRIMARY KEY,
    number    INT NOT NULL,
    status    VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
    capacity  INT NOT NULL DEFAULT 4,
    branch_id INT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (number, branch_id)
);

CREATE TABLE public.categories (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.products (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    description  TEXT,
    price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url    TEXT,
    category_id  INT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    sku          VARCHAR(80) UNIQUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.product_variants (
    id         SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    price      NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.orders (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type        VARCHAR(20) NOT NULL DEFAULT 'dine_in' CHECK (type IN ('dine_in', 'takeaway', 'delivery')),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    total_price NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
    notes       TEXT,
    branch_id   INT NOT NULL REFERENCES public.branches(id),
    table_id    INT REFERENCES public.tables(id) ON DELETE SET NULL,
    user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id         SERIAL PRIMARY KEY,
    order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id INT REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ingredients (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    unit           VARCHAR(30) NOT NULL DEFAULT 'g',
    stock_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    min_stock      NUMERIC(12, 3) NOT NULL DEFAULT 0,
    cost_per_unit  NUMERIC(10, 4) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADD TABLES TO SUPABASE REALTIME (for web sockets)
-- ============================================================
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.tables;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Optional but good practice
-- Disable for testing to ensure everything works out of box
-- ============================================================
-- ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read for all" ON public.orders FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for all" ON public.orders FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update for all" ON public.orders FOR UPDATE USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO public.roles (name) VALUES ('super_admin'), ('admin'), ('cashier'), ('kitchen');

INSERT INTO public.branches (name, location) VALUES ('Main Branch', 'City Center');

INSERT INTO public.categories (name, sort_order) VALUES ('Burgers', 1), ('Beverages', 2), ('Sides', 3);

INSERT INTO public.products (name, price, category_id, is_available) VALUES
  ('Classic Burger', 8.99, 1, TRUE),
  ('Cheese Burger', 10.99, 1, TRUE),
  ('Cola', 2.50, 2, TRUE),
  ('French Fries', 3.99, 3, TRUE);

INSERT INTO public.tables (number, capacity, branch_id) VALUES
  (1,4,1),(2,4,1),(3,2,1),(4,6,1),(5,4,1);

-- Note: Users need to be created via Supabase Auth signup before inserting into profiles!
