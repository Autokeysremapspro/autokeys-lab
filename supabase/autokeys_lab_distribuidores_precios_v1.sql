-- AUTOKEYS LAB - Precios manuales por distribuidor (v1)
-- Cada distribuidor puede tener un precio distinto por tipo de servicio
-- (Stage 1, DPF OFF, etc.) en vez de un único % de descuento general.

create table if not exists public.distribuidor_precios (
  id uuid primary key default gen_random_uuid(),
  distribuidor_id uuid not null references public.akcloud_distribuidores(id) on delete cascade,
  servicio text not null,
  precio numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (distribuidor_id, servicio)
);
create index if not exists distribuidor_precios_dist_idx on public.distribuidor_precios(distribuidor_id);

alter table public.distribuidor_precios enable row level security;

drop policy if exists "precios_own_select" on public.distribuidor_precios;
create policy "precios_own_select" on public.distribuidor_precios
  for select to authenticated
  using (exists (select 1 from public.akcloud_distribuidores d where d.id = distribuidor_id and d.auth_user_id = auth.uid()));

-- La escritura y la lectura administrativa se hacen desde las rutas server
-- de Core con SUPABASE_SERVICE_ROLE_KEY, igual que el resto de tablas de
-- distribuidores.
