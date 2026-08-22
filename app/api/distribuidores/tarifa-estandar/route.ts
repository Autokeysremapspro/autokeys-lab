import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// GET /api/distribuidores/tarifa-estandar — tarifa de catálogo (visible para todos los distribuidores)
export async function GET() {
  try {
    await requireStaff()
    const admin = adminClient()
    const { data, error } = await admin.from('precios_estandar').select('*').order('servicio')
    if (error) throw error
    return NextResponse.json({ precios: data || [] })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando la tarifa estándar' }, { status })
  }
}

// PUT /api/distribuidores/tarifa-estandar — fija el precio de catálogo de un servicio
export async function PUT(request: Request) {
  try {
    await requireStaff()
    const body = await request.json()
    const servicio = String(body.servicio || '').trim()
    const precio = Number(body.precio)
    if (!servicio || !Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ error: 'Faltan datos válidos (servicio, precio)' }, { status: 400 })
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('precios_estandar')
      .upsert({ servicio, precio, updated_at: new Date().toISOString() }, { onConflict: 'servicio' })
      .select('*')
      .single()
    if (error) throw error
    return NextResponse.json({ precio: data })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando la tarifa estándar' }, { status })
  }
}
