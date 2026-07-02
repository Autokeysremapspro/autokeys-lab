import { supabase } from '@/lib/supabase'

export type UsuarioRol = 'admin' | 'laboratorio' | 'administracion' | 'distribuidor'

export type UsuarioApp = {
  id: string
  auth_user_id?: string | null
  nombre: string
  email: string
  telefono?: string | null
  rol: UsuarioRol | string
  activo?: boolean | null
  ultimo_acceso?: string | null
  created_at?: string
}

export type UsuarioCreatePayload = {
  nombre: string
  email: string
  telefono?: string | null
  rol: UsuarioRol | string
  activo?: boolean
  password: string
}

const TABLE = 'usuarios_app'

async function parseApiError(response: Response) {
  const data = await response.json().catch(() => ({}))
  return data?.error || 'Error inesperado'
}

export const UsuariosService = {
  async getAll(): Promise<UsuarioApp[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as UsuarioApp[]
  },

  async create(payload: UsuarioCreatePayload): Promise<UsuarioApp> {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) throw new Error(await parseApiError(response))
    const data = await response.json()
    return data.usuario as UsuarioApp
  },

  async update(id: string, payload: Partial<UsuarioApp>): Promise<UsuarioApp> {
    const response = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })

    if (!response.ok) throw new Error(await parseApiError(response))
    const data = await response.json()
    return data.usuario as UsuarioApp
  },

  async resetPassword(id: string, password: string): Promise<{ linked?: boolean }> {
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    })

    if (!response.ok) throw new Error(await parseApiError(response))
    return response.json().catch(() => ({}))
  },

  async remove(id: string): Promise<void> {
    const response = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error(await parseApiError(response))
  },
}
