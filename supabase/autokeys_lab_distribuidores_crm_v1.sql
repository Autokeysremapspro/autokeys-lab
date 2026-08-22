-- AUTOKEYS LAB - Distribuidores CRM (v1)
-- Amplía akcloud_distribuidores con datos comerciales para la vista interna
-- /distribuidores del ERP, y añade tickets de soporte por distribuidor.
-- El negocio se factura por archivo (no por planes/suscripciones): los
-- pedidos y la facturación de cada distribuidor se calculan a partir de sus
-- ventas reales en `file_service` (columna `taller`), no de una tabla aparte.
-- Cambios puramente aditivos (columnas nuevas con default, tabla nueva).

alter table public.akcloud_distribuidores
  add column if not exists nivel text not null default 'Bronze' check (nivel in ('Platinum','Gold','Silver','Bronze')),
  add column if not exists descuento_porcentaje numeric(5,2) not null default 0,
  add column if not exists comision_porcentaje numeric(5,2) not null default 0,
  add column if not exists limite_credito numeric(10,2) not null default 0,
  add column if not exists ciudad text,
  add column if not exists pais text,
  add column if not exists comercial_nombre text,
  add column if not exists comercial_telefono text,
  add column if not exists comercial_email text;

create table if not exists public.distribuidor_tickets (
  id uuid primary key default gen_random_uuid(),
  distribuidor_id uuid not null references public.akcloud_distribuidores(id) on delete cascade,
  numero text,
  asunto text not null,
  estado text not null default 'abierto' check (estado in ('abierto','en_curso','cerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists distribuidor_tickets_dist_idx on public.distribuidor_tickets(distribuidor_id, created_at desc);

alter table public.distribuidor_tickets enable row level security;

drop policy if exists "tickets_own_select" on public.distribuidor_tickets;
create policy "tickets_own_select" on public.distribuidor_tickets
  for select to authenticated
  using (exists (select 1 from public.akcloud_distribuidores d where d.id = distribuidor_id and d.auth_user_id = auth.uid()));

-- La escritura y la lectura administrativa (todas las filas, todos los
-- distribuidores) se hacen desde las rutas server de Core con
-- SUPABASE_SERVICE_ROLE_KEY, igual que el resto de tablas de distribuidores.
