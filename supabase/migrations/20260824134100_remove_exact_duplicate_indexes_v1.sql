-- Remove exact duplicate indexes. Keep one equivalent index for every access path.
DROP INDEX IF EXISTS public.idx_ak_movimientos_user;
DROP INDEX IF EXISTS public.idx_ak_recargas_estado;
DROP INDEX IF EXISTS public.idx_ak_recargas_user;
DROP INDEX IF EXISTS public.idx_file_service_versiones_pedido_version;
DROP INDEX IF EXISTS public.usuarios_app_auth_user_id_uidx;
