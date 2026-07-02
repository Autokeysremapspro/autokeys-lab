-- =========================================================
-- AUTOKEYS CORE v2.8 - COBROS / PAGOS
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists pagos_factura (
  id uuid primary key default gen_random_uuid(),
  factura_id uuid references facturas(id) on delete cascade,
  importe numeric(10,2) not null default 0,
  metodo_pago text not null default 'efectivo',
  fecha_pago date not null default current_date,
  referencia text,
  notas text,
  creado_por text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table pagos_factura
add column if not exists referencia text;

alter table pagos_factura
add column if not exists creado_por text;

alter table pagos_factura
add column if not exists updated_at timestamptz default now();

create index if not exists idx_pagos_factura_factura_id on pagos_factura(factura_id);
create index if not exists idx_pagos_factura_fecha on pagos_factura(fecha_pago);
create index if not exists idx_pagos_factura_metodo on pagos_factura(metodo_pago);

create or replace function set_updated_at_pagos_factura()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_pagos_factura_updated_at on pagos_factura;
create trigger trigger_pagos_factura_updated_at
before update on pagos_factura
for each row execute function set_updated_at_pagos_factura();

alter table pagos_factura enable row level security;

drop policy if exists "select_all" on pagos_factura;
drop policy if exists "insert_all" on pagos_factura;
drop policy if exists "update_all" on pagos_factura;
drop policy if exists "delete_all" on pagos_factura;

create policy "select_all" on pagos_factura for select using (true);
create policy "insert_all" on pagos_factura for insert with check (true);
create policy "update_all" on pagos_factura for update using (true);
create policy "delete_all" on pagos_factura for delete using (true);

-- Función opcional para actualizar automáticamente el estado de la factura
create or replace function actualizar_estado_factura_por_pagos(factura_uuid uuid)
returns void as $$
declare
  total_factura numeric(10,2);
  total_pagado numeric(10,2);
begin
  select coalesce(total, 0) into total_factura
  from facturas
  where id = factura_uuid;

  select coalesce(sum(importe), 0) into total_pagado
  from pagos_factura
  where factura_id = factura_uuid;

  if total_factura > 0 and total_pagado >= total_factura then
    update facturas set estado = 'pagada', updated_at = now() where id = factura_uuid;
  elsif total_pagado > 0 then
    update facturas set estado = 'parcial', updated_at = now() where id = factura_uuid;
  else
    update facturas set estado = 'pendiente', updated_at = now() where id = factura_uuid and estado <> 'cancelada';
  end if;
end;
$$ language plpgsql;

create or replace function trigger_actualizar_estado_factura_pago()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    perform actualizar_estado_factura_por_pagos(old.factura_id);
    return old;
  else
    perform actualizar_estado_factura_por_pagos(new.factura_id);
    return new;
  end if;
end;
$$ language plpgsql;

drop trigger if exists trigger_pagos_factura_recalcular_estado_insert on pagos_factura;
drop trigger if exists trigger_pagos_factura_recalcular_estado_update on pagos_factura;
drop trigger if exists trigger_pagos_factura_recalcular_estado_delete on pagos_factura;

create trigger trigger_pagos_factura_recalcular_estado_insert
after insert on pagos_factura
for each row execute function trigger_actualizar_estado_factura_pago();

create trigger trigger_pagos_factura_recalcular_estado_update
after update on pagos_factura
for each row execute function trigger_actualizar_estado_factura_pago();

create trigger trigger_pagos_factura_recalcular_estado_delete
after delete on pagos_factura
for each row execute function trigger_actualizar_estado_factura_pago();
