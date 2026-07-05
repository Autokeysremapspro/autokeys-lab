-- ==========================================================
-- AUTOKEYS CORE x AK CLOUD SYNC v4
-- Facturación de recargas desde Autokeys Core
-- ==========================================================

create table if not exists ak_creditos_recargas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  nombre_cliente text null,
  email_cliente text null,
  creditos numeric default 0,
  importe numeric default 0,
  metodo_pago text null,
  estado text default 'pendiente',
  referencia_pago text null,
  notas_cliente text null,
  notas_admin text null,
  aprobada_at timestamptz null,
  core_factura_id uuid null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ak_creditos_recargas add column if not exists core_factura_id uuid null;
alter table ak_creditos_recargas add column if not exists updated_at timestamptz default now();
alter table ak_creditos_recargas add column if not exists aprobada_at timestamptz null;
alter table ak_creditos_recargas add column if not exists notas_admin text null;

create index if not exists idx_ak_recargas_core_factura_id on ak_creditos_recargas(core_factura_id);
create index if not exists idx_ak_recargas_estado_facturacion on ak_creditos_recargas(estado, created_at desc);

alter table ak_creditos_recargas enable row level security;

drop policy if exists "ak_creditos_recargas_all_core_v4" on ak_creditos_recargas;
create policy "ak_creditos_recargas_all_core_v4"
on ak_creditos_recargas
for all
using (true)
with check (true);
