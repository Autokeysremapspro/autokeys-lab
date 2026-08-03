import { supabase } from '@/lib/supabase'

export type CanalChat = 'general' | 'laboratorio' | 'administracion'

export type MensajeChatInterno = {
  id: string
  canal: CanalChat
  autor_id: string | null
  autor_nombre: string
  autor_rol: string | null
  mensaje: string
  created_at: string
}

export type PerfilChat = {
  id: string
  nombre: string
  rol: string | null
}

// Perfil del usuario logueado — para firmar los mensajes que envía.
export async function getPerfilActual(): Promise<PerfilChat | null> {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const { data } = await supabase
    .from('usuarios_app')
    .select('id, nombre, rol')
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()

  if (!data) return { id: user.id, nombre: user.email || 'Alguien del equipo', rol: null }
  return data as PerfilChat
}

export async function getMensajes(canal: CanalChat, limit = 50): Promise<MensajeChatInterno[]> {
  const { data, error } = await supabase
    .from('chat_interno_mensajes')
    .select('*')
    .eq('canal', canal)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return ((data || []) as MensajeChatInterno[]).reverse()
}

export async function enviarMensaje(canal: CanalChat, mensaje: string, autor: PerfilChat) {
  const texto = mensaje.trim()
  if (!texto) return

  const { error } = await supabase.from('chat_interno_mensajes').insert({
    canal,
    mensaje: texto.slice(0, 2000),
    autor_id: autor.id,
    autor_nombre: autor.nombre,
    autor_rol: autor.rol,
  })

  if (error) throw error
}

// Suscripción en tiempo real a los mensajes nuevos de un canal.
// Devuelve una función para cancelar la suscripción.
export function suscribirMensajes(canal: CanalChat, onNuevo: (mensaje: MensajeChatInterno) => void) {
  const channel = supabase
    .channel(`chat-interno-${canal}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_interno_mensajes', filter: `canal=eq.${canal}` },
      (payload) => onNuevo(payload.new as MensajeChatInterno)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
