-- Supabase Storage Setup & Row Level Security (RLS) Policies
-- Bucket Name: product-images

-- 1. Create the public storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies if present to prevent duplicate errors
DROP POLICY IF EXISTS "Allow public read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete product-images" ON storage.objects;

-- 3. Allow Public/Anon Read Access to product-images bucket
CREATE POLICY "Allow public read product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 4. Allow Upload/Insert to product-images bucket
CREATE POLICY "Allow upload product-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 5. Allow Update to product-images bucket
CREATE POLICY "Allow update product-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- 6. Allow Delete from product-images bucket
CREATE POLICY "Allow delete product-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
