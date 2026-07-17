import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'

// Rutas accesibles sin sesión: login, registro de distribuidor y su confirmación.
// Todo lo demás es interior de Autokeys Core y exige sesión de staff.
const PUBLIC_PATHS = ['/login', '/register', '/portal-distribuidores', '/solicitud-enviada']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, response } = createMiddlewareSupabaseClient(request)

  // Si faltan variables, no ocultamos el error tras un fallo críptico de Supabase.
  // Las rutas públicas siguen accesibles y el resto redirige al login con diagnóstico.
  if (!supabase) {
    if (isPublicPath(pathname)) return response
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'supabase_env_missing')
    return NextResponse.redirect(loginUrl)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isPublicPath(pathname)) {
    return response
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Sesión válida: comprobamos que sigue siendo staff activo en usuarios_app.
  // (Fuente real de rol — no nos fiamos solo de que exista sesión de Supabase Auth.)
  const { data: usuario } = await supabase
    .from('usuarios_app')
    .select('rol, activo')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!usuario || usuario.activo === false) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'cuenta_no_autorizada')
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto:
     * - archivos estáticos y de Next.js internos
     * - la API (cada route.ts valida su propia autorización con requireStaff/requireAdmin)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)',
  ],
}
