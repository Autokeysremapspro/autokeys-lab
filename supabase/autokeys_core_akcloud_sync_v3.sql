-- ==========================================================
-- AUTOKEYS CORE x AK CLOUD SYNC v3
-- Recargas y créditos gestionados desde Core
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

create table if not exists ak_creditos_movimientos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  tipo text not null default 'recarga',
  creditos numeric not null default 0,
  descripcion text null,
  recarga_id uuid null references ak_creditos_recargas(id) on delete set null,
  pedido_id uuid null,
  created_at timestamptz default now()
);

alter table ak_creditos_recargas add column if not exists core_factura_id uuid null;
alter table ak_creditos_recargas add column if not exists updated_at timestamptz default now();
alter table ak_creditos_recargas add column if not exists aprobada_at timestamptz null;
alter table ak_creditos_recargas add column if not exists notas_admin text null;

alter table ak_creditos_recargas enable row level security;
alter table ak_creditos_movimientos enable row level security;

drop policy if exists "ak_creditos_recargas_all_core" on ak_creditos_recargas;
create policy "ak_creditos_recargas_all_core"
on ak_creditos_recargas
for all
using (true)
with check (true);

drop policy if exists "ak_creditos_movimientos_all_core" on ak_creditos_movimientos;
create policy "ak_creditos_movimientos_all_core"
on ak_creditos_movimientos
for all
using (true)
with check (true);

create index if not exists idx_ak_recargas_estado on ak_creditos_recargas(estado);
create index if not exists idx_ak_recargas_user on ak_creditos_recargas(user_id);
create index if not exists idx_ak_movimientos_user on ak_creditos_movimientos(user_id);
