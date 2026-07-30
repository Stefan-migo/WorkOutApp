-- Grant table-level privileges for Supabase roles
-- RLS policies filter further — these are the base grants so roles can access tables at all

-- service_role: full access for admin operations (seed scripts, migrations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- authenticated: CRUD own data (filtered by RLS) + read public exercises
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon: register-only (sign-up)
GRANT INSERT ON auth.users TO anon;
