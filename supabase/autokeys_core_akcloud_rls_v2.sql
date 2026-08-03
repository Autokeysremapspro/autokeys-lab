-- AK Cloud RLS v2 — Cierra el acceso abierto ("using (true) with check (true)")
-- del catálogo AK Cloud (servicios, planes, métodos de pago, reglas de precio,
-- servicios por plan y novedades). Reutiliza is_staff()/is_admin() (v9).
--
-- Antes de esto, con la clave pública (anon/authenticated) de Supabase
-- cualquiera podía insertar, editar o borrar directamente estas tablas,
-- no solo leerlas. Con este parche: lectura para cualquier usuario logueado
-- (son precios y catálogo, no datos sensibles) y escritura solo para staff.
--
-- Ejecutar una sola vez en el SQL editor de Supabase, después de v9/v11.

do $$
declare
  t text;
  pol record;
  catalogo_tables text[] := array[
    'akcloud_servicios', 'akcloud_planes', 'akcloud_metodos_pago',
    'akcloud_reglas_precios', 'akcloud_plan_servicios', 'akcloud_novedades'
  ];
begin
  foreach t in array catalogo_tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security;', t);

      for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
        execute format('drop policy if exists %I on public.%I;', pol.policyname, t);
      end loop;

      execute format('create policy "%1$s_select_auth" on public.%1$I for select using (auth.role() = ''authenticated'');', t);
      execute format('create policy "%1$s_staff_insert" on public.%1$I for insert with check (is_staff());', t);
      execute format('create policy "%1$s_staff_update" on public.%1$I for update using (is_staff()) with check (is_staff());', t);
      execute format('create policy "%1$s_admin_delete" on public.%1$I for delete using (is_admin());', t);
    end if;
  end loop;
end $$;
