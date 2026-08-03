-- AK Cloud V2: precio editable, versiones y cierre manual
alter table if exists public.file_service_pedidos
  add column if not exists precio_inicial numeric(10,2),
  add column if not exists precio_final numeric(10,2),
  add column if not exists precio_motivo text,
  add column if not exists version_final_id uuid,
  add column if not exists finalizado_at timestamptz,
  add column if not exists legal_aceptado boolean not null default false,
  add column if not exists legal_version text,
  add column if not exists legal_aceptado_at timestamptz,
  add column if not exists legal_ip text;

update public.file_service_pedidos set precio_inicial = coalesce(precio_inicial, precio), precio_final = coalesce(precio_final, precio) where precio is not null;

create table if not exists public.file_service_versiones (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.file_service_pedidos(id) on delete cascade,
  numero_version integer not null,
  nombre_archivo text not null,
  bucket text not null default 'file-service',
  path text not null,
  size_bytes bigint,
  nota_cliente text,
  nota_interna text,
  es_final boolean not null default false,
  estado text not null default 'disponible_prueba',
  created_by text,
  created_at timestamptz not null default now(),
  unique(pedido_id, numero_version)
);
create index if not exists idx_file_service_versiones_pedido on public.file_service_versiones(pedido_id, numero_version desc);
alter table public.file_service_versiones enable row level security;
drop policy if exists versiones_usuario_lectura on public.file_service_versiones;
create policy versiones_usuario_lectura on public.file_service_versiones for select using (exists(select 1 from public.file_service_pedidos p where p.id=pedido_id and (p.user_id=auth.uid() or auth.role()='service_role')));

-- Permisos para el ERP y el portal autenticado.
-- La propiedad real del pedido sigue validándose para la lectura del cliente.
drop policy if exists versiones_autenticado_insertar on public.file_service_versiones;
create policy versiones_autenticado_insertar
on public.file_service_versiones for insert
to authenticated
with check (true);

drop policy if exists versiones_autenticado_actualizar on public.file_service_versiones;
create policy versiones_autenticado_actualizar
on public.file_service_versiones for update
to authenticated
using (true)
with check (true);

drop policy if exists versiones_autenticado_eliminar on public.file_service_versiones;
create policy versiones_autenticado_eliminar
on public.file_service_versiones for delete
to authenticated
using (true);

-- Garantiza que una versión final por pedido sea única a nivel de base de datos.
create unique index if not exists idx_file_service_version_unica_final
on public.file_service_versiones(pedido_id)
where es_final = true;
