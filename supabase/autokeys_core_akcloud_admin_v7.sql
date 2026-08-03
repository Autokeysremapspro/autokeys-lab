-- AK Cloud Admin v7 - Configuración central desde Autokeys Core

create table if not exists akcloud_servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  categoria text not null default 'reprogramacion',
  descripcion text,
  precio numeric(10,2) not null default 0,
  creditos integer not null default 0,
  icono text default '⚙️',
  activo boolean not null default true,
  orden integer not null default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists akcloud_planes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  descripcion text,
  precio_mensual numeric(10,2) not null default 0,
  creditos_mes integer not null default 0,
  ventajas text[] default '{}',
  destacado boolean not null default false,
  activo boolean not null default true,
  orden integer not null default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists akcloud_metodos_pago (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nombre text not null,
  descripcion text,
  activo boolean not null default true,
  automatico boolean not null default false,
  instrucciones text,
  orden integer not null default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists akcloud_branding (
  id integer primary key default 1,
  nombre_producto text not null default 'AK Cloud',
  slogan text not null default 'File Service profesional para electrónica del automóvil',
  subtitulo text default 'Powered by Autokeys Lab',
  telefono_soporte text,
  email_soporte text,
  whatsapp_soporte text,
  aviso_portal text,
  color_principal text default '#D90429',
  updated_at timestamptz default now(),
  constraint akcloud_branding_singleton check (id = 1)
);

insert into akcloud_servicios (nombre, slug, categoria, descripcion, precio, creditos, icono, orden)
values
  ('Stage 1', 'stage-1', 'reprogramacion', 'Optimización de potencia segura para uso diario.', 65, 65, '🚀', 10),
  ('Stage 2', 'stage-2', 'reprogramacion', 'Calibración avanzada para vehículos con hardware modificado.', 95, 95, '🏁', 20),
  ('DPF OFF', 'dpf-off', 'anticontaminacion', 'Solución para sistema DPF según solicitud del profesional.', 55, 55, '🚫', 30),
  ('EGR OFF', 'egr-off', 'anticontaminacion', 'Solución para sistema EGR según solicitud del profesional.', 40, 40, '🌿', 40),
  ('AdBlue OFF', 'adblue-off', 'anticontaminacion', 'Solución para sistema SCR/AdBlue según solicitud del profesional.', 60, 60, '💧', 50),
  ('IMMO OFF', 'immo-off', 'electronica', 'Solución de inmovilizador para trabajos de laboratorio.', 65, 65, '🔑', 60),
  ('Pops & Bangs', 'pops-bangs', 'opciones', 'Configuración de petardeo bajo solicitud.', 50, 50, '💥', 70),
  ('Hardcut', 'hardcut', 'opciones', 'Limitador tipo hardcut según configuración solicitada.', 35, 35, '🍿', 80)
on conflict (slug) do nothing;

insert into akcloud_planes (nombre, slug, descripcion, precio_mensual, creditos_mes, ventajas, destacado, orden)
values
  ('Starter', 'starter', 'Para distribuidores que empiezan a trabajar con AK Cloud.', 29, 100, array['100 créditos mensuales','Soporte estándar','Historial de pedidos'], false, 10),
  ('PRO', 'pro', 'Plan recomendado para talleres activos.', 59, 250, array['250 créditos mensuales','Prioridad media','Soporte preferente','Historial completo'], true, 20),
  ('Elite', 'elite', 'Para distribuidores con alto volumen de trabajos.', 149, 700, array['700 créditos mensuales','Prioridad máxima','Soporte premium','Condiciones especiales'], false, 30)
on conflict (slug) do nothing;

insert into akcloud_metodos_pago (codigo, nombre, descripcion, activo, automatico, instrucciones, orden)
values
  ('paypal', 'PayPal / Tarjeta', 'Pago automático mediante PayPal Checkout.', true, true, 'El cliente paga online y los créditos se activan automáticamente.', 10),
  ('bizum', 'Bizum', 'Pago manual mediante Bizum.', true, false, 'Envía Bizum al número configurado e indica el número de pedido o email.', 20),
  ('transferencia', 'Transferencia bancaria', 'Pago manual por transferencia.', true, false, 'Realiza transferencia y adjunta justificante en el portal.', 30)
on conflict (codigo) do nothing;

insert into akcloud_branding (id)
values (1)
on conflict (id) do nothing;

alter table akcloud_servicios enable row level security;
alter table akcloud_planes enable row level security;
alter table akcloud_metodos_pago enable row level security;
alter table akcloud_branding enable row level security;

drop policy if exists "akcloud_servicios_all" on akcloud_servicios;
create policy "akcloud_servicios_all" on akcloud_servicios for all using (true) with check (true);

drop policy if exists "akcloud_planes_all" on akcloud_planes;
create policy "akcloud_planes_all" on akcloud_planes for all using (true) with check (true);

drop policy if exists "akcloud_metodos_pago_all" on akcloud_metodos_pago;
create policy "akcloud_metodos_pago_all" on akcloud_metodos_pago for all using (true) with check (true);

drop policy if exists "akcloud_branding_all" on akcloud_branding;
create policy "akcloud_branding_all" on akcloud_branding for all using (true) with check (true);
