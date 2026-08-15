-- AK Core realtime notification bus
-- Centralizes important AK Cloud events into public.notificaciones so the ERP
-- only needs to subscribe to one realtime table.

ALTER TABLE public.notificaciones REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
  END IF;
END $$;

-- Replace the previous technical-intake notifier. The old version attempted to
-- create one row per auth user with a specific role; on production that could
-- produce zero rows. AK Core notifications are global, so usuario_id stays null.
CREATE OR REPLACE FUNCTION public.akcloud_notify_technical_intake()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.ori_path IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.ori_path IS DISTINCT FROM NEW.ori_path) THEN
    INSERT INTO public.notificaciones(
      usuario_id, titulo, mensaje, modulo, tipo, prioridad, href, accion_texto, metadata
    ) VALUES (
      NULL,
      CASE
        WHEN COALESCE(NEW.urgente, false) OR NEW.prioridad = 'urgente' THEN 'Nuevo archivo URGENTE en AK Cloud'
        ELSE 'Nuevo archivo solicitado en AK Cloud'
      END,
      concat_ws(' · ',
        COALESCE(NEW.numero, 'Pedido'),
        COALESCE(NEW.cliente_nombre, NEW.cliente_email, 'Cliente'),
        NULLIF(concat_ws(' ', NEW.marca, NEW.modelo), ''),
        NEW.ecu,
        CASE WHEN NEW.pagado THEN 'Pagado' ELSE NULL END
      ),
      'AK Cloud',
      CASE WHEN COALESCE(NEW.urgente, false) OR NEW.prioridad = 'urgente' THEN 'danger' ELSE 'info' END,
      CASE WHEN COALESCE(NEW.urgente, false) OR NEW.prioridad = 'urgente' THEN 'urgente' ELSE 'alta' END,
      '/ak-cloud/' || NEW.id::text,
      'Abrir pedido',
      jsonb_build_object(
        'event_key', 'akcloud-order-' || NEW.id::text,
        'event_type', 'pedido_nuevo',
        'pedido_id', NEW.id,
        'numero', NEW.numero,
        'pagado', NEW.pagado
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.akcore_notify_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.pagado IS DISTINCT FROM NEW.pagado AND NEW.pagado = true THEN
    INSERT INTO public.notificaciones(usuario_id,titulo,mensaje,modulo,tipo,prioridad,href,accion_texto,metadata)
    VALUES (
      NULL,
      'Pago confirmado en AK Cloud',
      concat_ws(' · ', COALESCE(NEW.numero,'Pedido'), COALESCE(NEW.cliente_nombre,NEW.cliente_email,'Cliente'), to_char(COALESCE(NEW.precio_final,NEW.precio,0),'FM999999990.00') || ' €'),
      'AK Cloud','success','alta','/ak-cloud/' || NEW.id::text,'Abrir pedido',
      jsonb_build_object('event_key','akcloud-payment-' || NEW.id::text || '-' || extract(epoch from clock_timestamp())::bigint::text,'event_type','pago_confirmado','pedido_id',NEW.id)
    );
  END IF;

  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.notificaciones(usuario_id,titulo,mensaje,modulo,tipo,prioridad,href,accion_texto,metadata)
    VALUES (
      NULL,
      CASE
        WHEN NEW.estado = 'revision_solicitada' THEN 'Cliente solicita revisión'
        ELSE 'Estado de pedido actualizado'
      END,
      concat_ws(' · ', COALESCE(NEW.numero,'Pedido'), COALESCE(NEW.cliente_nombre,NEW.cliente_email,'Cliente'), COALESCE(NEW.estado,'sin estado')),
      'AK Cloud',
      CASE WHEN NEW.estado = 'revision_solicitada' THEN 'danger' ELSE 'info' END,
      CASE WHEN NEW.estado = 'revision_solicitada' THEN 'urgente' ELSE 'normal' END,
      '/ak-cloud/' || NEW.id::text,'Abrir pedido',
      jsonb_build_object('event_key','akcloud-status-' || NEW.id::text || '-' || COALESCE(NEW.estado,''),'event_type','pedido_estado','pedido_id',NEW.id,'estado',NEW.estado)
    );
  END IF;

  IF (COALESCE(NEW.urgente,false) OR NEW.prioridad = 'urgente')
     AND NOT (COALESCE(OLD.urgente,false) OR OLD.prioridad = 'urgente') THEN
    INSERT INTO public.notificaciones(usuario_id,titulo,mensaje,modulo,tipo,prioridad,href,accion_texto,metadata)
    VALUES (
      NULL,'Pedido marcado como URGENTE',
      concat_ws(' · ',COALESCE(NEW.numero,'Pedido'),COALESCE(NEW.cliente_nombre,NEW.cliente_email,'Cliente'),NEW.ecu),
      'AK Cloud','danger','urgente','/ak-cloud/' || NEW.id::text,'Abrir pedido',
      jsonb_build_object('event_key','akcloud-urgent-' || NEW.id::text,'event_type','pedido_urgente','pedido_id',NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_akcore_notify_order_update ON public.file_service_pedidos;
CREATE TRIGGER trg_akcore_notify_order_update
AFTER UPDATE ON public.file_service_pedidos
FOR EACH ROW EXECUTE FUNCTION public.akcore_notify_order_update();

CREATE OR REPLACE FUNCTION public.akcore_notify_file_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF lower(COALESCE(NEW.autor_tipo,'')) = 'cliente' THEN
    INSERT INTO public.notificaciones(usuario_id,titulo,mensaje,modulo,tipo,prioridad,href,accion_texto,metadata)
    VALUES (
      NULL,'Nuevo mensaje de cliente en AK Cloud',
      left(concat_ws(' · ',NEW.autor_nombre,NULLIF(trim(NEW.mensaje),'')),300),
      'AK Cloud','info','alta','/ak-cloud/' || NEW.pedido_id::text,'Abrir conversación',
      jsonb_build_object('event_key','akcloud-message-' || NEW.id::text,'event_type','mensaje_cliente','pedido_id',NEW.pedido_id,'mensaje_id',NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_akcore_notify_file_message ON public.file_service_mensajes;
CREATE TRIGGER trg_akcore_notify_file_message
AFTER INSERT ON public.file_service_mensajes
FOR EACH ROW EXECUTE FUNCTION public.akcore_notify_file_message();

CREATE OR REPLACE FUNCTION public.akcore_notify_support_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(NEW.interno,false) = false
     AND lower(COALESCE(NEW.remitente,'')) NOT IN ('admin','autokeys core','staff','tecnico') THEN
    INSERT INTO public.notificaciones(usuario_id,titulo,mensaje,modulo,tipo,prioridad,href,accion_texto,metadata)
    VALUES (
      NULL,'Nuevo mensaje de soporte AK Cloud',left(COALESCE(NEW.mensaje,''),300),
      'AK Cloud','info','alta','/ak-cloud/soporte','Abrir soporte',
      jsonb_build_object('event_key','akcloud-ticket-message-' || NEW.id::text,'event_type','mensaje_soporte','ticket_id',NEW.ticket_id,'mensaje_id',NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_akcore_notify_support_message ON public.akcloud_ticket_mensajes;
CREATE TRIGGER trg_akcore_notify_support_message
AFTER INSERT ON public.akcloud_ticket_mensajes
FOR EACH ROW EXECUTE FUNCTION public.akcore_notify_support_message();

CREATE OR REPLACE FUNCTION public.akcore_notify_portal_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(NEW.visible_distribuidor,true) = true
     AND lower(COALESCE(NEW.autor,'')) NOT IN ('admin','autokeys core','staff','tecnico') THEN
    INSERT INTO public.notificaciones(usuario_id,titulo,mensaje,modulo,tipo,prioridad,href,accion_texto,metadata)
    VALUES (
      NULL,'Nuevo mensaje de distribuidor',left(concat_ws(' · ',NEW.autor,NEW.mensaje),300),
      'AK Cloud','info','alta','/file-service','Abrir File Service',
      jsonb_build_object('event_key','portal-message-' || NEW.id::text,'event_type','mensaje_distribuidor','file_service_id',NEW.file_service_id,'mensaje_id',NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_akcore_notify_portal_message ON public.portal_distribuidor_mensajes;
CREATE TRIGGER trg_akcore_notify_portal_message
AFTER INSERT ON public.portal_distribuidor_mensajes
FOR EACH ROW EXECUTE FUNCTION public.akcore_notify_portal_message();

CREATE OR REPLACE FUNCTION public.akcore_notify_distributor_activated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notificaciones(usuario_id,titulo,mensaje,modulo,tipo,prioridad,href,accion_texto,metadata)
  VALUES (
    NULL,'Distribuidor activado en AK Cloud',
    concat_ws(' · ',COALESCE(NEW.empresa,NEW.nombre_contacto,'Distribuidor'),NEW.email),
    'AK Cloud','success','normal','/ak-cloud/solicitudes','Ver distribuidores',
    jsonb_build_object('event_key','akcloud-distributor-' || NEW.id::text,'event_type','distribuidor_activado','distribuidor_id',NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_akcore_notify_distributor_activated ON public.akcloud_distribuidores;
CREATE TRIGGER trg_akcore_notify_distributor_activated
AFTER INSERT ON public.akcloud_distribuidores
FOR EACH ROW EXECUTE FUNCTION public.akcore_notify_distributor_activated();
