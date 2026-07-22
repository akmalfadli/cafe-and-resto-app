-- CafePOS Database Schema Migration
-- Compatible with Supabase PostgreSQL
-- Includes soft deletes, auto cost & stock triggers, RLS policies, audit logs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 2. Profiles (Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'Owner', -- Owner, Manager, Cashier, Kitchen
  role_id UUID REFERENCES roles(id),
  avatar_url TEXT,
  pin_code VARCHAR(6), -- Quick cashier login PIN
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3. Categories & Products
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50),
  description TEXT,
  image_url TEXT,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Computed recipe cost
  packaging_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  service_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_available BOOLEAN DEFAULT TRUE,
  is_favorite BOOLEAN DEFAULT FALSE,
  kitchen_printer VARCHAR(50) DEFAULT 'Main Kitchen',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. Ingredients & Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(30),
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ingredient_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES ingredient_categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  name VARCHAR(150) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- gram, ml, pcs, etc.
  avg_cost DECIMAL(12,4) NOT NULL DEFAULT 0.00,
  min_stock DECIMAL(12,2) DEFAULT 10.00,
  current_stock DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(12,4) NOT NULL, -- amount required per product
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Ingredient Purchases (Weighted Average Cost Update)
CREATE TABLE IF NOT EXISTS ingredient_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredient_purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES ingredient_purchases(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id),
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,4) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL
);

-- 7. Sales, Items, Payments & Shift
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_number VARCHAR(20) NOT NULL UNIQUE,
  capacity INT DEFAULT 4,
  status VARCHAR(20) DEFAULT 'available', -- available, occupied, reserved
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(100),
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id UUID REFERENCES profiles(id),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  starting_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ending_cash DECIMAL(12,2),
  expected_cash DECIMAL(12,2),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'open' -- open, closed
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES cash_shifts(id),
  type VARCHAR(20) NOT NULL, -- cash_in, cash_out
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT NOT NULL,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  cashier_id UUID REFERENCES profiles(id),
  cashier_name VARCHAR(100) DEFAULT 'Kasir',
  customer_name VARCHAR(100) DEFAULT 'Pelanggan Umum',
  table_number VARCHAR(20),
  shift_id UUID REFERENCES cash_shifts(id),
  customer_id UUID REFERENCES customers(id),
  table_id UUID REFERENCES tables(id),
  order_type VARCHAR(20) DEFAULT 'dine_in', -- dine_in, take_away, delivery
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  service_charge DECIMAL(12,2) DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_cogs DECIMAL(12,2) NOT NULL DEFAULT 0.00, -- Total product material costs
  status VARCHAR(20) DEFAULT 'completed', -- completed, refunded, voided
  void_reason TEXT,
  voided_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL, -- COGS per item at sell time
  notes TEXT,
  total_price DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  method VARCHAR(30) NOT NULL, -- cash, qris, transfer, split
  amount DECIMAL(12,2) NOT NULL,
  change_amount DECIMAL(12,2) DEFAULT 0.00,
  reference_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- AUTOMATED TRIGGERS & FUNCTIONS
-- ========================================================

-- Trigger 1: Automatic Weighted Average Ingredient Cost & Stock Increase on Purchase Item Insert
CREATE OR REPLACE FUNCTION process_ingredient_purchase_item()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ingredients
  SET 
    -- Weighted average formula: ((old_avg * old_stock) + (new_price * new_qty)) / (old_stock + new_qty)
    avg_cost = CASE 
      WHEN (current_stock + NEW.quantity) > 0 
      THEN ((avg_cost * current_stock) + (NEW.unit_price * NEW.quantity)) / (current_stock + NEW.quantity)
      ELSE NEW.unit_price
    END,
    current_stock = current_stock + NEW.quantity,
    updated_at = NOW()
  WHERE id = NEW.ingredient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_purchase_item_inserted
AFTER INSERT ON ingredient_purchase_items
FOR EACH ROW EXECUTE FUNCTION process_ingredient_purchase_item();

-- Trigger 2: Automatic Stock Reduction & Check on Sale Item Insert
CREATE OR REPLACE FUNCTION process_sale_stock_reduction()
RETURNS TRIGGER AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Find recipe ingredients for this product
  FOR rec IN 
    SELECT ri.ingredient_id, (ri.quantity * NEW.quantity) AS req_qty
    FROM recipe_items ri
    JOIN recipes r ON r.id = ri.recipe_id
    WHERE r.product_id = NEW.product_id
  LOOP
    -- Deduct stock
    UPDATE ingredients
    SET 
      current_stock = current_stock - rec.req_qty,
      updated_at = NOW()
    WHERE id = rec.ingredient_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sale_item_inserted
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION process_sale_stock_reduction();

-- Row Level Security (RLS) Enablement across all 22 core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Complete access policies for POS and Back Office operations
CREATE POLICY "Allow full access profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access ingredient_categories" ON ingredient_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access recipe_items" ON recipe_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access ingredient_purchases" ON ingredient_purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access ingredient_purchase_items" ON ingredient_purchase_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access tables" ON tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access cash_shifts" ON cash_shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access cash_movements" ON cash_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
