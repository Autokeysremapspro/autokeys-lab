-- AUTOKEYS CORE v4.6 - Archivos Pro por expediente

create extension if not exists "pgcrypto";

create table if not exists expediente_archivos_pro (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete cascade,
  nombre text not null,
  categoria text not null default 'OTRO',
  tipo_mime text,
  tamano_bytes bigint default 0,
  storage_bucket text not null default 'expediente-archivos',
  storage_path text not null,
  url_publica text,
  ecu text,
  hw text,
  sw text,
  vin text,
  version text,
  descripcion text,
  notas text,
  creado_por text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_expediente_archivos_pro_expediente on expediente_archivos_pro(expediente_id);
create index if not exists idx_expediente_archivos_pro_categoria on expediente_archivos_pro(categoria);
create index if not exists idx_expediente_archivos_pro_busqueda on expediente_archivos_pro(nombre, ecu, hw, sw, vin);

alter table expediente_archivos_pro enable row level security;

drop policy if exists "select_all_archivos_pro" on expediente_archivos_pro;
drop policy if exists "insert_all_archivos_pro" on expediente_archivos_pro;
drop policy if exists "update_all_archivos_pro" on expediente_archivos_pro;
drop policy if exists "delete_all_archivos_pro" on expediente_archivos_pro;

create policy "select_all_archivos_pro"
on expediente_archivos_pro
for select
using (true);

create policy "insert_all_archivos_pro"
on expediente_archivos_pro
for insert
with check (true);

create policy "update_all_archivos_pro"
on expediente_archivos_pro
for update
using (true);

create policy "delete_all_archivos_pro"
on expediente_archivos_pro
for delete
using (true);

-- Bucket de Supabase Storage para archivos técnicos
insert into storage.buckets (id, name, public)
values ('expediente-archivos', 'expediente-archivos', true)
on conflict (id) do nothing;

-- Políticas Storage abiertas para desarrollo interno
drop policy if exists "storage_select_expediente_archivos" on storage.objects;
drop policy if exists "storage_insert_expediente_archivos" on storage.objects;
drop policy if exists "storage_update_expediente_archivos" on storage.objects;
drop policy if exists "storage_delete_expediente_archivos" on storage.objects;

create policy "storage_select_expediente_archivos"
on storage.objects
for select
using (bucket_id = 'expediente-archivos');

create policy "storage_insert_expediente_archivos"
on storage.objects
for insert
with check (bucket_id = 'expediente-archivos');

create policy "storage_update_expediente_archivos"
on storage.objects
for update
using (bucket_id = 'expediente-archivos');

create policy "storage_delete_expediente_archivos"
on storage.objects
for delete
using (bucket_id = 'expediente-archivos');

-- Registrar evento en historial si existe la tabla expediente_historial
create or replace function registrar_historial_archivo_pro()
returns trigger as $$
begin
  if to_regclass('public.expediente_historial') is not null then
    insert into expediente_historial (expediente_id, tipo, descripcion, created_at)
    values (
      new.expediente_id,
      'archivo',
      'Archivo añadido: ' || new.nombre || ' (' || new.categoria || ')',
      now()
    );
  end if;
  return new;
exception when others then
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_historial_archivo_pro_insert on expediente_archivos_pro;
create trigger trigger_historial_archivo_pro_insert
after insert on expediente_archivos_pro
for each row execute function registrar_historial_archivo_pro();

create or replace function set_archivo_pro_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_archivo_pro_updated_at on expediente_archivos_pro;
create trigger trigger_archivo_pro_updated_at
before update on expediente_archivos_pro
for each row execute function set_archivo_pro_updated_at();
