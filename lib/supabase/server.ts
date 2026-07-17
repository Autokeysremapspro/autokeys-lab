import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getServerSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim()

  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) en Vercel.'
    )
  }

  return { url, key }
}

/** Cliente Supabase para Server Components, Route Handlers y Server Actions. */
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  const { url, key } = getServerSupabaseEnv()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Los Server Components no siempre pueden escribir cookies. El middleware
          // refresca la sesión en la siguiente petición.
        }
      },
    },
  })
}

export async function getUsuarioActual() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { user: null, usuario: null }

  const { data: usuario } = await supabase
    .from('usuarios_app')
    .select('id, nombre, email, rol, activo, auth_user_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return { user, usuario }
}

export const ROLES_STAFF = ['admin', 'desarrollo', 'laboratorio', 'administracion', 'atencion_cliente']

export async function requireStaff() {
  const { user, usuario } = await getUsuarioActual()
  if (!user || !usuario || usuario.activo === false || !ROLES_STAFF.includes(usuario.rol)) {
    throw new Error('No autorizado')
  }
  return { user, usuario }
}

export async function requireAdmin() {
  const { user, usuario } = await getUsuarioActual()
  if (!user || !usuario || usuario.activo === false || usuario.rol !== 'admin') {
    throw new Error('No autorizado')
  }
  return { user, usuario }
}
