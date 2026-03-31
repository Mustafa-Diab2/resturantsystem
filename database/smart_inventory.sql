-- ============================================================
-- SMART INVENTORY AUTO-DEDUCTION (RECIPES TRIGGER)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create a table that links products to their raw ingredients (The Recipe)
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity_required NUMERIC(10,3) NOT NULL CHECK (quantity_required > 0),
    UNIQUE(product_id, ingredient_id)
);

-- 2. Create the Database Function that deducts inventory
CREATE OR REPLACE FUNCTION deduct_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Deduct the exact quantity of ingredients needed based on the recipe
    UPDATE public.ingredients i
    SET stock_quantity = i.stock_quantity - (ri.quantity_required * NEW.quantity)
    FROM public.recipe_ingredients ri
    WHERE ri.product_id = NEW.product_id
      AND i.id = ri.ingredient_id;
      
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the Trigger on the order_items table
DROP TRIGGER IF EXISTS deduct_inventory_trigger ON public.order_items;
CREATE TRIGGER deduct_inventory_trigger
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION deduct_inventory_on_order();

-- ============================================================
-- DEMO DATA for Smart Inventory
-- Assuming Burger Product ID = 1 requires 1 Bun (ID 1) & 150g Meat (ID 2)
-- Make sure to populate ingredients first:
-- INSERT INTO ingredients (id, name, unit, stock_quantity) VALUES (1, 'Burger Buns', 'pcs', 100), (2, 'Beef Patty', 'g', 15000);
-- INSERT INTO recipe_ingredients (product_id, ingredient_id, quantity_required) VALUES (1, 1, 1), (1, 2, 150);
-- ============================================================
