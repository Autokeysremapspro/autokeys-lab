-- =====================================================
-- AUTOKEYS CORE + AK CLOUD SYNC
-- Añade campos de integración sin romper tablas existentes
-- =====================================================

create extension if not exists pgcrypto;

create table if not exists public.file_service_pedidos (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  user_id uuid,
  cliente_nombre text,
  cliente_email text,
  marca text,
  modelo text,
  motor text,
  anio text,
  ecu text,
  hw text,
  sw text,
  cv text,
  cambio text,
  servicios text[] default '{}',
  observaciones text,
  estado text not null default 'pendiente',
  prioridad text not null default 'normal',
  ori_nombre text,
  ori_bucket text,
  ori_path text,
  ori_size bigint,
  mod_nombre text,
  mod_bucket text,
  mod_path text,
  precio numeric(10,2) default 0,
  pagado boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.file_service_pedidos
add column if not exists core_cliente_id uuid,
add column if not exists core_vehiculo_id uuid,
add column if not exists core_expediente_id uuid,
add column if not exists tecnico_asignado text,
add column if not exists notas_core text,
add column if not exists convertido_at timestamptz;

create index if not exists idx_file_service_pedidos_core_expediente_id on public.file_service_pedidos(core_expediente_id);
create index if not exists idx_file_service_pedidos_core_cliente_id on public.file_service_pedidos(core_cliente_id);
create index if not exists idx_file_service_pedidos_estado_created on public.file_service_pedidos(estado, created_at desc);

alter table public.file_service_pedidos enable row level security;

drop policy if exists "fs_core_select_all" on public.file_service_pedidos;
drop policy if exists "fs_core_insert_all" on public.file_service_pedidos;
drop policy if exists "fs_core_update_all" on public.file_service_pedidos;
drop policy if exists "fs_core_delete_all" on public.file_service_pedidos;

create policy "fs_core_select_all"
on public.file_service_pedidos
for select
using (true);

create policy "fs_core_insert_all"
on public.file_service_pedidos
for insert
with check (true);

create policy "fs_core_update_all"
on public.file_service_pedidos
for update
using (true)
with check (true);

create policy "fs_core_delete_all"
on public.file_service_pedidos
for delete
using (true);

create table if not exists public.ak_creditos_recargas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nombre_cliente text,
  email_cliente text,
  creditos integer not null default 0,
  importe numeric(10,2) default 0,
  metodo_pago text default 'manual',
  estado text not null default 'pendiente',
  referencia_pago text,
  notas_cliente text,
  notas_admin text,
  aprobada_por uuid,
  aprobada_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ak_creditos_recargas enable row level security;

drop policy if exists "ak_recargas_core_select_all" on public.ak_creditos_recargas;
drop policy if exists "ak_recargas_core_insert_all" on public.ak_creditos_recargas;
drop policy if exists "ak_recargas_core_update_all" on public.ak_creditos_recargas;
drop policy if exists "ak_recargas_core_delete_all" on public.ak_creditos_recargas;

create policy "ak_recargas_core_select_all"
on public.ak_creditos_recargas
for select
using (true);

create policy "ak_recargas_core_insert_all"
on public.ak_creditos_recargas
for insert
with check (true);

create policy "ak_recargas_core_update_all"
on public.ak_creditos_recargas
for update
using (true)
with check (true);

create policy "ak_recargas_core_delete_all"
on public.ak_creditos_recargas
for delete
using (true);

-- Storage bucket compartido para ORI/MOD.
insert into storage.buckets (id, name, public)
values ('file-service', 'file-service', false)
on conflict (id) do nothing;
