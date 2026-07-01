import { supabase } from '@/lib/supabase'

export type UsuarioRol = 'admin' | 'laboratorio' | 'administracion' | 'distribuidor'

export type UsuarioApp = {
  id: string
  nombre: string
  email: string
  rol: UsuarioRol | string
  activo?: boolean | null
  created_at?: string
}

const TABLE = 'usuarios_app'

export const UsuariosService = {
  async getAll(): Promise<UsuarioApp[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as UsuarioApp[]
  },

  async create(payload: Omit<UsuarioApp, 'id' | 'created_at'>): Promise<UsuarioApp> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        nombre: payload.nombre,
        email: payload.email,
        rol: payload.rol || 'laboratorio',
        activo: payload.activo ?? true,
      })
      .select('*')
      .single()
    if (error) throw error
    return data as UsuarioApp
  },

  async update(id: string, payload: Partial<UsuarioApp>): Promise<UsuarioApp> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        nombre: payload.nombre,
        email: payload.email,
        rol: payload.rol,
        activo: payload.activo,
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as UsuarioApp
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id)
    if (error) throw error
  },
}
