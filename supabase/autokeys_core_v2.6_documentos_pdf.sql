-- =========================================================
-- AUTOKEYS CORE v2.6 - Soporte configuración documental
-- FIX compatible con tablas configuracion_empresa existentes
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists configuracion_empresa (
  id uuid primary key default gen_random_uuid(),
  nombre_comercial text default 'Autokeys Lab',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Añadir columnas que puedan faltar en instalaciones anteriores
alter table configuracion_empresa add column if not exists razon_social text;
alter table configuracion_empresa add column if not exists cif text;
alter table configuracion_empresa add column if not exists direccion text;
alter table configuracion_empresa add column if not exists codigo_postal text;
alter table configuracion_empresa add column if not exists poblacion text;
alter table configuracion_empresa add column if not exists provincia text;
alter table configuracion_empresa add column if not exists pais text default 'España';
alter table configuracion_empresa add column if not exists telefono text;
alter table configuracion_empresa add column if not exists whatsapp text;
alter table configuracion_empresa add column if not exists email text;
alter table configuracion_empresa add column if not exists web text;
alter table configuracion_empresa add column if not exists logo_url text;
alter table configuracion_empresa add column if not exists iva_defecto numeric(5,2) default 21;
alter table configuracion_empresa add column if not exists pie_factura text;
alter table configuracion_empresa add column if not exists texto_legal text;
alter table configuracion_empresa add column if not exists texto_garantia text;
alter table configuracion_empresa add column if not exists created_at timestamptz default now();
alter table configuracion_empresa add column if not exists updated_at timestamptz default now();

alter table configuracion_empresa enable row level security;

drop policy if exists "select_all_configuracion_empresa" on configuracion_empresa;
drop policy if exists "insert_all_configuracion_empresa" on configuracion_empresa;
drop policy if exists "update_all_configuracion_empresa" on configuracion_empresa;
drop policy if exists "delete_all_configuracion_empresa" on configuracion_empresa;

create policy "select_all_configuracion_empresa"
on configuracion_empresa for select using (true);

create policy "insert_all_configuracion_empresa"
on configuracion_empresa for insert with check (true);

create policy "update_all_configuracion_empresa"
on configuracion_empresa for update using (true);

create policy "delete_all_configuracion_empresa"
on configuracion_empresa for delete using (true);

insert into configuracion_empresa (nombre_comercial, pais, iva_defecto, pie_factura)
select 'Autokeys Lab', 'España', 21, 'Gracias por confiar en Autokeys Lab.'
where not exists (select 1 from configuracion_empresa);

-- =========================================================
-- FIN v2.6 FIX
-- =========================================================
