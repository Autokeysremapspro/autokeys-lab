-- AUTOKEYS CORE v12 — hardening final de funciones y tablas internas.
-- Aplicar DESPUÉS de v9, v10 y v11 y validar con los Advisors de Supabase.

alter table public.usuarios_app enable row level security;
alter table public.backup_registros enable row level security;

drop policy if exists "select_all" on public.backup_registros;
drop policy if exists "insert_all" on public.backup_registros;
drop policy if exists "update_all" on public.backup_registros;
drop policy if exists "delete_all" on public.backup_registros;

drop policy if exists "backup_staff_select" on public.backup_registros;
drop policy if exists "backup_admin_insert" on public.backup_registros;
drop policy if exists "backup_admin_delete" on public.backup_registros;
create policy "backup_staff_select" on public.backup_registros
  for select to authenticated using (public.is_staff());
create policy "backup_admin_insert" on public.backup_registros
  for insert to authenticated with check (public.is_admin());
create policy "backup_admin_delete" on public.backup_registros
  for delete to authenticated using (public.is_admin());

-- La versión histórica era SECURITY DEFINER y ejecutable por PUBLIC.
revoke all on function public.registrar_backup(text,text,text[],text,int,text) from public, anon, authenticated;

-- Índices para las comprobaciones de identidad/rol realizadas en cada petición.
create unique index if not exists usuarios_app_auth_user_id_uidx
  on public.usuarios_app(auth_user_id) where auth_user_id is not null;

-- Evita funciones privilegiadas accidentales accesibles desde Data API.
do $$
declare f record;
begin
  for f in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef
  loop
    execute format('revoke execute on function %I.%I(%s) from public, anon;', f.nspname, f.proname, f.args);
  end loop;
end $$;
