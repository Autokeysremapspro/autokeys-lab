-- =========================================================
-- AUTOKEYS CORE — Parche de seguridad (RLS real + roles)
-- Ejecutar una sola vez en el SQL editor de Supabase.
-- Repasa cada bloque antes de correrlo: si has renombrado alguna
-- tabla o columna respecto a las migraciones originales, ajusta
-- el nombre aquí antes de ejecutar.
-- =========================================================

-- ---------------------------------------------------------
-- 1) Helper de rol: única fuente de verdad = usuarios_app
-- ---------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios_app
    where auth_user_id = auth.uid()
      and activo = true
      and rol in ('admin', 'desarrollo', 'laboratorio', 'atencion_cliente')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from usuarios_app
    where auth_user_id = auth.uid()
      and activo = true
      and rol = 'admin'
  );
$$;

-- ---------------------------------------------------------
-- 2) usuarios_app — cada uno ve/edita su ficha; solo admin gestiona altas/roles
-- ---------------------------------------------------------
drop policy if exists "select_all" on usuarios_app;
drop policy if exists "insert_all" on usuarios_app;
drop policy if exists "update_all" on usuarios_app;
drop policy if exists "delete_all" on usuarios_app;

create policy "usuarios_app_select" on usuarios_app
  for select using (auth_user_id = auth.uid() or is_staff());

create policy "usuarios_app_update_propio" on usuarios_app
  for update using (auth_user_id = auth.uid() or is_admin())
  with check (auth_user_id = auth.uid() or is_admin());

create policy "usuarios_app_insert_admin" on usuarios_app
  for insert with check (is_admin());

create policy "usuarios_app_delete_admin" on usuarios_app
  for delete using (is_admin());

-- ---------------------------------------------------------
-- 3) Tablas de negocio sensibles — acceso solo staff
--    (clientes, facturación, cobros, stock, gastos)
--    Ajusta esta lista según las tablas reales que tengas creadas.
-- ---------------------------------------------------------
do $$
declare
  t text;
  staff_only_tables text[] := array[
    'clientes', 'facturas', 'pagos_factura', 'gastos', 'stock',
    'vehiculos', 'expedientes', 'auditoria_core', 'configuracion_permisos',
    'configuracion_notificaciones'
  ];
begin
  foreach t in array staff_only_tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security;', t);

      execute format('drop policy if exists "select_all" on public.%I;', t);
      execute format('drop policy if exists "insert_all" on public.%I;', t);
      execute format('drop policy if exists "update_all" on public.%I;', t);
      execute format('drop policy if exists "delete_all" on public.%I;', t);

      execute format('create policy "%1$s_staff_select" on public.%1$I for select using (is_staff());', t);
      execute format('create policy "%1$s_staff_insert" on public.%1$I for insert with check (is_staff());', t);
      execute format('create policy "%1$s_staff_update" on public.%1$I for update using (is_staff()) with check (is_staff());', t);
      execute format('create policy "%1$s_admin_delete" on public.%1$I for delete using (is_admin());', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------
-- 4) Nota importante
-- ---------------------------------------------------------
-- Esta migración cubre las tablas más críticas y el patrón para el resto.
-- Antes de darla por completa: repasa manualmente cada tabla que quede
-- fuera de esta lista (agenda, biblioteca_tecnica, objetivos_kpis, backups...)
-- y decide su política caso a caso — algunas pueden necesitar reglas más
-- finas que "todo el staff ve todo" (p. ej. backups, que quizá solo debería
-- tocar 'admin').
