-- Shared Supabase hardening: remove legacy allow-all RLS from Core/internal AK tables.
-- Preserve current Core browser functionality for internal staff through is_staff()/is_admin().

DROP POLICY IF EXISTS "Allow all delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all select clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all update clientes" ON public.clientes;
DROP POLICY IF EXISTS "usuarios autenticados clientes" ON public.clientes;

DROP POLICY IF EXISTS "Allow all delete vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Allow all insert vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Allow all select vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS "Allow all update vehiculos" ON public.vehiculos;
DROP POLICY IF EXISTS delete_all_vehiculos_v33 ON public.vehiculos;
DROP POLICY IF EXISTS "usuarios autenticados vehiculos" ON public.vehiculos;

DROP POLICY IF EXISTS delete_all_expedientes_v33 ON public.expedientes;
DROP POLICY IF EXISTS "usuarios autenticados expedientes" ON public.expedientes;
DROP POLICY IF EXISTS "usuarios autenticados facturas" ON public.facturas;
DROP POLICY IF EXISTS "usuarios autenticados stock" ON public.stock;

DROP POLICY IF EXISTS delete_all ON public.file_service;
DROP POLICY IF EXISTS insert_all ON public.file_service;
DROP POLICY IF EXISTS select_all ON public.file_service;
DROP POLICY IF EXISTS update_all ON public.file_service;
DROP POLICY IF EXISTS "usuarios autenticados file_service" ON public.file_service;
DROP POLICY IF EXISTS file_service_staff_select ON public.file_service;
DROP POLICY IF EXISTS file_service_staff_insert ON public.file_service;
DROP POLICY IF EXISTS file_service_staff_update ON public.file_service;
DROP POLICY IF EXISTS file_service_staff_delete ON public.file_service;
CREATE POLICY file_service_staff_select ON public.file_service FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY file_service_staff_insert ON public.file_service FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY file_service_staff_update ON public.file_service FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY file_service_staff_delete ON public.file_service FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS delete_all_entregas_v44 ON public.entregas_expediente;
DROP POLICY IF EXISTS insert_all_entregas_v44 ON public.entregas_expediente;
DROP POLICY IF EXISTS select_all_entregas_v44 ON public.entregas_expediente;
DROP POLICY IF EXISTS update_all_entregas_v44 ON public.entregas_expediente;
DROP POLICY IF EXISTS entregas_staff_all ON public.entregas_expediente;
CREATE POLICY entregas_staff_all ON public.entregas_expediente FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS delete_all_archivos_pro ON public.expediente_archivos_pro;
DROP POLICY IF EXISTS insert_all_archivos_pro ON public.expediente_archivos_pro;
DROP POLICY IF EXISTS select_all_archivos_pro ON public.expediente_archivos_pro;
DROP POLICY IF EXISTS update_all_archivos_pro ON public.expediente_archivos_pro;
DROP POLICY IF EXISTS archivos_pro_staff_all ON public.expediente_archivos_pro;
CREATE POLICY archivos_pro_staff_all ON public.expediente_archivos_pro FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS delete_all_garantias_v45 ON public.garantias_expediente;
DROP POLICY IF EXISTS insert_all_garantias_v45 ON public.garantias_expediente;
DROP POLICY IF EXISTS select_all_garantias_v45 ON public.garantias_expediente;
DROP POLICY IF EXISTS update_all_garantias_v45 ON public.garantias_expediente;
DROP POLICY IF EXISTS garantias_staff_all ON public.garantias_expediente;
CREATE POLICY garantias_staff_all ON public.garantias_expediente FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS delete_all ON public.lineas_factura;
DROP POLICY IF EXISTS insert_all ON public.lineas_factura;
DROP POLICY IF EXISTS select_all ON public.lineas_factura;
DROP POLICY IF EXISTS update_all ON public.lineas_factura;
DROP POLICY IF EXISTS "usuarios autenticados lineas_factura" ON public.lineas_factura;
DROP POLICY IF EXISTS lineas_factura_staff_all ON public.lineas_factura;
CREATE POLICY lineas_factura_staff_all ON public.lineas_factura FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS delete_all ON public.movimientos_stock;
DROP POLICY IF EXISTS insert_all ON public.movimientos_stock;
DROP POLICY IF EXISTS select_all ON public.movimientos_stock;
DROP POLICY IF EXISTS update_all ON public.movimientos_stock;
DROP POLICY IF EXISTS "usuarios autenticados movimientos_stock" ON public.movimientos_stock;
DROP POLICY IF EXISTS movimientos_stock_staff_all ON public.movimientos_stock;
CREATE POLICY movimientos_stock_staff_all ON public.movimientos_stock FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS delete_all ON public.servicios;
DROP POLICY IF EXISTS insert_all ON public.servicios;
DROP POLICY IF EXISTS select_all ON public.servicios;
DROP POLICY IF EXISTS update_all ON public.servicios;
DROP POLICY IF EXISTS servicios_staff_all ON public.servicios;
CREATE POLICY servicios_staff_all ON public.servicios FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS delete_all ON public.servicios_expediente;
DROP POLICY IF EXISTS insert_all ON public.servicios_expediente;
DROP POLICY IF EXISTS select_all ON public.servicios_expediente;
DROP POLICY IF EXISTS update_all ON public.servicios_expediente;
DROP POLICY IF EXISTS "usuarios autenticados servicios" ON public.servicios_expediente;
DROP POLICY IF EXISTS servicios_expediente_staff_all ON public.servicios_expediente;
CREATE POLICY servicios_expediente_staff_all ON public.servicios_expediente FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS delete_all ON public.usuarios;
DROP POLICY IF EXISTS insert_all ON public.usuarios;
DROP POLICY IF EXISTS select_all ON public.usuarios;
DROP POLICY IF EXISTS update_all ON public.usuarios;
DROP POLICY IF EXISTS usuarios_admin_all ON public.usuarios;
CREATE POLICY usuarios_admin_all ON public.usuarios FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "usuarios autenticados usuarios_app" ON public.usuarios_app;

DROP POLICY IF EXISTS ak_creditos_movimientos_all_core ON public.ak_creditos_movimientos;
DROP POLICY IF EXISTS ak_creditos_movimientos_delete_all ON public.ak_creditos_movimientos;
DROP POLICY IF EXISTS ak_creditos_movimientos_insert_all ON public.ak_creditos_movimientos;
DROP POLICY IF EXISTS ak_creditos_movimientos_select_all ON public.ak_creditos_movimientos;
DROP POLICY IF EXISTS ak_creditos_movimientos_update_all ON public.ak_creditos_movimientos;

DROP POLICY IF EXISTS ak_creditos_recargas_all_core ON public.ak_creditos_recargas;
DROP POLICY IF EXISTS ak_recargas_core_delete_all ON public.ak_creditos_recargas;
DROP POLICY IF EXISTS ak_recargas_core_insert_all ON public.ak_creditos_recargas;
DROP POLICY IF EXISTS ak_recargas_core_select_all ON public.ak_creditos_recargas;
DROP POLICY IF EXISTS ak_recargas_core_update_all ON public.ak_creditos_recargas;

DROP POLICY IF EXISTS ak_notificaciones_all_v5 ON public.ak_notificaciones;
DROP POLICY IF EXISTS ak_notificaciones_delete_all ON public.ak_notificaciones;
DROP POLICY IF EXISTS ak_notificaciones_insert_all ON public.ak_notificaciones;
DROP POLICY IF EXISTS ak_notificaciones_select_all ON public.ak_notificaciones;
DROP POLICY IF EXISTS ak_notificaciones_update_all ON public.ak_notificaciones;

DROP POLICY IF EXISTS ak_paypal_pagos_delete_all ON public.ak_paypal_pagos;
DROP POLICY IF EXISTS ak_paypal_pagos_insert_all ON public.ak_paypal_pagos;
DROP POLICY IF EXISTS ak_paypal_pagos_select_all ON public.ak_paypal_pagos;
DROP POLICY IF EXISTS ak_paypal_pagos_update_all ON public.ak_paypal_pagos;

DROP POLICY IF EXISTS ak_ecu_rules_delete ON public.ak_ecu_detection_rules;
DROP POLICY IF EXISTS ak_ecu_rules_insert ON public.ak_ecu_detection_rules;
DROP POLICY IF EXISTS ak_ecu_rules_select ON public.ak_ecu_detection_rules;
DROP POLICY IF EXISTS ak_ecu_rules_update ON public.ak_ecu_detection_rules;
DROP POLICY IF EXISTS ak_ecu_detection_rules_delete_staff ON public.ak_ecu_detection_rules;
CREATE POLICY ak_ecu_detection_rules_delete_staff ON public.ak_ecu_detection_rules FOR DELETE TO authenticated USING (public.is_staff());

ALTER VIEW public.crm_clientes_resumen SET (security_invoker = true);
ALTER VIEW public.crm_vehiculos_historial SET (security_invoker = true);
REVOKE ALL ON public.crm_clientes_resumen FROM anon;
REVOKE ALL ON public.crm_vehiculos_historial FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.crm_clientes_resumen FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.crm_vehiculos_historial FROM authenticated;
GRANT SELECT ON public.crm_clientes_resumen TO authenticated;
GRANT SELECT ON public.crm_vehiculos_historial TO authenticated;
