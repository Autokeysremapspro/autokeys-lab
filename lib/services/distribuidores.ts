import { supabase } from '@/lib/supabase'

export type SolicitudDistribuidor = {
  id: string
  auth_user_id: string | null
  email: string
  empresa: string
  nombre: string
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'informacion_solicitada'
  motivo_estado: string | null
  created_at: string
}

export async function getMiSolicitud(): Promise<SolicitudDistribuidor | null> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  const { data, error } = await supabase
    .from('akcloud_solicitudes_distribuidores')
    .select('id,auth_user_id,email,empresa,nombre,estado,motivo_estado,created_at')
    .eq('auth_user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data || null) as SolicitudDistribuidor | null
}

export function rutaPorEstado(estado?: SolicitudDistribuidor['estado'] | null) {
  if (estado === 'pendiente') return '/solicitud-enviada?estado=pendiente'
  if (estado === 'rechazada') return '/solicitud-enviada?estado=rechazada'
  if (estado === 'informacion_solicitada') return '/solicitud-enviada?estado=informacion'
  return '/dashboard'
}
