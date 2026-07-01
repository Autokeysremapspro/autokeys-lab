-- AUTOKEYS LAB V2 - TABLAS TÉCNICAS PARA OT
create table if not exists expediente_ecu (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete cascade unique,
  marca_ecu text,
  modelo_ecu text,
  hw text,
  sw text,
  vin_original text,
  vin_nuevo text,
  cvn text,
  password text,
  pin text,
  cs text,
  mac text,
  isn text,
  estado_immo text,
  stage text,
  dpf text,
  egr text,
  adblue text,
  checksum text,
  lectura text,
  herramienta text,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expediente_llaves (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete cascade unique,
  llaves_originales int default 0,
  llaves_programadas int default 0,
  tipo_llave text,
  frecuencia text,
  transponder text,
  mando text,
  plataforma text,
  pin text,
  cs text,
  mac text,
  isn text,
  estado text,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expediente_historial (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references expedientes(id) on delete cascade,
  evento text not null,
  descripcion text,
  usuario text,
  created_at timestamptz default now()
);

alter table expediente_ecu enable row level security;
alter table expediente_llaves enable row level security;
alter table expediente_historial enable row level security;

drop policy if exists "usuarios autenticados expediente_ecu" on expediente_ecu;
drop policy if exists "usuarios autenticados expediente_llaves" on expediente_llaves;
drop policy if exists "usuarios autenticados expediente_historial" on expediente_historial;

create policy "usuarios autenticados expediente_ecu" on expediente_ecu for all to authenticated using (true) with check (true);
create policy "usuarios autenticados expediente_llaves" on expediente_llaves for all to authenticated using (true) with check (true);
create policy "usuarios autenticados expediente_historial" on expediente_historial for all to authenticated using (true) with check (true);

create index if not exists idx_expediente_ecu_expediente on expediente_ecu(expediente_id);
create index if not exists idx_expediente_llaves_expediente on expediente_llaves(expediente_id);
create index if not exists idx_expediente_historial_expediente on expediente_historial(expediente_id);
