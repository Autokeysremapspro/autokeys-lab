-- Pin search_path for custom public functions so caller-controlled search_path cannot alter resolution.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proconfig IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid=p.oid AND d.classid='pg_proc'::regclass AND d.deptype='e'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path TO public, extensions', r.signature);
  END LOOP;
END $$;

-- Trigger functions are internal implementation details and must not be RPC endpoints.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.prosecdef=true
      AND p.prorettype='trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.signature);
  END LOOP;
END $$;

-- These helpers can rely on their underlying RLS rather than owner privileges.
ALTER FUNCTION public.crear_notificacion(text,text,text,text,text,text,text,uuid,jsonb) SECURITY INVOKER;
ALTER FUNCTION public.crear_file_service_notificacion(uuid,uuid,text,text,text,jsonb) SECURITY INVOKER;
ALTER FUNCTION public.registrar_auditoria(text,text,text,text,text,text,text,jsonb) SECURITY INVOKER;
ALTER FUNCTION public.get_ak_laboratory_public_status() SECURITY INVOKER;

-- RLS helper is authenticated-only, never anonymous.
REVOKE EXECUTE ON FUNCTION public.is_tienda_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tienda_admin() TO authenticated, service_role;
