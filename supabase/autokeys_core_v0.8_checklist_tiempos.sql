-- =========================================================
-- AUTOKEYS CORE v0.8
-- Checklist persistente + cronómetro de trabajo
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists expediente_checklist (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references expedientes(id) on delete cascade,
  titulo text not null,
  descripcion text,
  orden int default 999,
  completado boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists expediente_tiempos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references expedientes(id) on delete cascade,
  usuario text default 'Autokeys Core',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds int default 0,
  notas text,
  created_at timestamptz default now()
);

create index if not exists idx_expediente_checklist_expediente on expediente_checklist(expediente_id);
create index if not exists idx_expediente_tiempos_expediente on expediente_tiempos(expediente_id);

alter table expediente_checklist enable row level security;
alter table expediente_tiempos enable row level security;

drop policy if exists "select_all" on expediente_checklist;
drop policy if exists "insert_all" on expediente_checklist;
drop policy if exists "update_all" on expediente_checklist;
drop policy if exists "delete_all" on expediente_checklist;

create policy "select_all" on expediente_checklist for select using (true);
create policy "insert_all" on expediente_checklist for insert with check (true);
create policy "update_all" on expediente_checklist for update using (true);
create policy "delete_all" on expediente_checklist for delete using (true);

drop policy if exists "select_all" on expediente_tiempos;
drop policy if exists "insert_all" on expediente_tiempos;
drop policy if exists "update_all" on expediente_tiempos;
drop policy if exists "delete_all" on expediente_tiempos;

create policy "select_all" on expediente_tiempos for select using (true);
create policy "insert_all" on expediente_tiempos for insert with check (true);
create policy "update_all" on expediente_tiempos for update using (true);
create policy "delete_all" on expediente_tiempos for delete using (true);
