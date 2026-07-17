-- AK Cloud — Servicios incluidos por plan: Essential y Performance
--
-- Essential: solo las "anulaciones" (EGR/DPF/AdBlue OFF) van gratis.
-- Performance: todo gratis excepto IMMO OFF.
--
-- Funciona buscando el plan y el servicio POR NOMBRE/SLUG, no por UUID,
-- así no hace falta que sepas los IDs reales de tu Supabase. Requisito:
-- que el plan se llame exactamente "Essential" y "Performance" en
-- akcloud_planes (revisa mayúsculas/espacios si falla).
--
-- Aviso: en tu catálogo actual solo existe un "IMMO OFF" genérico (slug
-- immo-off), no uno específico para MD1MG1. Este script deja el IMMO OFF
-- genérico fuera de Performance (o sea, se cobra aparte). Si quieres que
-- solo la variante MD1MG1 se cobre y el resto de IMMO sí sea gratis con
-- Performance, antes tendrías que crear en el admin un servicio nuevo
-- "IMMO OFF MD1MG1" como categoría propia — dímelo y te lo dejo montado.

-- ---------------------------------------------------------
-- Essential: incluye gratis solo las anulaciones
-- ---------------------------------------------------------
insert into akcloud_plan_servicios (plan_id, servicio_id, incluido, precio_override)
select p.id, s.id, true, 0
from akcloud_planes p
cross join akcloud_servicios s
where p.nombre = 'Essential'
  and s.slug in ('egr-off', 'dpf-off', 'adblue-off')
on conflict (plan_id, servicio_id) do update set incluido = true, precio_override = 0;

-- Por si quedaba de antes alguna fila marcando otro servicio como
-- incluido en Essential, se deja fuera (se cobra al precio de catálogo).
update akcloud_plan_servicios
set incluido = false, precio_override = null
where plan_id = (select id from akcloud_planes where nombre = 'Essential')
  and servicio_id not in (
    select id from akcloud_servicios where slug in ('egr-off', 'dpf-off', 'adblue-off')
  );

-- ---------------------------------------------------------
-- Performance: incluye gratis todo excepto IMMO OFF
-- ---------------------------------------------------------
insert into akcloud_plan_servicios (plan_id, servicio_id, incluido, precio_override)
select p.id, s.id, true, 0
from akcloud_planes p
cross join akcloud_servicios s
where p.nombre = 'Performance'
  and s.slug != 'immo-off'
on conflict (plan_id, servicio_id) do update set incluido = true, precio_override = 0;

-- IMMO OFF se deja fuera explícitamente (se cobra aparte).
insert into akcloud_plan_servicios (plan_id, servicio_id, incluido, precio_override)
select p.id, s.id, false, null
from akcloud_planes p
cross join akcloud_servicios s
where p.nombre = 'Performance'
  and s.slug = 'immo-off'
on conflict (plan_id, servicio_id) do update set incluido = false, precio_override = null;

-- Comprueba el resultado:
select pl.nombre as plan, sv.nombre as servicio, ps.incluido, ps.precio_override
from akcloud_plan_servicios ps
join akcloud_planes pl on pl.id = ps.plan_id
join akcloud_servicios sv on sv.id = ps.servicio_id
where pl.nombre in ('Essential', 'Performance')
order by pl.nombre, sv.orden;
