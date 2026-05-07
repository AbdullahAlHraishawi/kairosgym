
-- 1. Profiles: restrict SELECT to owner
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. user_achievements: remove client INSERT (server-side only via service role)
DROP POLICY IF EXISTS "Users insert own achievements" ON public.user_achievements;

-- 3. Functions: lock down execute + switch touch_updated_at to INVOKER
ALTER FUNCTION public.touch_updated_at() SECURITY INVOKER;

REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. Move pg_trgm out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
