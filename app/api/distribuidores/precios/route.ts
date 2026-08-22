import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// PUT /api/distribuidores/precios — fija (o actualiza) el precio manual de un distribuidor para un servicio
export async function PUT(request: Request) {
  try {
    await requireStaff()
    const body = await request.json()
    const distribuidor_id = String(body.distribuidor_id || '')
    const servicio = String(body.servicio || '').trim()
    const precio = Number(body.precio)

    if (!distribuidor_id || !servicio || !Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ error: 'Faltan datos válidos (distribuidor, servicio, precio)' }, { status: 400 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('distribuidor_precios')
      .upsert({ distribuidor_id, servicio, precio, updated_at: new Date().toISOString() }, { onConflict: 'distribuidor_id,servicio' })
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ precio: data })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando el precio' }, { status })
  }
}

// DELETE /api/distribuidores/precios?id=... — quita el precio manual (vuelve a la tarifa estándar)
export async function DELETE(request: Request) {
  try {
    await requireStaff()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id del precio' }, { status: 400 })

    const admin = adminClient()
    const { error } = await admin.from('distribuidor_precios').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error eliminando el precio' }, { status })
  }
}
