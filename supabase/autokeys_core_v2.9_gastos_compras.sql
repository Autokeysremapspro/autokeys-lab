-- ============================================================
-- AUTOKEYS CORE v2.9
-- Gastos / Compras
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default current_date,
  concepto text not null,
  categoria text not null default 'otros',
  proveedor text,
  factura_numero text,
  base_imponible numeric(10,2) not null default 0,
  iva_porcentaje numeric(5,2) not null default 21,
  iva_importe numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  metodo_pago text default 'transferencia',
  estado text not null default 'pagado',
  notas text,
  adjunto_url text,
  creado_por text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table gastos add column if not exists fecha date not null default current_date;
alter table gastos add column if not exists concepto text;
alter table gastos add column if not exists categoria text not null default 'otros';
alter table gastos add column if not exists proveedor text;
alter table gastos add column if not exists factura_numero text;
alter table gastos add column if not exists base_imponible numeric(10,2) not null default 0;
alter table gastos add column if not exists iva_porcentaje numeric(5,2) not null default 21;
alter table gastos add column if not exists iva_importe numeric(10,2) not null default 0;
alter table gastos add column if not exists total numeric(10,2) not null default 0;
alter table gastos add column if not exists metodo_pago text default 'transferencia';
alter table gastos add column if not exists estado text not null default 'pagado';
alter table gastos add column if not exists notas text;
alter table gastos add column if not exists adjunto_url text;
alter table gastos add column if not exists creado_por text;
alter table gastos add column if not exists created_at timestamptz default now();
alter table gastos add column if not exists updated_at timestamptz default now();

create index if not exists idx_gastos_fecha on gastos(fecha);
create index if not exists idx_gastos_categoria on gastos(categoria);
create index if not exists idx_gastos_estado on gastos(estado);
create index if not exists idx_gastos_proveedor on gastos(proveedor);

create or replace function set_gastos_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_gastos_updated_at on gastos;
create trigger trigger_gastos_updated_at
before update on gastos
for each row execute function set_gastos_updated_at();

alter table gastos enable row level security;

drop policy if exists "select_all" on gastos;
drop policy if exists "insert_all" on gastos;
drop policy if exists "update_all" on gastos;
drop policy if exists "delete_all" on gastos;

create policy "select_all" on gastos for select using (true);
create policy "insert_all" on gastos for insert with check (true);
create policy "update_all" on gastos for update using (true) with check (true);
create policy "delete_all" on gastos for delete using (true);

-- Integración opcional con auditoría si existe la función.
do $$
begin
  if exists (select 1 from pg_proc where proname = 'registrar_auditoria') then
    perform registrar_auditoria(
      'sistema',
      'migracion',
      'gastos',
      null,
      'Módulo de gastos/compras v2.9 instalado',
      'info'
    );
  end if;
exception when others then
  null;
end $$;
