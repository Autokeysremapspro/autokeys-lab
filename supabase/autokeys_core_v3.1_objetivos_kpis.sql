create table if not exists objetivos_kpis (
  id uuid primary key default gen_random_uuid(),
  periodo text not null,
  anio int not null,
  mes int,
  objetivo_facturacion numeric(12,2) default 0,
  objetivo_beneficio numeric(12,2) default 0,
  objetivo_file_service int default 0,
  objetivo_ot_terminadas int default 0,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(periodo, anio, mes)
);

alter table objetivos_kpis enable row level security;

drop policy if exists "select_all" on objetivos_kpis;
drop policy if exists "insert_all" on objetivos_kpis;
drop policy if exists "update_all" on objetivos_kpis;
drop policy if exists "delete_all" on objetivos_kpis;

create policy "select_all" on objetivos_kpis for select using (true);
create policy "insert_all" on objetivos_kpis for insert with check (true);
create policy "update_all" on objetivos_kpis for update using (true);
create policy "delete_all" on objetivos_kpis for delete using (true);

create or replace function set_objetivos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists objetivos_kpis_updated_at on objetivos_kpis;
create trigger objetivos_kpis_updated_at
before update on objetivos_kpis
for each row execute function set_objetivos_updated_at();
