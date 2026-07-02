-- ===========================================================
-- AUTOKEYS CORE v2.2
-- AGENDA / PLANIFICADOR DEL LABORATORIO
-- ===========================================================

create table if not exists agenda_eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'cita',
  estado text not null default 'programado',
  prioridad text not null default 'normal',
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz,
  cliente_id uuid references clientes(id) on delete set null,
  vehiculo_id uuid references vehiculos(id) on delete set null,
  expediente_id uuid references expedientes(id) on delete set null,
  tecnico text,
  ubicacion text,
  notas text,
  recordatorio_minutos int default 60,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_agenda_eventos_fecha_inicio on agenda_eventos(fecha_inicio);
create index if not exists idx_agenda_eventos_estado on agenda_eventos(estado);
create index if not exists idx_agenda_eventos_tipo on agenda_eventos(tipo);
create index if not exists idx_agenda_eventos_cliente on agenda_eventos(cliente_id);
create index if not exists idx_agenda_eventos_vehiculo on agenda_eventos(vehiculo_id);
create index if not exists idx_agenda_eventos_expediente on agenda_eventos(expediente_id);

create or replace function set_agenda_eventos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_agenda_eventos_updated_at on agenda_eventos;
create trigger trigger_agenda_eventos_updated_at
before update on agenda_eventos
for each row execute function set_agenda_eventos_updated_at();

alter table agenda_eventos enable row level security;

drop policy if exists "select_all" on agenda_eventos;
drop policy if exists "insert_all" on agenda_eventos;
drop policy if exists "update_all" on agenda_eventos;
drop policy if exists "delete_all" on agenda_eventos;

create policy "select_all" on agenda_eventos for select using (true);
create policy "insert_all" on agenda_eventos for insert with check (true);
create policy "update_all" on agenda_eventos for update using (true);
create policy "delete_all" on agenda_eventos for delete using (true);

-- Datos de ejemplo seguros: solo se insertan si la tabla está vacía.
insert into agenda_eventos (titulo, tipo, estado, prioridad, fecha_inicio, fecha_fin, tecnico, ubicacion, notas)
select 'Recepción vehículo cliente', 'recepcion', 'programado', 'normal', now() + interval '1 day', now() + interval '1 day' + interval '45 minutes', 'Ana', 'Recepción', 'Cita de ejemplo para validar la agenda.'
where not exists (select 1 from agenda_eventos);
