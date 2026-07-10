-- Resolve Supabase security-advisor findings without renaming any project resources.

-- The admin helper only needs the caller's own profile row, which is already
-- visible through the "Users can view their own data" RLS policy.
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = (SELECT auth.uid())
      AND role IN ('super_admin', 'admin', 'staff')
      AND status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- This function is trigger-only and must never be exposed as an RPC.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- The current application calculates dashboard statistics through RLS-protected
-- table queries, so the old public SECURITY DEFINER RPCs are unnecessary.
DROP FUNCTION IF EXISTS public.get_lead_stats();
DROP FUNCTION IF EXISTS public.get_order_stats();

-- Preserve the existing views and column names while making them obey the
-- querying user's grants and row-level security policies.
ALTER VIEW public.user_stats SET (security_invoker = true);
ALTER VIEW public.lead_stats SET (security_invoker = true);
ALTER VIEW public.order_stats SET (security_invoker = true);

REVOKE ALL ON public.user_stats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.lead_stats FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.order_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_stats, public.lead_stats, public.order_stats TO authenticated;
