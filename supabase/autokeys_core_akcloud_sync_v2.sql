-- Autokeys Core + AK Cloud Sync v2
-- Responder trabajos desde Autokeys Core: mensajes, notificaciones y entrega de MOD.

-- Columnas necesarias en pedidos AK Cloud
alter table if exists file_service_pedidos
  add column if not exists mod_nombre text,
  add column if not exists mod_bucket text,
  add column if not exists mod_path text,
  add column if not exists tecnico_asignado text,
  add column if not exists notas_core text,
  add column if not exists core_cliente_id uuid,
  add column if not exists core_vehiculo_id uuid,
  add column if not exists core_expediente_id uuid,
  add column if not exists convertido_at timestamptz,
  add column if not exists updated_at timestamptz default now();

-- Chat por pedido
create table if not exists file_service_mensajes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references file_service_pedidos(id) on delete cascade,
  user_id uuid null,
  autor_nombre text null,
  autor_tipo text not null default 'cliente',
  mensaje text not null,
  leido boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_file_service_mensajes_pedido_id on file_service_mensajes(pedido_id);
create index if not exists idx_file_service_mensajes_created_at on file_service_mensajes(created_at);

alter table file_service_mensajes enable row level security;

drop policy if exists "fs_mensajes_select_all" on file_service_mensajes;
create policy "fs_mensajes_select_all"
on file_service_mensajes
for select
using (true);

drop policy if exists "fs_mensajes_insert_all" on file_service_mensajes;
create policy "fs_mensajes_insert_all"
on file_service_mensajes
for insert
with check (true);

drop policy if exists "fs_mensajes_update_all" on file_service_mensajes;
create policy "fs_mensajes_update_all"
on file_service_mensajes
for update
using (true);

drop policy if exists "fs_mensajes_delete_all" on file_service_mensajes;
create policy "fs_mensajes_delete_all"
on file_service_mensajes
for delete
using (true);

-- Notificaciones AK Cloud
create table if not exists file_service_notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  pedido_id uuid null,
  titulo text not null,
  mensaje text null,
  tipo text not null default 'info',
  leida boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_file_service_notificaciones_user_created
on file_service_notificaciones (user_id, created_at desc);

create index if not exists idx_file_service_notificaciones_pedido
on file_service_notificaciones (pedido_id);

alter table file_service_notificaciones enable row level security;

drop policy if exists "fs_notif_select_all" on file_service_notificaciones;
create policy "fs_notif_select_all"
on file_service_notificaciones
for select
using (true);

drop policy if exists "fs_notif_insert_all" on file_service_notificaciones;
create policy "fs_notif_insert_all"
on file_service_notificaciones
for insert
with check (true);

drop policy if exists "fs_notif_update_all" on file_service_notificaciones;
create policy "fs_notif_update_all"
on file_service_notificaciones
for update
using (true);

drop policy if exists "fs_notif_delete_all" on file_service_notificaciones;
create policy "fs_notif_delete_all"
on file_service_notificaciones
for delete
using (true);

-- Storage bucket compartido para ORI/MOD
insert into storage.buckets (id, name, public)
values ('file-service', 'file-service', false)
on conflict (id) do nothing;
