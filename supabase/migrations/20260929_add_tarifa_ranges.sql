-- Horquillas comerciales para que atención al cliente pueda cotizar sin ver costes internos.
alter table public.tarifas_servicios
  add column if not exists pvp_desde numeric(10,2) check (pvp_desde is null or pvp_desde >= 0),
  add column if not exists pvp_hasta numeric(10,2) check (pvp_hasta is null or pvp_hasta >= 0),
  add column if not exists precio_taller_desde numeric(10,2) check (precio_taller_desde is null or precio_taller_desde >= 0),
  add column if not exists precio_taller_hasta numeric(10,2) check (precio_taller_hasta is null or precio_taller_hasta >= 0),
  add column if not exists regla_precio text;

update public.tarifas_servicios
set
  pvp_desde = least(
    pvp,
    greatest(
      coalesce(precio_minimo, 0),
      ceil((pvp * case when categoria = 'talleres' then 0.95 else 0.90 end) / 5) * 5
    )
  ),
  pvp_hasta = ceil((pvp * case
    when requiere_laboratorio or lower(coalesce(situacion, '')) like '%pérdida%' then 1.25
    when categoria in ('ecus', 'reparaciones') then 1.20
    else 1.15
  end) / 5) * 5,
  precio_taller_desde = case
    when precio_taller is null then null
    else least(precio_taller, ceil((precio_taller * 0.95) / 5) * 5)
  end,
  precio_taller_hasta = case
    when precio_taller is null then null
    else ceil((precio_taller * case when requiere_laboratorio then 1.20 else 1.12 end) / 5) * 5
  end,
  regla_precio = case categoria
    when 'llaves' then 'Desde: duplicado sencillo, llave presente y referencia confirmada. Recomendado: trabajo normal. Hasta: pérdida total, smart/protegida, apertura, desplazamiento o urgencia.'
    when 'ecus' then 'Desde: ECU identificada y desmontada, acceso directo. Recomendado: trabajo normal. Hasta: banco/boot, apertura, ECU protegida, donante, urgencia o riesgo adicional.'
    when 'reparaciones' then 'Desde: avería confirmada y módulo sin manipular. Recomendado: trabajo normal. Hasta: humedad, manipulación previa, donante, codificación, urgencia o garantía de mayor riesgo.'
    when 'talleres' then 'Desde: colaborador habitual, trabajo preparado y sin desplazamiento. Recomendado: tarifa profesional normal. Hasta: recogida, urgencia, diagnosis adicional o trabajo incompleto.'
    when 'files' then 'Desde: archivo estándar, lectura correcta y una entrega. Recomendado: servicio normal. Hasta: ECU protegida, solución combinada, urgencia, datalog o revisiones adicionales.'
  end
where pvp_desde is null
   or pvp_hasta is null
   or regla_precio is null;

alter table public.tarifas_servicios
  drop constraint if exists tarifas_servicios_rango_pvp_check;
alter table public.tarifas_servicios
  add constraint tarifas_servicios_rango_pvp_check
  check (pvp_desde is null or pvp_hasta is null or pvp_desde <= pvp and pvp <= pvp_hasta);

alter table public.tarifas_servicios
  drop constraint if exists tarifas_servicios_rango_taller_check;
alter table public.tarifas_servicios
  add constraint tarifas_servicios_rango_taller_check
  check (
    precio_taller is null
    or (precio_taller_desde is not null and precio_taller_hasta is not null
      and precio_taller_desde <= precio_taller and precio_taller <= precio_taller_hasta)
  );
