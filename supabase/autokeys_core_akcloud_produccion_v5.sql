-- =========================================================
-- AUTOKEYS CORE · AK CLOUD PRODUCCIÓN v5
-- Centro de producción / Kanban interno para pedidos File Service
-- =========================================================

alter table if exists file_service_pedidos
add column if not exists tecnico_asignado text,
add column if not exists iniciado_at timestamptz,
add column if not exists finalizado_at timestamptz,
add column if not exists tiempo_estimado_min integer,
add column if not exists notas_produccion text;

create index if not exists idx_file_service_pedidos_produccion_estado
on file_service_pedidos(estado, prioridad, created_at);

create index if not exists idx_file_service_pedidos_tecnico
on file_service_pedidos(tecnico_asignado);

-- Si no existe la tabla de notificaciones de AK Cloud, la creamos de forma segura.
create table if not exists ak_notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  pedido_id uuid,
  tipo text,
  titulo text,
  mensaje text,
  leida boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_ak_notificaciones_user_id on ak_notificaciones(user_id, leida, created_at desc);
create index if not exists idx_ak_notificaciones_pedido_id on ak_notificaciones(pedido_id);

alter table ak_notificaciones enable row level security;

drop policy if exists "ak_notificaciones_all_v5" on ak_notificaciones;
create policy "ak_notificaciones_all_v5"
on ak_notificaciones
for all
using (true)
with check (true);
