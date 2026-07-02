-- ===========================================================
-- AUTOKEYS CORE v1.6
-- BIBLIOTECA TÉCNICA
-- ===========================================================

create table if not exists casos_tecnicos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete set null,
  cliente_id uuid references clientes(id) on delete set null,
  vehiculo_id uuid references vehiculos(id) on delete set null,

  titulo text not null,
  categoria text default 'averia',

  marca text,
  modelo text,
  motor text,
  matricula text,
  bastidor text,

  ecu text,
  hw text,
  sw text,
  dtc text,

  sintomas text,
  diagnostico text,
  solucion text,
  herramientas text,
  archivos_resumen text,

  tiempo_estimado numeric(10,2),
  tiempo_real numeric(10,2),

  tags text[] default '{}',
  publico boolean default false,
  destacado boolean default false,
  created_by text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table casos_tecnicos add column if not exists expediente_id uuid references expedientes(id) on delete set null;
alter table casos_tecnicos add column if not exists cliente_id uuid references clientes(id) on delete set null;
alter table casos_tecnicos add column if not exists vehiculo_id uuid references vehiculos(id) on delete set null;
alter table casos_tecnicos add column if not exists titulo text;
alter table casos_tecnicos add column if not exists categoria text default 'averia';
alter table casos_tecnicos add column if not exists marca text;
alter table casos_tecnicos add column if not exists modelo text;
alter table casos_tecnicos add column if not exists motor text;
alter table casos_tecnicos add column if not exists matricula text;
alter table casos_tecnicos add column if not exists bastidor text;
alter table casos_tecnicos add column if not exists ecu text;
alter table casos_tecnicos add column if not exists hw text;
alter table casos_tecnicos add column if not exists sw text;
alter table casos_tecnicos add column if not exists dtc text;
alter table casos_tecnicos add column if not exists sintomas text;
alter table casos_tecnicos add column if not exists diagnostico text;
alter table casos_tecnicos add column if not exists solucion text;
alter table casos_tecnicos add column if not exists herramientas text;
alter table casos_tecnicos add column if not exists archivos_resumen text;
alter table casos_tecnicos add column if not exists tiempo_estimado numeric(10,2);
alter table casos_tecnicos add column if not exists tiempo_real numeric(10,2);
alter table casos_tecnicos add column if not exists tags text[] default '{}';
alter table casos_tecnicos add column if not exists publico boolean default false;
alter table casos_tecnicos add column if not exists destacado boolean default false;
alter table casos_tecnicos add column if not exists created_by text;
alter table casos_tecnicos add column if not exists created_at timestamptz default now();
alter table casos_tecnicos add column if not exists updated_at timestamptz default now();

create index if not exists idx_casos_tecnicos_titulo on casos_tecnicos(titulo);
create index if not exists idx_casos_tecnicos_categoria on casos_tecnicos(categoria);
create index if not exists idx_casos_tecnicos_ecu on casos_tecnicos(ecu);
create index if not exists idx_casos_tecnicos_hw on casos_tecnicos(hw);
create index if not exists idx_casos_tecnicos_sw on casos_tecnicos(sw);
create index if not exists idx_casos_tecnicos_matricula on casos_tecnicos(matricula);
create index if not exists idx_casos_tecnicos_tags on casos_tecnicos using gin(tags);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists casos_tecnicos_updated_at on casos_tecnicos;
create trigger casos_tecnicos_updated_at
before update on casos_tecnicos
for each row execute function set_updated_at();

alter table casos_tecnicos enable row level security;

drop policy if exists "select_all" on casos_tecnicos;
drop policy if exists "insert_all" on casos_tecnicos;
drop policy if exists "update_all" on casos_tecnicos;
drop policy if exists "delete_all" on casos_tecnicos;

create policy "select_all" on casos_tecnicos for select using (true);
create policy "insert_all" on casos_tecnicos for insert with check (true);
create policy "update_all" on casos_tecnicos for update using (true);
create policy "delete_all" on casos_tecnicos for delete using (true);
