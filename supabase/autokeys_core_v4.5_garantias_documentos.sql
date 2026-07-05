-- =========================================================
-- AUTOKEYS CORE v4.5
-- Garantías + justificantes del expediente
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists garantias_expediente (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete cascade,
  entrega_id uuid references entregas_expediente(id) on delete set null,
  tipo text not null default 'garantia',
  titulo text not null default 'Garantía de servicio',
  receptor_nombre text,
  receptor_dni text,
  trabajo_realizado text,
  condiciones text,
  observaciones text,
  firma_url text,
  documento_url text,
  generado_por text default 'Autokeys Core',
  generado_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_garantias_expediente_id on garantias_expediente(expediente_id);
create index if not exists idx_garantias_entrega_id on garantias_expediente(entrega_id);
create index if not exists idx_garantias_created_at on garantias_expediente(created_at desc);

alter table garantias_expediente enable row level security;

drop policy if exists "select_all_garantias_v45" on garantias_expediente;
drop policy if exists "insert_all_garantias_v45" on garantias_expediente;
drop policy if exists "update_all_garantias_v45" on garantias_expediente;
drop policy if exists "delete_all_garantias_v45" on garantias_expediente;

create policy "select_all_garantias_v45"
on garantias_expediente
for select
using (true);

create policy "insert_all_garantias_v45"
on garantias_expediente
for insert
with check (true);

create policy "update_all_garantias_v45"
on garantias_expediente
for update
using (true)
with check (true);

create policy "delete_all_garantias_v45"
on garantias_expediente
for delete
using (true);

-- Asegura columnas habituales en configuración si todavía no existen.
alter table configuracion_empresa add column if not exists condiciones_garantia text;
alter table configuracion_empresa add column if not exists pie_garantia text;
alter table configuracion_empresa add column if not exists logo_url text;
alter table configuracion_empresa add column if not exists telefono text;
alter table configuracion_empresa add column if not exists email text;
alter table configuracion_empresa add column if not exists web text;
alter table configuracion_empresa add column if not exists direccion text;
alter table configuracion_empresa add column if not exists cif text;
alter table configuracion_empresa add column if not exists nombre_comercial text;

update configuracion_empresa
set condiciones_garantia = coalesce(
  condiciones_garantia,
  'La garantía cubre exclusivamente el servicio realizado por Autokeys Lab. Quedan excluidos daños provocados por manipulación externa, averías ajenas al servicio, material aportado por el cliente, humedad, sulfatación, golpes, cortocircuitos o instalaciones defectuosas. La garantía queda registrada en el expediente interno.'
),
pie_garantia = coalesce(
  pie_garantia,
  'Documento generado por Autokeys Core. Conserve este justificante junto a la factura o presupuesto asociado.'
)
where true;

-- Función simple para updated_at.
create or replace function set_garantias_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_garantias_updated_at on garantias_expediente;
create trigger trg_garantias_updated_at
before update on garantias_expediente
for each row execute function set_garantias_updated_at();
