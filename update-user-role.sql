-- Update user role to admin
UPDATE profiles 
SET role = 'admin',
    updated_at = now()
WHERE email = 'cybergada@gmail.com';

-- Verify the change
SELECT id, email, full_name, role, active 
FROM profiles 
WHERE email = 'cybergada@gmail.com';
