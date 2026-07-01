-- AUTOKEYS CORE v1.3 - usuarios y permisos de desarrollo

create table if not exists usuarios_app (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique not null,
  rol text not null default 'laboratorio',
  activo boolean default true,
  created_at timestamptz default now()
);

alter table usuarios_app enable row level security;

drop policy if exists "select_all" on usuarios_app;
drop policy if exists "insert_all" on usuarios_app;
drop policy if exists "update_all" on usuarios_app;
drop policy if exists "delete_all" on usuarios_app;

create policy "select_all" on usuarios_app for select using (true);
create policy "insert_all" on usuarios_app for insert with check (true);
create policy "update_all" on usuarios_app for update using (true);
create policy "delete_all" on usuarios_app for delete using (true);
