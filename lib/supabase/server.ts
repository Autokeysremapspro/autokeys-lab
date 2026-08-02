import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isStaffRole, type StaffRole } from '@/lib/authz'

/**
 * Cliente Supabase para usar en Server Components, Route Handlers y Server Actions.
 * Lee la sesión real del usuario a partir de las cookies — a diferencia del cliente
 * de `lib/supabase.ts`, este SÍ sabe quién ha iniciado sesión en el servidor.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

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
  const supabase = await createServerSupabaseClient()
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
export async function requireStaff() {
  const { user, usuario } = await getUsuarioActual()
  if (!user || !usuario || usuario.activo === false || !isStaffRole(usuario.rol)) {
    throw new Error('No autorizado')
  }
  return { user, usuario }
}

export async function requireRole(...roles: StaffRole[]) {
  const context = await requireStaff()
  if (!roles.includes(context.usuario.rol as StaffRole)) throw new Error('No autorizado')
  return context
}

export async function requireAdmin() {
  return requireRole('admin')
}
