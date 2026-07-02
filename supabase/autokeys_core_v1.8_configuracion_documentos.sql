-- AUTOKEYS CORE v1.8 - Configuración de empresa + documentos

create table if not exists configuracion_empresa (
  id uuid primary key default gen_random_uuid(),
  nombre_comercial text default 'Autokeys Lab',
  razon_social text,
  cif text,
  direccion text,
  codigo_postal text,
  poblacion text,
  provincia text,
  telefono text,
  email text,
  web text,
  logo_url text,
  iva_defecto numeric(5,2) default 21,
  prefijo_ot text default 'OT',
  prefijo_factura text default 'FAC',
  prefijo_presupuesto text default 'PRE',
  prefijo_albaran text default 'ALB',
  prefijo_ticket text default 'TIC',
  texto_pie_factura text default 'Gracias por confiar en Autokeys Lab.',
  texto_garantia text default 'Garantía según condiciones del servicio realizado. No se cubren daños derivados de manipulación externa, material aportado por el cliente o averías ajenas al trabajo realizado.',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table configuracion_empresa enable row level security;

drop policy if exists "select_all" on configuracion_empresa;
drop policy if exists "insert_all" on configuracion_empresa;
drop policy if exists "update_all" on configuracion_empresa;
drop policy if exists "delete_all" on configuracion_empresa;

create policy "select_all" on configuracion_empresa for select using (true);
create policy "insert_all" on configuracion_empresa for insert with check (true);
create policy "update_all" on configuracion_empresa for update using (true);
create policy "delete_all" on configuracion_empresa for delete using (true);

create or replace function set_configuracion_empresa_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists configuracion_empresa_updated_at on configuracion_empresa;
create trigger configuracion_empresa_updated_at
before update on configuracion_empresa
for each row execute function set_configuracion_empresa_updated_at();

insert into configuracion_empresa (
  nombre_comercial,
  razon_social,
  cif,
  direccion,
  poblacion,
  provincia,
  telefono,
  email,
  web,
  iva_defecto
)
select
  'Autokeys Lab',
  'Autokeys Remaps Pro',
  '',
  '',
  'Puente de Génave',
  'Jaén',
  '',
  'info@autokeyspro.es',
  'autokeyspro.es',
  21
where not exists (select 1 from configuracion_empresa);
