-- AK Core: avisos en tiempo real desde AK Cloud.
-- file_service_pedidos ya estaba publicado; añadimos mensajes del cliente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'file_service_mensajes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.file_service_mensajes;
  END IF;
END $$;
