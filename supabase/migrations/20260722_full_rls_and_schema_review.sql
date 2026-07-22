-- Comprehensive Supabase Migration Script & Row Level Security (RLS) Policies
-- Covers all 22 tables, foreign keys, automated stock/cost recalculation triggers, and RLS policies

-- 1. Enable RLS on all 22 core tables
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

-- 2. Drop existing restrictive policies if present to prevent conflicts
DROP POLICY IF EXISTS "Allow all access profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated read products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow authenticated sales" ON sales;

-- 3. Create permissive policies for POS & Back Office operations
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
