-- =========================================================
-- AUTOKEYS CORE — Chat interno entre departamentos (Laboratorio / Administración / General)
--
-- Ventanita de chat flotante, visible en todas las pantallas del ERP,
-- para que Laboratorio y Oficina (Administración) se comuniquen sin
-- salir de Core. Un solo hilo por canal, sin conversaciones privadas
-- de momento — es un canal de equipo, no mensajería 1 a 1.
-- =========================================================

create table if not exists public.chat_interno_mensajes (
  id uuid primary key default gen_random_uuid(),
  canal text not null default 'general' check (canal in ('general', 'laboratorio', 'administracion')),
  autor_id uuid references public.usuarios_app(id) on delete set null,
  autor_nombre text not null,
  autor_rol text,
  mensaje text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_interno_mensajes_canal_idx on public.chat_interno_mensajes(canal, created_at);

alter table public.chat_interno_mensajes enable row level security;

-- Solo personal autenticado del ERP puede leer y escribir — no es un canal público.
drop policy if exists "chat_interno_select_auth" on public.chat_interno_mensajes;
create policy "chat_interno_select_auth" on public.chat_interno_mensajes
  for select using (auth.role() = 'authenticated');

drop policy if exists "chat_interno_insert_auth" on public.chat_interno_mensajes;
create policy "chat_interno_insert_auth" on public.chat_interno_mensajes
  for insert with check (auth.role() = 'authenticated');

-- Habilita las actualizaciones en tiempo real para que el chat se
-- actualice solo, sin recargar ni hacer polling. Envuelto en DO para
-- que no falle si esta tabla ya estuviera añadida a la publicación.
do $$
begin
  alter publication supabase_realtime add table public.chat_interno_mensajes;
exception when duplicate_object then
  null;
end $$;

notify pgrst, 'reload schema';
