-- AK Cloud Novedades v1 - Avisos/novedades del dashboard gestionables desde Autokeys Core

create table if not exists akcloud_novedades (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contenido text default '',
  icono text default '📣',
  activo boolean not null default true,
  destacado boolean not null default false,
  orden integer not null default 100,
  publicado_en timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table akcloud_novedades enable row level security;

drop policy if exists "akcloud_novedades_all" on akcloud_novedades;
create policy "akcloud_novedades_all" on akcloud_novedades for all using (true) with check (true);
