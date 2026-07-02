-- =========================================================
-- AUTOKEYS CORE v2.0
-- Portal / Gestión de Distribuidores
-- =========================================================

create extension if not exists "pgcrypto";

alter table file_service
add column if not exists distribuidor_id uuid references usuarios(id) on delete set null;

alter table file_service
add column if not exists fecha_entrega_prevista date;

alter table file_service
add column if not exists prioridad text default 'normal';

alter table file_service
add column if not exists visible_distribuidor boolean default true;

create table if not exists distribuidor_perfiles (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete cascade,
  nombre_comercial text,
  cif text,
  telefono text,
  email_facturacion text,
  direccion text,
  poblacion text,
  provincia text,
  codigo_postal text,
  tarifa text default 'general',
  activo boolean default true,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(usuario_id)
);

create table if not exists portal_distribuidor_mensajes (
  id uuid primary key default gen_random_uuid(),
  file_service_id uuid references file_service(id) on delete cascade,
  distribuidor_id uuid references usuarios(id) on delete set null,
  autor text default 'Autokeys',
  mensaje text not null,
  visible_distribuidor boolean default true,
  created_at timestamptz default now()
);

create index if not exists idx_file_service_distribuidor_id on file_service(distribuidor_id);
create index if not exists idx_distribuidor_perfiles_usuario_id on distribuidor_perfiles(usuario_id);
create index if not exists idx_portal_distribuidor_mensajes_file_service_id on portal_distribuidor_mensajes(file_service_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists distribuidor_perfiles_updated_at on distribuidor_perfiles;
create trigger distribuidor_perfiles_updated_at
before update on distribuidor_perfiles
for each row execute function set_updated_at();

alter table distribuidor_perfiles enable row level security;
alter table portal_distribuidor_mensajes enable row level security;

-- Políticas abiertas para desarrollo. Se cerrarán por rol en producción.
drop policy if exists "select_all" on distribuidor_perfiles;
drop policy if exists "insert_all" on distribuidor_perfiles;
drop policy if exists "update_all" on distribuidor_perfiles;
drop policy if exists "delete_all" on distribuidor_perfiles;

create policy "select_all" on distribuidor_perfiles for select using (true);
create policy "insert_all" on distribuidor_perfiles for insert with check (true);
create policy "update_all" on distribuidor_perfiles for update using (true);
create policy "delete_all" on distribuidor_perfiles for delete using (true);

drop policy if exists "select_all" on portal_distribuidor_mensajes;
drop policy if exists "insert_all" on portal_distribuidor_mensajes;
drop policy if exists "update_all" on portal_distribuidor_mensajes;
drop policy if exists "delete_all" on portal_distribuidor_mensajes;

create policy "select_all" on portal_distribuidor_mensajes for select using (true);
create policy "insert_all" on portal_distribuidor_mensajes for insert with check (true);
create policy "update_all" on portal_distribuidor_mensajes for update using (true);
create policy "delete_all" on portal_distribuidor_mensajes for delete using (true);

insert into auditoria_core (usuario, modulo, accion, descripcion)
values ('Sistema', 'Portal Distribuidores', 'Migración v2.0', 'Activado módulo de portal y gestión de distribuidores')
on conflict do nothing;
