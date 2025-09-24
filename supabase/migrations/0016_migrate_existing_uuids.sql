-- Migration: Update simple_users to use existing Supabase Auth UUIDs
-- This ensures projects and data remain connected after auth migration

-- Update yamillues@gmail.com to use the existing provider UUID
UPDATE simple_users
SET id = '26258cab-520f-499e-84c3-33dc04419e02'
WHERE email = 'yamillues@gmail.com';

-- Update luma.desarrollo@gmail.com to use the existing client UUID
UPDATE simple_users
SET id = '6947498a-7f62-4f0f-b708-fcd7bfa8fd9c'
WHERE email = 'luma.desarrollo@gmail.com';

-- Verify the updates
SELECT id, email, role, name FROM simple_users WHERE email IN ('yamillues@gmail.com', 'luma.desarrollo@gmail.com');