create table if not exists public.recepciones_ot (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null unique references public.expedientes(id) on delete cascade,
  tipo text not null check (tipo in ('vehiculo','componente')),
  kilometros integer,
  combustible text,
  componente text,
  referencia text,
  danos_previos text,
  accesorios text,
  objetos_personales text,
  autoriza_diagnostico boolean not null default true,
  firmante_nombre text not null,
  firmante_dni text,
  firma_storage_path text not null,
  fotos_storage_paths text[] not null default '{}',
  recibido_por text,
  pdf_enviado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.recepciones_ot enable row level security;
grant select,insert,update on public.recepciones_ot to authenticated;
drop policy if exists staff_read_recepciones_ot on public.recepciones_ot;
drop policy if exists staff_insert_recepciones_ot on public.recepciones_ot;
drop policy if exists staff_update_recepciones_ot on public.recepciones_ot;
create policy staff_read_recepciones_ot on public.recepciones_ot for select to authenticated using ((select is_staff()));
create policy staff_insert_recepciones_ot on public.recepciones_ot for insert to authenticated with check ((select is_staff()));
create policy staff_update_recepciones_ot on public.recepciones_ot for update to authenticated using ((select is_staff())) with check ((select is_staff()));
create index if not exists recepciones_ot_created_idx on public.recepciones_ot(created_at desc);
