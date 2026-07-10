-- Restore API role privileges required by PostgREST.
-- Row Level Security policies remain the final authorization layer.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT INSERT ON TABLE public.leads TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.leads_id_seq TO anon;

GRANT SELECT ON TABLE public.agents TO anon;
GRANT SELECT ON TABLE public.plans TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
