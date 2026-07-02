-- =========================================================
-- AUTOKEYS CORE v2.5
-- Backups / Exportación
-- =========================================================

create table if not exists backup_registros (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  formato text not null default 'json',
  tablas text[] default '{}',
  descripcion text,
  total_registros int default 0,
  creado_por text,
  created_at timestamptz default now()
);

alter table backup_registros enable row level security;

drop policy if exists "select_all" on backup_registros;
drop policy if exists "insert_all" on backup_registros;
drop policy if exists "update_all" on backup_registros;
drop policy if exists "delete_all" on backup_registros;

create policy "select_all" on backup_registros for select using (true);
create policy "insert_all" on backup_registros for insert with check (true);
create policy "update_all" on backup_registros for update using (true);
create policy "delete_all" on backup_registros for delete using (true);

create index if not exists idx_backup_registros_created_at on backup_registros(created_at desc);
create index if not exists idx_backup_registros_tipo on backup_registros(tipo);

create or replace function registrar_backup(
  p_tipo text,
  p_formato text,
  p_tablas text[],
  p_descripcion text,
  p_total_registros int default 0,
  p_creado_por text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  nuevo_id uuid;
begin
  insert into backup_registros (tipo, formato, tablas, descripcion, total_registros, creado_por)
  values (p_tipo, p_formato, p_tablas, p_descripcion, p_total_registros, p_creado_por)
  returning id into nuevo_id;

  return nuevo_id;
end;
$$;
