-- =========================================================
-- AUTOKEYS CORE v2.4
-- Centro de notificaciones persistente
-- =========================================================

create table if not exists notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid null,
  titulo text not null,
  mensaje text null,
  modulo text null,
  tipo text not null default 'info',
  prioridad text not null default 'normal',
  href text null,
  accion_texto text null,
  leida boolean not null default false,
  read_at timestamptz null,
  expires_at timestamptz null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table notificaciones enable row level security;

drop policy if exists "select_all" on notificaciones;
drop policy if exists "insert_all" on notificaciones;
drop policy if exists "update_all" on notificaciones;
drop policy if exists "delete_all" on notificaciones;

create policy "select_all" on notificaciones for select using (true);
create policy "insert_all" on notificaciones for insert with check (true);
create policy "update_all" on notificaciones for update using (true);
create policy "delete_all" on notificaciones for delete using (true);

create index if not exists idx_notificaciones_created_at on notificaciones(created_at desc);
create index if not exists idx_notificaciones_leida on notificaciones(leida);
create index if not exists idx_notificaciones_modulo on notificaciones(modulo);
create index if not exists idx_notificaciones_tipo on notificaciones(tipo);
create index if not exists idx_notificaciones_prioridad on notificaciones(prioridad);

create or replace function crear_notificacion(
  p_titulo text,
  p_mensaje text default null,
  p_modulo text default null,
  p_tipo text default 'info',
  p_prioridad text default 'normal',
  p_href text default null,
  p_accion_texto text default null,
  p_usuario_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid as $$
declare
  v_id uuid;
begin
  insert into notificaciones (
    usuario_id,
    titulo,
    mensaje,
    modulo,
    tipo,
    prioridad,
    href,
    accion_texto,
    metadata
  ) values (
    p_usuario_id,
    p_titulo,
    p_mensaje,
    p_modulo,
    coalesce(p_tipo, 'info'),
    coalesce(p_prioridad, 'normal'),
    p_href,
    p_accion_texto,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_id;

  return v_id;
end;
$$ language plpgsql security definer;

insert into notificaciones (titulo, mensaje, modulo, tipo, prioridad, href, accion_texto)
values (
  'Centro de notificaciones activado',
  'Autokeys Core ya puede registrar avisos persistentes para usuarios, stock, facturas, File Service y sistema.',
  'Sistema',
  'success',
  'normal',
  '/notificaciones',
  'Abrir avisos'
);
