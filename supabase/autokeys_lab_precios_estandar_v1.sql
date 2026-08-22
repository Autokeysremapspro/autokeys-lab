-- AUTOKEYS LAB - Tarifa estándar (v1)
-- Precio "de catálogo" por servicio, visible para todos los distribuidores
-- autenticados. Un distribuidor concreto puede tener un precio distinto en
-- distribuidor_precios (creado en autokeys_lab_distribuidores_precios_v1);
-- si no lo tiene, ve este precio estándar.

create table if not exists public.precios_estandar (
  id uuid primary key default gen_random_uuid(),
  servicio text not null unique,
  precio numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.precios_estandar enable row level security;

drop policy if exists "precios_estandar_select_authenticated" on public.precios_estandar;
create policy "precios_estandar_select_authenticated" on public.precios_estandar
  for select to authenticated
  using (true);

-- La escritura se hace desde rutas server de Core con SUPABASE_SERVICE_ROLE_KEY.
