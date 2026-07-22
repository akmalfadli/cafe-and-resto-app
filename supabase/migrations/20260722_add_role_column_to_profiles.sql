-- Add role VARCHAR column to profiles defaulting to 'Owner'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Owner';
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'Owner';
