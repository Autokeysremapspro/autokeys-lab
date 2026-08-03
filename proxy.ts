import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'
import { isStaffRole } from '@/lib/authz'

const PUBLIC_PATHS = ['/login', '/register', '/portal-distribuidores', '/solicitud-enviada']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, response } = createMiddlewareSupabaseClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (isPublicPath(pathname)) return response

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: usuario } = await supabase
    .from('usuarios_app')
    .select('rol, activo')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!usuario || usuario.activo === false || !isStaffRole(usuario.rol)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'cuenta_no_autorizada')
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)'],
}
