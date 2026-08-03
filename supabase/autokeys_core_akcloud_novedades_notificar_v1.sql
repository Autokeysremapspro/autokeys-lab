-- AK Cloud Novedades — Notificar automáticamente al marcar una novedad
-- como Destacada + Activa. Usa la campanita de notificaciones que ya
-- existe en el portal (file_service_notificaciones /
-- crear_file_service_notificacion, creada en AK Cloud v3.7).
--
-- Requisito: haber ejecutado ya la migración del portal que crea
-- crear_file_service_notificacion (v3.7_notificaciones.sql). Si nunca
-- se ejecutó, este trigger fallará al dispararse.
--
-- Solo notifica en la TRANSICIÓN hacia destacada+activa (alta nueva, o
-- edición que la activa/destaca por primera vez) — no en cada guardado
-- posterior, para no spamear con cada retoque de texto.

create or replace function public.notificar_novedad_destacada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  ya_notificada boolean;
begin
  ya_notificada := (tg_op = 'UPDATE' and coalesce(old.destacado, false) = true and coalesce(old.activo, false) = true);

  if coalesce(new.destacado, false) = true and coalesce(new.activo, false) = true and not ya_notificada then
    for r in select auth_user_id from public.akcloud_distribuidores where estado = 'activo' loop
      perform crear_file_service_notificacion(
        r.auth_user_id,
        null,
        new.titulo,
        new.contenido,
        'info',
        jsonb_build_object('novedad_id', new.id, 'origen', 'novedad_destacada')
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notificar_novedad_destacada on public.akcloud_novedades;
create trigger trg_notificar_novedad_destacada
after insert or update of destacado, activo, titulo, contenido on public.akcloud_novedades
for each row execute function public.notificar_novedad_destacada();
