-- =========================================================
-- AUTOKEYS CORE v2.3
-- Auditoría / Registro de actividad
-- =========================================================

create table if not exists auditoria_eventos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid null,
  usuario_nombre text null,
  usuario_email text null,
  accion text not null,
  modulo text not null,
  entidad_tipo text null,
  entidad_id text null,
  entidad_resumen text null,
  descripcion text null,
  severidad text not null default 'info',
  ip text null,
  user_agent text null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table auditoria_eventos enable row level security;

drop policy if exists "select_all" on auditoria_eventos;
drop policy if exists "insert_all" on auditoria_eventos;
drop policy if exists "update_all" on auditoria_eventos;
drop policy if exists "delete_all" on auditoria_eventos;

create policy "select_all" on auditoria_eventos for select using (true);
create policy "insert_all" on auditoria_eventos for insert with check (true);
create policy "update_all" on auditoria_eventos for update using (true);
create policy "delete_all" on auditoria_eventos for delete using (true);

create index if not exists idx_auditoria_eventos_created_at on auditoria_eventos(created_at desc);
create index if not exists idx_auditoria_eventos_modulo on auditoria_eventos(modulo);
create index if not exists idx_auditoria_eventos_severidad on auditoria_eventos(severidad);
create index if not exists idx_auditoria_eventos_entidad on auditoria_eventos(entidad_tipo, entidad_id);

create or replace function registrar_auditoria(
  p_accion text,
  p_modulo text,
  p_entidad_tipo text default null,
  p_entidad_id text default null,
  p_entidad_resumen text default null,
  p_descripcion text default null,
  p_severidad text default 'info',
  p_metadata jsonb default '{}'::jsonb
)
returns uuid as $$
declare
  v_id uuid;
begin
  insert into auditoria_eventos (
    accion,
    modulo,
    entidad_tipo,
    entidad_id,
    entidad_resumen,
    descripcion,
    severidad,
    metadata
  ) values (
    p_accion,
    p_modulo,
    p_entidad_tipo,
    p_entidad_id,
    p_entidad_resumen,
    p_descripcion,
    coalesce(p_severidad, 'info'),
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_id;

  return v_id;
end;
$$ language plpgsql security definer;

-- Eventos iniciales para confirmar que el módulo funciona.
insert into auditoria_eventos (accion, modulo, entidad_tipo, entidad_resumen, descripcion, severidad)
values
('Módulo de auditoría instalado', 'Sistema', 'migracion', 'Autokeys Core v2.3', 'Se activó el registro de actividad del ERP.', 'success')
on conflict do nothing;
