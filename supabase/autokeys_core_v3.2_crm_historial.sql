-- AUTOKEYS CORE v3.2 - CRM + Historial técnico

alter table clientes
  add column if not exists tipo_cliente text default 'normal',
  add column if not exists estado_cliente text default 'activo',
  add column if not exists descuento_porcentaje numeric(5,2) default 0,
  add column if not exists limite_credito numeric(10,2) default 0,
  add column if not exists notas_privadas text,
  add column if not exists ultima_visita timestamptz;

create table if not exists cliente_notas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  titulo text,
  nota text not null,
  tipo text default 'general',
  importante boolean default false,
  creado_por text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cliente_documentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  nombre text not null,
  tipo text default 'documento',
  url text,
  notas text,
  created_at timestamptz default now()
);

create or replace view crm_clientes_resumen as
select
  c.id,
  c.nombre,
  c.telefono,
  c.email,
  c.nif,
  c.tipo_cliente,
  c.estado_cliente,
  c.descuento_porcentaje,
  c.ultima_visita,
  c.created_at,
  count(distinct v.id) as vehiculos_count,
  count(distinct e.id) as expedientes_count,
  coalesce(sum(distinct f.total), 0) as total_facturado,
  coalesce(sum(distinct case when f.estado = 'pendiente' then f.total else 0 end), 0) as pendiente_cobro
from clientes c
left join vehiculos v on v.cliente_id = c.id
left join expedientes e on e.cliente_id = c.id
left join facturas f on f.cliente_id = c.id
group by c.id;

create or replace view crm_vehiculos_historial as
select
  v.id as vehiculo_id,
  v.cliente_id,
  v.marca,
  v.modelo,
  v.motor,
  v.matricula,
  v.bastidor,
  v.ecu,
  e.id as expediente_id,
  e.numero_ot,
  e.tipo_trabajo,
  e.estado,
  e.prioridad,
  e.fecha_entrada,
  e.fecha_entrega,
  e.precio_final,
  e.created_at
from vehiculos v
left join expedientes e on e.vehiculo_id = v.id;

alter table cliente_notas enable row level security;
alter table cliente_documentos enable row level security;

drop policy if exists "select_all" on cliente_notas;
drop policy if exists "insert_all" on cliente_notas;
drop policy if exists "update_all" on cliente_notas;
drop policy if exists "delete_all" on cliente_notas;
create policy "select_all" on cliente_notas for select using (true);
create policy "insert_all" on cliente_notas for insert with check (true);
create policy "update_all" on cliente_notas for update using (true);
create policy "delete_all" on cliente_notas for delete using (true);

drop policy if exists "select_all" on cliente_documentos;
drop policy if exists "insert_all" on cliente_documentos;
drop policy if exists "update_all" on cliente_documentos;
drop policy if exists "delete_all" on cliente_documentos;
create policy "select_all" on cliente_documentos for select using (true);
create policy "insert_all" on cliente_documentos for insert with check (true);
create policy "update_all" on cliente_documentos for update using (true);
create policy "delete_all" on cliente_documentos for delete using (true);
