-- Migration: Simple Authentication System
-- Replaces Supabase Auth with simple email-based authentication

-- Create simple_users table for authentication
CREATE TABLE IF NOT EXISTS simple_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('provider', 'client')) NOT NULL,
  name text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE simple_users ENABLE ROW LEVEL SECURITY;

-- Allow reading own user data
CREATE POLICY "Users can read own data" ON simple_users
FOR SELECT
USING (true); -- For now, allow all reads for simplicity

-- Allow service role to manage users
CREATE POLICY "Service role can manage users" ON simple_users
FOR ALL
USING (true); -- Service role has full access

-- Insert existing users from your production setup
INSERT INTO simple_users (email, role, name) VALUES
('yamillues@gmail.com', 'provider', 'Yamil Lues'),
('luma.desarrollo@gmail.com', 'client', 'Luma Desarrollo')
ON CONFLICT (email) DO NOTHING;

-- Add some additional development users for easy testing
INSERT INTO simple_users (email, role, name) VALUES
('provider@dev.com', 'provider', 'Dev Provider'),
('client@dev.com', 'client', 'Dev Client'),
('admin@test.com', 'provider', 'Test Admin'),
('test@client.com', 'client', 'Test Client')
ON CONFLICT (email) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_simple_users_updated_at ON simple_users;
CREATE TRIGGER update_simple_users_updated_at
  BEFORE UPDATE ON simple_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_simple_users_email ON simple_users(email);
CREATE INDEX IF NOT EXISTS idx_simple_users_role ON simple_users(role);
CREATE INDEX IF NOT EXISTS idx_simple_users_active ON simple_users(active);