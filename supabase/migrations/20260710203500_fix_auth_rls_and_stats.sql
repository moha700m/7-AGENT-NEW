-- Production hardening for the existing agent-souq Supabase project.
-- This migration is idempotent and does not create or rename any project.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'customer',
    'active'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
        updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill the existing account so authenticated RLS checks can succeed.
INSERT INTO public.users (id, email, full_name, role, status)
SELECT id, email, COALESCE(raw_user_meta_data ->> 'full_name', 'Administrator'), 'super_admin', 'active'
FROM auth.users
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      role = CASE
        WHEN public.users.role IN ('super_admin', 'admin') THEN public.users.role
        ELSE 'super_admin'
      END,
      status = 'active',
      updated_at = CURRENT_TIMESTAMP;

-- Remove the recursive users policy and use the SECURITY DEFINER helper.
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
CREATE POLICY "Users can view their own data"
  ON public.users FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- Keep anonymous lead submission, but never expose anonymous leads publicly.
DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Public can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
CREATE POLICY "Public can create leads"
  ON public.leads FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()));
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Admins can manage all leads"
  ON public.leads FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Replace policy subqueries with the tested helper to keep admin access predictable.
DROP POLICY IF EXISTS "Admins can manage agents" ON public.agents;
CREATE POLICY "Admins can manage agents"
  ON public.agents FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

-- Add missing policies to RLS-enabled tables reported by the security advisor.
DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics;
CREATE POLICY "Admins can view analytics"
  ON public.analytics FOR SELECT TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users can manage their own files" ON public.files;
DROP POLICY IF EXISTS "Admins can manage all files" ON public.files;
CREATE POLICY "Users can manage their own files"
  ON public.files FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Admins can manage all files"
  ON public.files FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE OR REPLACE FUNCTION public.get_lead_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'total_leads', COUNT(*),
      'new_leads', COUNT(*) FILTER (WHERE status IN ('جديد', 'new')),
      'contacted', COUNT(*) FILTER (WHERE status IN ('تم التواصل', 'contacted')),
      'sold', COUNT(*) FILTER (WHERE status IN ('تم البيع', 'sold', 'converted'))
    )
    FROM public.leads
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_order_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privilege' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'total_orders', COUNT(*),
      'completed_orders', COUNT(*) FILTER (WHERE status IN ('completed', 'paid')),
      'total_revenue', COALESCE(SUM(amount) FILTER (WHERE status IN ('completed', 'paid')), 0)
    )
    FROM public.orders
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_lead_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_order_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lead_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_stats() TO authenticated;
