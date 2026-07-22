-- Add cashier_name and customer_name column to sales table for direct receipt rendering
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashier_name VARCHAR(100) DEFAULT 'Kasir';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100) DEFAULT 'Pelanggan Umum';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS table_number VARCHAR(20);
