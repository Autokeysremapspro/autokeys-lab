import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/supabase/server'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new Error('Faltan credenciales de Supabase')
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function authorizeAdmin() {
  try {
    await requireAdmin()
    return null
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
}

export async function GET() {
  const unauthorized = await authorizeAdmin()
  if (unauthorized) return unauthorized
  try {
    const admin = getAdminClient()
    const { data, error } = await admin.from('ak_laboratory_status').select('*').limit(1).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ status: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error cargando estado del laboratorio' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const unauthorized = await authorizeAdmin()
  if (unauthorized) return unauthorized
  try {
    const body = await request.json()
    const allowed = ['online', 'busy', 'closed']
    const status = String(body.status || 'closed')
    if (!allowed.includes(status)) return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })

    const estimatedRaw = body.estimated_minutes
    const estimated = estimatedRaw === '' || estimatedRaw === null || estimatedRaw === undefined ? null : Number(estimatedRaw)
    if (estimated !== null && (!Number.isFinite(estimated) || estimated < 0 || estimated > 1440)) {
      return NextResponse.json({ error: 'Tiempo estimado no válido' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { data: current, error: currentError } = await admin.from('ak_laboratory_status').select('id').limit(1).single()
    if (currentError) return NextResponse.json({ error: currentError.message }, { status: 400 })

    const patch = {
      status,
      manual_override: Boolean(body.manual_override),
      message: String(body.message || '').trim() || null,
      estimated_minutes: estimated,
      updated_at: new Date().toISOString(),
      changed_at: new Date().toISOString(),
    }

    const { data, error } = await admin.from('ak_laboratory_status').update(patch).eq('id', current.id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ status: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error guardando estado del laboratorio' }, { status: 500 })
  }
}
