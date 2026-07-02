-- =========================================================
-- AUTOKEYS CORE v2.7 - PLANTILLAS DE DOCUMENTOS
-- =========================================================

create extension if not exists "pgcrypto";

-- Tabla de plantillas por tipo de documento
create table if not exists plantillas_documentos (
  id uuid primary key default gen_random_uuid(),
  tipo_documento text not null unique,
  nombre text not null,
  color_principal text default '#DC2626',
  mostrar_logo boolean default true,
  mostrar_sello boolean default false,
  texto_cabecera text,
  texto_pie text,
  condiciones_legales text,
  garantia text,
  observaciones_defecto text,
  formato text default 'a4',
  activo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Configuración extra en empresa, por si la tabla ya existe con menos columnas
alter table configuracion_empresa add column if not exists logo_url text;
alter table configuracion_empresa add column if not exists logo_oscuro_url text;
alter table configuracion_empresa add column if not exists sello_url text;
alter table configuracion_empresa add column if not exists color_principal text default '#DC2626';
alter table configuracion_empresa add column if not exists color_secundario text default '#111827';
alter table configuracion_empresa add column if not exists mostrar_logo_documentos boolean default true;
alter table configuracion_empresa add column if not exists mostrar_sello_documentos boolean default false;
alter table configuracion_empresa add column if not exists texto_garantia text;
alter table configuracion_empresa add column if not exists condiciones_legales text;
alter table configuracion_empresa add column if not exists observaciones_documentos text;
alter table configuracion_empresa add column if not exists updated_at timestamptz default now();

-- Seed de plantillas base
insert into plantillas_documentos (tipo_documento, nombre, texto_pie, condiciones_legales, garantia, observaciones_defecto, formato)
values
('factura', 'Factura A4 profesional', 'Gracias por confiar en Autokeys Lab.', 'Documento emitido conforme a la normativa vigente. Los servicios electrónicos quedan sujetos a las condiciones aceptadas por el cliente.', 'Garantía limitada al trabajo realizado por Autokeys Lab. No cubre material aportado por el cliente, manipulaciones externas ni averías ajenas al servicio.', '', 'a4'),
('presupuesto', 'Presupuesto A4 profesional', 'Presupuesto válido salvo error tipográfico o variación de material.', 'La aceptación del presupuesto implica autorización para iniciar el trabajo descrito.', '', '', 'a4'),
('albaran', 'Albarán A4 profesional', 'Mercancía/servicio entregado según detalle.', 'El cliente declara recibir el material/vehículo/servicio indicado.', '', '', 'a4'),
('ticket', 'Ticket 80mm', 'Gracias por su visita.', '', '', '', 'ticket_80')
on conflict (tipo_documento) do nothing;

-- Trigger updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists plantillas_documentos_updated_at on plantillas_documentos;
create trigger plantillas_documentos_updated_at
before update on plantillas_documentos
for each row execute function set_updated_at();

alter table plantillas_documentos enable row level security;

drop policy if exists "select_all" on plantillas_documentos;
drop policy if exists "insert_all" on plantillas_documentos;
drop policy if exists "update_all" on plantillas_documentos;
drop policy if exists "delete_all" on plantillas_documentos;

create policy "select_all" on plantillas_documentos for select using (true);
create policy "insert_all" on plantillas_documentos for insert with check (true);
create policy "update_all" on plantillas_documentos for update using (true);
create policy "delete_all" on plantillas_documentos for delete using (true);
