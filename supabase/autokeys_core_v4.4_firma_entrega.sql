-- =========================================================
-- AUTOKEYS CORE v4.4
-- Firma digital + entrega de vehículo
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists entregas_expediente (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete cascade,
  receptor_nombre text not null,
  receptor_dni text,
  observaciones text,
  firma_url text,
  firma_storage_path text,
  entregado_por text default 'Autokeys Core',
  entregado_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_entregas_expediente_id on entregas_expediente(expediente_id);
create index if not exists idx_entregas_created_at on entregas_expediente(created_at desc);

alter table entregas_expediente enable row level security;

drop policy if exists "select_all_entregas_v44" on entregas_expediente;
drop policy if exists "insert_all_entregas_v44" on entregas_expediente;
drop policy if exists "update_all_entregas_v44" on entregas_expediente;
drop policy if exists "delete_all_entregas_v44" on entregas_expediente;

create policy "select_all_entregas_v44"
on entregas_expediente
for select
using (true);

create policy "insert_all_entregas_v44"
on entregas_expediente
for insert
with check (true);

create policy "update_all_entregas_v44"
on entregas_expediente
for update
using (true)
with check (true);

create policy "delete_all_entregas_v44"
on entregas_expediente
for delete
using (true);

-- Bucket usado por archivos/fotos/firmas del expediente.
insert into storage.buckets (id, name, public)
values ('autokeys-expedientes', 'autokeys-expedientes', true)
on conflict (id) do update set public = excluded.public;

-- Políticas abiertas de storage para desarrollo interno.
-- Más adelante se cerrarán por usuario/rol.
drop policy if exists "storage_read_autokeys_exp_v44" on storage.objects;
drop policy if exists "storage_insert_autokeys_exp_v44" on storage.objects;
drop policy if exists "storage_update_autokeys_exp_v44" on storage.objects;
drop policy if exists "storage_delete_autokeys_exp_v44" on storage.objects;

create policy "storage_read_autokeys_exp_v44"
on storage.objects
for select
using (bucket_id = 'autokeys-expedientes');

create policy "storage_insert_autokeys_exp_v44"
on storage.objects
for insert
with check (bucket_id = 'autokeys-expedientes');

create policy "storage_update_autokeys_exp_v44"
on storage.objects
for update
using (bucket_id = 'autokeys-expedientes')
with check (bucket_id = 'autokeys-expedientes');

create policy "storage_delete_autokeys_exp_v44"
on storage.objects
for delete
using (bucket_id = 'autokeys-expedientes');
