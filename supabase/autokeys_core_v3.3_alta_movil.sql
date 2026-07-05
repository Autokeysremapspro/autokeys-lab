-- Autokeys Core v3.3
-- Alta móvil rápida + permisos de borrado durante desarrollo.
-- No crea tablas nuevas obligatorias.

alter table vehiculos enable row level security;
alter table expedientes enable row level security;

create policy if not exists "delete_all_vehiculos_v33"
on vehiculos
for delete
using (true);

create policy if not exists "delete_all_expedientes_v33"
on expedientes
for delete
using (true);
