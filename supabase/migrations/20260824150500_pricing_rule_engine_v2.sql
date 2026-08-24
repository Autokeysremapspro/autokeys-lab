alter table public.akcloud_reglas_precios
  add column if not exists tipo text not null default 'extras_gratis',
  add column if not exists servicios_requeridos text[] not null default '{}',
  add column if not exists precio_conjunto numeric(10,2);

create index if not exists akcloud_reglas_precios_tipo_activo_idx
  on public.akcloud_reglas_precios (tipo, activo, orden);

create index if not exists akcloud_reglas_precios_distribuidores_gin_idx
  on public.akcloud_reglas_precios using gin (solo_distribuidores);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.akcloud_reglas_precios'::regclass
      and conname = 'akcloud_reglas_precios_tipo_chk'
  ) then
    alter table public.akcloud_reglas_precios
      add constraint akcloud_reglas_precios_tipo_chk
      check (tipo in ('extras_gratis','combo_fijo'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.akcloud_reglas_precios'::regclass
      and conname = 'akcloud_reglas_precios_combo_precio_chk'
  ) then
    alter table public.akcloud_reglas_precios
      add constraint akcloud_reglas_precios_combo_precio_chk
      check (precio_conjunto is null or precio_conjunto >= 0);
  end if;
end $$;

update public.akcloud_reglas_precios
set tipo = 'extras_gratis',
    servicios_requeridos = case
      when servicio_principal_slug is not null and servicio_principal_slug <> '' then array[servicio_principal_slug]
      else '{}'
    end,
    updated_at = now()
where tipo = 'extras_gratis'
  and coalesce(array_length(servicios_requeridos, 1), 0) = 0;

update public.akcloud_reglas_precios
set activo = false, updated_at = now()
where servicio_principal_slug in ('stage-1','stage-2')
  and coalesce(array_length(solo_distribuidores, 1), 0) = 0;

revoke all on table public.akcloud_reglas_precios from anon;
revoke insert, update, delete, truncate, references, trigger on table public.akcloud_reglas_precios from authenticated;
grant select on table public.akcloud_reglas_precios to authenticated;

drop policy if exists akcloud_reglas_precios_select_auth on public.akcloud_reglas_precios;
drop policy if exists akcloud_reglas_select_all on public.akcloud_reglas_precios;
drop policy if exists akcloud_reglas_write_all on public.akcloud_reglas_precios;
drop policy if exists akcloud_reglas_precios_staff_insert on public.akcloud_reglas_precios;
drop policy if exists akcloud_reglas_precios_staff_update on public.akcloud_reglas_precios;
drop policy if exists akcloud_reglas_precios_admin_delete on public.akcloud_reglas_precios;

create policy akcloud_reglas_precios_select_scoped
on public.akcloud_reglas_precios
for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1
    from public.akcloud_distribuidores d
    where d.auth_user_id = (select auth.uid())
      and d.id = any (akcloud_reglas_precios.solo_distribuidores)
  )
);