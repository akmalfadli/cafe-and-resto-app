-- Allow public/anon and authenticated users full access to profiles table for POS registration & login
CREATE POLICY "Allow anon insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow anon update profiles" ON profiles FOR UPDATE USING (true);
