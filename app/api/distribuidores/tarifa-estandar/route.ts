import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// GET /api/distribuidores/tarifa-estandar — catálogo real (akcloud_servicios) con nº de distribuidores
// que hoy dependen de la tarifa estándar de cada servicio (no tienen override propio)
export async function GET() {
  try {
    await requireStaff()
    const admin = adminClient()
    const [{ data: servicios, error }, { data: overrides, error: errOverrides }] = await Promise.all([
      admin.from('akcloud_servicios').select('id,nombre,slug,categoria,icono,precio,activo,orden').order('orden', { ascending: true }),
      admin.from('distribuidor_precios').select('servicio_id'),
    ])
    if (error) throw error
    if (errOverrides) throw errOverrides

    const overrideCount = new Map<string, number>()
    for (const o of overrides || []) overrideCount.set(o.servicio_id, (overrideCount.get(o.servicio_id) || 0) + 1)

    return NextResponse.json({
      servicios: (servicios || []).map((s: any) => ({ ...s, distribuidoresConOverride: overrideCount.get(s.id) || 0 })),
    })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando la tarifa estándar' }, { status })
  }
}

// PUT /api/distribuidores/tarifa-estandar — fija el precio estándar (akcloud_servicios.precio) de un servicio.
// Esto es la MISMA tabla que administra AK Cloud > Catálogo/Precios (app/ak-cloud/admin) — no hay una tarifa
// paralela. Los distribuidores con precio personalizado para ese servicio NO se ven afectados.
export async function PUT(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const body = await request.json()
    const servicio_id = String(body.servicio_id || '')
    const precio = Number(body.precio)
    if (!servicio_id || !Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ error: 'Faltan datos válidos (servicio, precio)' }, { status: 400 })
    }

    const admin = adminClient()
    const { data: anterior } = await admin.from('akcloud_servicios').select('nombre,precio').eq('id', servicio_id).maybeSingle()

    const { data, error } = await admin
      .from('akcloud_servicios')
      .update({ precio, updated_at: new Date().toISOString() })
      .eq('id', servicio_id)
      .select('*')
      .single()
    if (error) throw error

    const { count: afectados } = await admin
      .from('distribuidor_precios')
      .select('id', { count: 'exact', head: true })
      .eq('servicio_id', servicio_id)

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'distribuidores',
      accion: 'cambiar_tarifa_estandar',
      descripcion: `Tarifa estándar de "${anterior?.nombre || servicio_id}": ${anterior?.precio ?? '—'} € → ${precio} €`,
      entidad: 'akcloud_servicios',
      entidad_id: servicio_id,
      metadata: { precio_anterior: anterior?.precio ?? null, precio_nuevo: precio },
    })

    return NextResponse.json({ servicio: data, distribuidoresConOverride: afectados || 0 })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando la tarifa estándar' }, { status })
  }
}
