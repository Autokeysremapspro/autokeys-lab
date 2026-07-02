-- =========================================================
-- AUTOKEYS CORE v1.9
-- Centro de Administración / Auditoría inicial
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists auditoria_core (
  id uuid primary key default gen_random_uuid(),
  usuario text,
  usuario_id uuid,
  modulo text,
  accion text not null,
  descripcion text,
  entidad text,
  entidad_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists configuracion_notificaciones (
  id uuid primary key default gen_random_uuid(),
  clave text unique not null,
  activo boolean default true,
  descripcion text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists configuracion_permisos (
  id uuid primary key default gen_random_uuid(),
  rol text not null,
  permiso text not null,
  activo boolean default true,
  created_at timestamptz default now(),
  unique (rol, permiso)
);

insert into configuracion_notificaciones (clave, activo, descripcion)
values
('email_factura', true, 'Enviar facturas por email'),
('email_presupuesto', true, 'Enviar presupuestos por email'),
('ot_terminada', true, 'Aviso al cliente cuando una OT termina'),
('stock_bajo', true, 'Aviso interno cuando una referencia baja del mínimo'),
('file_service_pendiente', true, 'Aviso interno de file service pendiente')
on conflict (clave) do nothing;

insert into configuracion_permisos (rol, permiso, activo)
values
('admin', 'dashboard', true),
('admin', 'clientes', true),
('admin', 'vehiculos', true),
('admin', 'expedientes', true),
('admin', 'datos_tecnicos_sensibles', true),
('admin', 'facturacion', true),
('admin', 'stock', true),
('admin', 'file_service', true),
('admin', 'usuarios', true),
('admin', 'configuracion', true),
('laboratorio', 'dashboard', true),
('laboratorio', 'clientes', true),
('laboratorio', 'vehiculos', true),
('laboratorio', 'expedientes', true),
('laboratorio', 'datos_tecnicos_sensibles', true),
('laboratorio', 'facturacion', false),
('laboratorio', 'stock', true),
('laboratorio', 'file_service', true),
('laboratorio', 'usuarios', false),
('laboratorio', 'configuracion', false),
('administracion', 'dashboard', true),
('administracion', 'clientes', true),
('administracion', 'vehiculos', true),
('administracion', 'expedientes', true),
('administracion', 'datos_tecnicos_sensibles', false),
('administracion', 'facturacion', true),
('administracion', 'stock', false),
('administracion', 'file_service', false),
('administracion', 'usuarios', false),
('administracion', 'configuracion', false),
('distribuidor', 'dashboard', false),
('distribuidor', 'clientes', false),
('distribuidor', 'vehiculos', false),
('distribuidor', 'expedientes', false),
('distribuidor', 'datos_tecnicos_sensibles', false),
('distribuidor', 'facturacion', false),
('distribuidor', 'stock', false),
('distribuidor', 'file_service', true),
('distribuidor', 'usuarios', false),
('distribuidor', 'configuracion', false)
on conflict (rol, permiso) do update set activo = excluded.activo;

insert into auditoria_core (usuario, modulo, accion, descripcion)
values ('Sistema', 'Configuración', 'v1.9 instalado', 'Centro de Administración y auditoría inicial activados')
on conflict do nothing;

alter table auditoria_core enable row level security;
alter table configuracion_notificaciones enable row level security;
alter table configuracion_permisos enable row level security;

drop policy if exists "select_all" on auditoria_core;
drop policy if exists "insert_all" on auditoria_core;
drop policy if exists "update_all" on auditoria_core;
drop policy if exists "delete_all" on auditoria_core;
create policy "select_all" on auditoria_core for select using (true);
create policy "insert_all" on auditoria_core for insert with check (true);
create policy "update_all" on auditoria_core for update using (true);
create policy "delete_all" on auditoria_core for delete using (true);

drop policy if exists "select_all" on configuracion_notificaciones;
drop policy if exists "insert_all" on configuracion_notificaciones;
drop policy if exists "update_all" on configuracion_notificaciones;
drop policy if exists "delete_all" on configuracion_notificaciones;
create policy "select_all" on configuracion_notificaciones for select using (true);
create policy "insert_all" on configuracion_notificaciones for insert with check (true);
create policy "update_all" on configuracion_notificaciones for update using (true);
create policy "delete_all" on configuracion_notificaciones for delete using (true);

drop policy if exists "select_all" on configuracion_permisos;
drop policy if exists "insert_all" on configuracion_permisos;
drop policy if exists "update_all" on configuracion_permisos;
drop policy if exists "delete_all" on configuracion_permisos;
create policy "select_all" on configuracion_permisos for select using (true);
create policy "insert_all" on configuracion_permisos for insert with check (true);
create policy "update_all" on configuracion_permisos for update using (true);
create policy "delete_all" on configuracion_permisos for delete using (true);
