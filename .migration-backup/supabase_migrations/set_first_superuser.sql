-- ============================================
-- Set your account as superuser (run once after first login)
-- Run in Supabase SQL Editor after you have signed in at least once.
-- ============================================
-- To use a different email, change the address below and run.

UPDATE public.profiles
SET role = 'superuser', updated_at = NOW()
WHERE email = 'rob.reichstorer@gmail.com';

-- Optional: confirm the update (should return 1 row)
-- SELECT id, email, role FROM public.profiles WHERE email = 'rob.reichstorer@gmail.com';
