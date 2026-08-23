-- AUTOKEYS LAB - Precios de distribuidor sobre el catálogo real (v1)
-- Corrige un error de diseño: se había creado una tabla `precios_estandar`
-- paralela cuando el catálogo real de servicios (Stage 1, DPF OFF... y
-- también Camión, Agrícola, Motos, Servicios especiales) YA existe y se
-- administra en akcloud_servicios (precio = tarifa estándar que ve
-- cualquiera, editable en /ak-cloud/admin). distribuidor_precios pasa a
-- referenciar ese catálogo real por servicio_id en vez de un texto libre
-- desincronizado. Sin pérdida de datos: ambas tablas están vacías.

drop table if exists public.precios_estandar;

alter table public.distribuidor_precios drop constraint if exists distribuidor_precios_distribuidor_id_servicio_key;
alter table public.distribuidor_precios drop column if exists servicio;
alter table public.distribuidor_precios
  add column if not exists servicio_id uuid references public.akcloud_servicios(id) on delete cascade;
alter table public.distribuidor_precios alter column servicio_id set not null;
alter table public.distribuidor_precios
  add constraint distribuidor_precios_distribuidor_servicio_key unique (distribuidor_id, servicio_id);
