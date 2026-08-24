insert into public.akcloud_reglas_precios (
  nombre,
  servicio_principal_slug,
  servicios_gratis,
  descuentos,
  solo_planes,
  solo_distribuidores,
  activo,
  orden,
  nota
)
select
  'Extras gratis con Stage 1',
  'stage-1-coche',
  array['dpf-off-coche','egr-off-coche','adblue-off-coche','decat-coche','pops-bangs-coche','hardcut-coche','launch-control-coche','dtc-off']::text[],
  '{}'::jsonb,
  '{}'::uuid[],
  coalesce((
    select array_agg(distinct c.distribuidor_id)
    from public.distribuidor_precios_condicionales c
    join public.akcloud_servicios req on req.id = c.requiere_servicio_id
    where c.activo = true
      and c.precio = 0
      and req.slug = 'stage-1-coche'
  ), '{}'::uuid[]),
  true,
  10,
  'Plantilla administrable desde AK Core. Los extras quedan a 0 € solo si el pedido incluye Stage 1.'
where not exists (
  select 1 from public.akcloud_reglas_precios where nombre = 'Extras gratis con Stage 1'
);
