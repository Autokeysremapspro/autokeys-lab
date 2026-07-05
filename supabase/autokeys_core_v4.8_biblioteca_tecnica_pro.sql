-- AUTOKEYS CORE v4.8 - Biblioteca Técnica PRO

create table if not exists biblioteca_tecnica (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  marca text,
  modelo text,
  motor text,
  anio int,
  ecu text,
  hardware text,
  software text,
  tipo_trabajo text,
  herramienta text,
  dificultad int default 1,
  tiempo_minutos int default 0,
  sintomas text,
  solucion text,
  notas text,
  tags text[] default '{}',
  destacado boolean default false,
  solucion_definitiva boolean default false,
  expediente_id uuid references expedientes(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table biblioteca_tecnica enable row level security;

drop policy if exists "select_all_biblioteca_v48" on biblioteca_tecnica;
drop policy if exists "insert_all_biblioteca_v48" on biblioteca_tecnica;
drop policy if exists "update_all_biblioteca_v48" on biblioteca_tecnica;
drop policy if exists "delete_all_biblioteca_v48" on biblioteca_tecnica;

create policy "select_all_biblioteca_v48" on biblioteca_tecnica for select using (true);
create policy "insert_all_biblioteca_v48" on biblioteca_tecnica for insert with check (true);
create policy "update_all_biblioteca_v48" on biblioteca_tecnica for update using (true);
create policy "delete_all_biblioteca_v48" on biblioteca_tecnica for delete using (true);

create index if not exists idx_biblioteca_tecnica_ecu on biblioteca_tecnica(ecu);
create index if not exists idx_biblioteca_tecnica_hw on biblioteca_tecnica(hardware);
create index if not exists idx_biblioteca_tecnica_sw on biblioteca_tecnica(software);
create index if not exists idx_biblioteca_tecnica_tipo on biblioteca_tecnica(tipo_trabajo);
create index if not exists idx_biblioteca_tecnica_tags on biblioteca_tecnica using gin(tags);

create or replace function set_biblioteca_tecnica_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists biblioteca_tecnica_updated_at on biblioteca_tecnica;
create trigger biblioteca_tecnica_updated_at
before update on biblioteca_tecnica
for each row execute function set_biblioteca_tecnica_updated_at();
