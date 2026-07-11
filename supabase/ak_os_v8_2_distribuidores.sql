-- AK OS v8.2 - Solicitudes y alta controlada de distribuidores
-- Ejecutar una sola vez en el Supabase compartido por Core y AK Cloud.

create table if not exists public.akcloud_solicitudes_distribuidores (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  email text not null,
  empresa text not null,
  razon_social text,
  nif text,
  nombre text not null,
  apellidos text,
  cargo text,
  telefono text,
  pais text default 'España',
  provincia text,
  ciudad text,
  direccion text,
  codigo_postal text,
  web text,
  especialidad text,
  experiencia_anios integer,
  herramientas text[] not null default '{}',
  observaciones text,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada','informacion_solicitada')),
  motivo_estado text,
  plan_id uuid references public.akcloud_planes(id) on delete set null,
  creditos_iniciales integer not null default 0,
  core_cliente_id uuid,
  revisada_por text,
  revisada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists akcloud_solicitudes_email_pending_idx
  on public.akcloud_solicitudes_distribuidores(lower(email))
  where estado in ('pendiente','informacion_solicitada');
create index if not exists akcloud_solicitudes_estado_idx on public.akcloud_solicitudes_distribuidores(estado, created_at desc);
create index if not exists akcloud_solicitudes_auth_idx on public.akcloud_solicitudes_distribuidores(auth_user_id);

create table if not exists public.akcloud_distribuidores (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  solicitud_id uuid references public.akcloud_solicitudes_distribuidores(id) on delete set null,
  core_cliente_id uuid,
  plan_id uuid references public.akcloud_planes(id) on delete set null,
  empresa text not null,
  nombre_contacto text,
  email text not null,
  telefono text,
  nif text,
  estado text not null default 'activo' check (estado in ('activo','suspendido','bloqueado')),
  etiqueta text default 'Nuevo',
  notas_internas text,
  aprobado_at timestamptz default now(),
  ultimo_acceso timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists akcloud_distribuidores_email_idx on public.akcloud_distribuidores(lower(email));
create index if not exists akcloud_distribuidores_estado_idx on public.akcloud_distribuidores(estado);

alter table public.akcloud_solicitudes_distribuidores enable row level security;
alter table public.akcloud_distribuidores enable row level security;

drop policy if exists "solicitudes_public_insert" on public.akcloud_solicitudes_distribuidores;
create policy "solicitudes_public_insert" on public.akcloud_solicitudes_distribuidores
  for insert to anon, authenticated with check (true);

drop policy if exists "solicitudes_own_select" on public.akcloud_solicitudes_distribuidores;
create policy "solicitudes_own_select" on public.akcloud_solicitudes_distribuidores
  for select to authenticated using (auth.uid() = auth_user_id);

drop policy if exists "distribuidores_own_select" on public.akcloud_distribuidores;
create policy "distribuidores_own_select" on public.akcloud_distribuidores
  for select to authenticated using (auth.uid() = auth_user_id);

-- La escritura administrativa se realiza exclusivamente desde las rutas server de Core
-- usando SUPABASE_SERVICE_ROLE_KEY.
