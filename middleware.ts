import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'

// Rutas accesibles sin sesión. Autokeys Lab es el ERP interno del staff —
// nadie externo debe poder darse de alta aquí, así que /register y
// /solicitud-enviada NO son públicas: el alta real de distribuidor es AK
// Cloud (autokeys-file-service.), que ya tiene su propio formulario público.
// Se deja el código de /register en el repo (sin enlazar ni exponer) para
// cuando este ERP se venda como producto propio a otras empresas y cada una
// necesite dar de alta a sus propios distribuidores desde su instancia.
const PUBLIC_PATHS = ['/login', '/portal-distribuidores', '/restablecer-password']

// Cuenta de distribuidor: exige sesión, pero NO staff en usuarios_app —
// un distribuidor activo en akcloud_distribuidores puede entrar aquí.
const DISTRIBUIDOR_PATHS = ['/mi-cuenta']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

function isDistribuidorPath(pathname: string) {
  return DISTRIBUIDOR_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, response } = createMiddlewareSupabaseClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isPublicPath(pathname)) {
    return response
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    // pathname + search: un enlace de notificación como /ak-cloud/soporte?ticket=…
    // (p. ej. al abrir el push desde el móvil sin sesión activa) debe volver
    // exactamente al mismo ticket tras iniciar sesión, no a la bandeja general.
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  if (isDistribuidorPath(pathname)) {
    const { data: distribuidor } = await supabase
      .from('akcloud_distribuidores')
      .select('estado')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!distribuidor || distribuidor.estado !== 'activo') {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'cuenta_no_autorizada')
      return NextResponse.redirect(loginUrl)
    }

    return response
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
     * - service worker / manifest PWA (deben poder cargarse sin pasar por login)
     * - la API (cada route.ts valida su propia autorización con requireStaff/requireAdmin)
     */
    '/((?!_next/static|_next/image|favicon.ico|akcore-push-sw.js|manifest.webmanifest|api|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)',
  ],
}
