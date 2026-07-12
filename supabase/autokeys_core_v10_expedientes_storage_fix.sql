-- =========================================================
-- AUTOKEYS CORE — Cerrar buckets de expedientes (eran PUBLIC)
-- Ejecutar en el mismo proyecto Supabase, después de
-- autokeys_core_v9_security_fix.sql (usa is_staff()).
--
-- Contienen documentos de clientes (expediente-archivos,
-- autokeys-expedientes) — hoy son públicos: cualquiera con la
-- URL de un archivo puede verlo sin iniciar sesión.
-- =========================================================

-- 1) Quitar la marca "público" de los buckets
update storage.buckets set public = false where id in ('expediente-archivos', 'autokeys-expedientes');

-- 2) Políticas: solo staff de Autokeys puede leer/escribir estos documentos.
--    (Son herramientas internas de gestión de expedientes, no hay portal
--    de cliente que necesite verlos directamente — si en el futuro añades
--    uno, habrá que crear una política adicional específica para ese caso.)
drop policy if exists "expedientes_buckets_select_staff" on storage.objects;
drop policy if exists "expedientes_buckets_insert_staff" on storage.objects;
drop policy if exists "expedientes_buckets_update_staff" on storage.objects;
drop policy if exists "expedientes_buckets_delete_staff" on storage.objects;

create policy "expedientes_buckets_select_staff" on storage.objects
for select using (
  bucket_id in ('expediente-archivos', 'autokeys-expedientes') and is_staff()
);

create policy "expedientes_buckets_insert_staff" on storage.objects
for insert with check (
  bucket_id in ('expediente-archivos', 'autokeys-expedientes') and is_staff()
);

create policy "expedientes_buckets_update_staff" on storage.objects
for update using (
  bucket_id in ('expediente-archivos', 'autokeys-expedientes') and is_staff()
)
with check (
  bucket_id in ('expediente-archivos', 'autokeys-expedientes') and is_staff()
);

create policy "expedientes_buckets_delete_staff" on storage.objects
for delete using (
  bucket_id in ('expediente-archivos', 'autokeys-expedientes') and is_staff()
);

-- ---------------------------------------------------------
-- IMPORTANTE — esto rompe las URLs "públicas" antiguas
-- ---------------------------------------------------------
-- Cualquier URL pública que ya hayas compartido, guardado en un PDF,
-- enviado por email, etc. (formato .../storage/v1/object/public/...)
-- deja de funcionar a partir de ahora — es justo el objetivo. El código
-- ya se ha actualizado (lib/services/archivos.ts y entregas.ts) para
-- generar URLs firmadas de corta duración en el momento de mostrarlas,
-- en vez de guardar una URL "pública" permanente en la base de datos.
