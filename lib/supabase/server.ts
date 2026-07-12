import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para usar en Server Components, Route Handlers y Server Actions.
 * Lee la sesión real del usuario a partir de las cookies — a diferencia del cliente
 * de `lib/supabase.ts`, este SÍ sabe quién ha iniciado sesión en el servidor.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Se puede ignorar si se llama desde un Server Component sin permiso de escritura;
            // el middleware se encarga de refrescar la sesión en ese caso.
          }
        },
      },
    }
  )
}

/**
 * Devuelve el usuario autenticado (o null) junto a su ficha en `usuarios_app`,
 * que es la fuente real de rol/permisos dentro de Autokeys Core.
 */
export async function getUsuarioActual() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, usuario: null }

  const { data: usuario } = await supabase
    .from('usuarios_app')
    .select('id, nombre, email, rol, activo, auth_user_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  return { user, usuario }
}

/** Roles que se consideran "staff interno" con acceso al ERP. Ajusta según tu operativa real. */
export const ROLES_STAFF = ['admin', 'desarrollo', 'laboratorio', 'atencion_cliente']

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
