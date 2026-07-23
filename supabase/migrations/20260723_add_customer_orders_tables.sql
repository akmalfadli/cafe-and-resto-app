-- Migration to add Customer Pending Orders (Customer Order Drafts / Queue)
-- Support for Customer self-order -> Cashier approval -> POS Sales complete workflow

CREATE TABLE IF NOT EXISTS customer_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  table_number VARCHAR(20),
  order_type VARCHAR(20) DEFAULT 'dine_in', -- dine_in, take_away, delivery
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) DEFAULT 0.00,
  service_charge DECIMAL(12,2) DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES customer_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  notes TEXT,
  total_price DECIMAL(12,2) NOT NULL
);

-- Enable RLS
ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_order_items ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for customers & staff
DROP POLICY IF EXISTS "Allow full access customer_orders" ON customer_orders;
DROP POLICY IF EXISTS "Allow full access customer_order_items" ON customer_order_items;

CREATE POLICY "Allow full access customer_orders" ON customer_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access customer_order_items" ON customer_order_items FOR ALL USING (true) WITH CHECK (true);
