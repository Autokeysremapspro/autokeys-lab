-- AK Cloud Admin v7.1 - Reglas de precios y packs
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.akcloud_reglas_precios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  servicio_principal_slug text not null,
  servicios_gratis text[] not null default '{}',
  descuentos jsonb not null default '{}'::jsonb,
  solo_planes text[] not null default '{}',
  solo_distribuidores uuid[] not null default '{}',
  activo boolean not null default true,
  orden integer not null default 100,
  nota text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists akcloud_reglas_precios_principal_idx on public.akcloud_reglas_precios (servicio_principal_slug);
create index if not exists akcloud_reglas_precios_activo_idx on public.akcloud_reglas_precios (activo);

alter table public.akcloud_reglas_precios enable row level security;

drop policy if exists "akcloud_reglas_select_all" on public.akcloud_reglas_precios;
create policy "akcloud_reglas_select_all"
on public.akcloud_reglas_precios
for select
using (true);

drop policy if exists "akcloud_reglas_write_all" on public.akcloud_reglas_precios;
create policy "akcloud_reglas_write_all"
on public.akcloud_reglas_precios
for all
using (true)
with check (true);

insert into public.akcloud_reglas_precios (nombre, servicio_principal_slug, servicios_gratis, activo, orden, nota)
values
  ('Stage 1 incluye extras básicos', 'stage-1', array['egr-off','start-stop-off'], true, 10, 'Regla inicial: al contratar Stage 1, estos extras aparecen a 0 €.'),
  ('Stage 2 incluye opciones racing', 'stage-2', array['hardcut','launch-control'], true, 20, 'Regla inicial: al contratar Stage 2, estos extras aparecen incluidos.')
on conflict do nothing;
