-- =========================================================
-- AUTOKEYS CORE — Barrido completo de RLS (v11)
-- El parche v9 solo cubrió una lista de tablas elegidas a mano.
-- Este archivo revisa TODAS las políticas "using (true)" que se
-- encontraron en el histórico completo de migraciones y las cierra.
-- Ejecutar después de v9 y v10. Reutiliza is_staff()/is_admin().
-- =========================================================

-- ---------------------------------------------------------
-- 1) Tablas internas: solo staff. Se borra CUALQUIER política que
--    ya exista en la tabla (sea cual sea su nombre) antes de crear
--    las nuevas — así no importa con qué migración se creó la
--    política abierta originalmente, se cierra igual.
-- ---------------------------------------------------------
do $$
declare
  t text;
  pol record;
  staff_tables text[] := array[
    'archivos_expediente', 'expediente_checklist', 'expediente_tiempos',
    'casos_tecnicos', 'configuracion_empresa', 'distribuidor_perfiles',
    'portal_distribuidor_mensajes', 'agenda_eventos', 'auditoria_eventos',
    'notificaciones', 'backup_registros', 'plantillas_documentos',
    'objetivos_kpis', 'cliente_notas', 'cliente_documentos',
    'biblioteca_tecnica', 'expediente_ecu', 'expediente_llaves',
    'expediente_historial'
  ];
begin
  foreach t in array staff_tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t) then
      execute format('alter table public.%I enable row level security;', t);

      for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
        execute format('drop policy if exists %I on public.%I;', pol.policyname, t);
      end loop;

      execute format('create policy "%1$s_staff_select" on public.%1$I for select using (is_staff());', t);
      execute format('create policy "%1$s_staff_insert" on public.%1$I for insert with check (is_staff());', t);
      execute format('create policy "%1$s_staff_update" on public.%1$I for update using (is_staff()) with check (is_staff());', t);
      execute format('create policy "%1$s_admin_delete" on public.%1$I for delete using (is_admin());', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------
-- 2) Catálogo AK Cloud (akcloud_servicios, akcloud_planes,
--    akcloud_metodos_pago, akcloud_branding): estas SÍ deben poder
--    leerse por cualquier distribuidor logueado (son precios y
--    configuración visual del portal, no datos sensibles). El
--    problema no era falta de política buena — ya existía una
--    correcta para servicios/planes/métodos desde el parche de
--    AK Cloud — sino que ADEMÁS quedaba esta otra, totalmente
--    abierta, funcionando en paralelo (en Postgres, si una sola
--    política permite algo, se permite, aunque haya otra más
--    estricta). Se retiran solo estas cuatro, por nombre exacto,
--    sin tocar el resto de políticas de esas tablas.
-- ---------------------------------------------------------
drop policy if exists "akcloud_servicios_all" on public.akcloud_servicios;
drop policy if exists "akcloud_planes_all" on public.akcloud_planes;
drop policy if exists "akcloud_metodos_pago_all" on public.akcloud_metodos_pago;
drop policy if exists "akcloud_branding_all" on public.akcloud_branding;

-- akcloud_branding no tenía ninguna política restrictiva de reemplazo
-- (a diferencia de servicios/planes/métodos) — se añade ahora.
alter table public.akcloud_branding enable row level security;
drop policy if exists "akcloud_branding_select_auth" on public.akcloud_branding;
drop policy if exists "akcloud_branding_write_staff" on public.akcloud_branding;
create policy "akcloud_branding_select_auth" on public.akcloud_branding
  for select using (auth.role() = 'authenticated');
create policy "akcloud_branding_write_staff" on public.akcloud_branding
  for all using (is_staff()) with check (is_staff());

-- ---------------------------------------------------------
-- 3) ak_creditos_recargas — ya se corrigió desde el repo de AK Cloud
--    (autokeys_file_service_v11_recargas_fix.sql), pero esta tabla
--    se creó también desde una migración de Core que dejó SU PROPIA
--    política abierta en paralelo ("ak_creditos_recargas_all_core_v4").
--    Se retira esa política concreta; las buenas ya están puestas.
-- ---------------------------------------------------------
drop policy if exists "ak_creditos_recargas_all_core_v4" on public.ak_creditos_recargas;

-- ---------------------------------------------------------
-- 4) Nota
-- ---------------------------------------------------------
-- Esta lista sale de revisar el histórico completo de archivos .sql
-- del repo hasta hoy. Si en el futuro añades una tabla nueva con
-- "using (true)" sin querer, este barrido no la va a encontrar sola —
-- conviene repasar cada migración nueva a mano antes de aplicarla.
