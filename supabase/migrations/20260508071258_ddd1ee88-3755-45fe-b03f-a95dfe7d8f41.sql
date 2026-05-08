-- 1. Restrict profile insert to authenticated users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also tighten update to authenticated only (was public)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Explicitly deny client-side writes on user_achievements.
-- Achievements are awarded server-side only via the service role (which bypasses RLS).
DROP POLICY IF EXISTS "No client inserts on user_achievements" ON public.user_achievements;
CREATE POLICY "No client inserts on user_achievements"
ON public.user_achievements
FOR INSERT
TO public
WITH CHECK (false);

DROP POLICY IF EXISTS "No client updates on user_achievements" ON public.user_achievements;
CREATE POLICY "No client updates on user_achievements"
ON public.user_achievements
FOR UPDATE
TO public
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "No client deletes on user_achievements" ON public.user_achievements;
CREATE POLICY "No client deletes on user_achievements"
ON public.user_achievements
FOR DELETE
TO public
USING (false);