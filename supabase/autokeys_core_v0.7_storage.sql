-- =========================================================
-- AUTOKEYS CORE v0.7 - STORAGE ARCHIVOS Y FOTOS
-- Ejecutar en Supabase SQL Editor antes de probar la v0.7
-- =========================================================

-- Ampliamos la tabla existente para poder eliminar archivos del storage
-- y mostrar metadatos en la ficha de expediente.
alter table archivos_expediente
add column if not exists storage_path text,
add column if not exists mime_type text,
add column if not exists size_bytes bigint;

-- Bucket público de desarrollo para archivos de expediente.
-- En producción lo pondremos privado con URLs firmadas y permisos por rol.
insert into storage.buckets (id, name, public, file_size_limit)
values ('autokeys-expedientes', 'autokeys-expedientes', true, 52428800)
on conflict (id) do update
set public = true,
    file_size_limit = 52428800;

-- Políticas Storage para desarrollo.
drop policy if exists "autokeys_exp_select" on storage.objects;
drop policy if exists "autokeys_exp_insert" on storage.objects;
drop policy if exists "autokeys_exp_update" on storage.objects;
drop policy if exists "autokeys_exp_delete" on storage.objects;

create policy "autokeys_exp_select"
on storage.objects
for select
using (bucket_id = 'autokeys-expedientes');

create policy "autokeys_exp_insert"
on storage.objects
for insert
with check (bucket_id = 'autokeys-expedientes');

create policy "autokeys_exp_update"
on storage.objects
for update
using (bucket_id = 'autokeys-expedientes')
with check (bucket_id = 'autokeys-expedientes');

create policy "autokeys_exp_delete"
on storage.objects
for delete
using (bucket_id = 'autokeys-expedientes');

-- Políticas abiertas de desarrollo para la tabla de metadatos.
alter table archivos_expediente enable row level security;

drop policy if exists "select_all" on archivos_expediente;
drop policy if exists "insert_all" on archivos_expediente;
drop policy if exists "update_all" on archivos_expediente;
drop policy if exists "delete_all" on archivos_expediente;

create policy "select_all" on archivos_expediente for select using (true);
create policy "insert_all" on archivos_expediente for insert with check (true);
create policy "update_all" on archivos_expediente for update using (true) with check (true);
create policy "delete_all" on archivos_expediente for delete using (true);
