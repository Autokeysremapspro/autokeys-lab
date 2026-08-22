import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// GET /api/distribuidores — listado con ventas por archivo (file_service) y tickets de soporte
export async function GET() {
  try {
    await requireStaff()
    const admin = adminClient()

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [{ data: distribuidores, error }, { data: ventas, error: ventasError }, { data: tickets, error: ticketsError }, { data: precios, error: preciosError }] = await Promise.all([
      admin.from('akcloud_distribuidores').select('*').order('created_at', { ascending: false }),
      admin.from('file_service').select('id,taller,servicio,estado,precio,created_at').gte('created_at', thirtyDaysAgo).order('created_at', { ascending: false }),
      admin.from('distribuidor_tickets').select('*').order('created_at', { ascending: false }),
      admin.from('distribuidor_precios').select('*'),
    ])
    if (error) throw error
    if (ventasError) throw ventasError
    if (ticketsError) throw ticketsError
    if (preciosError) throw preciosError

    const rows = (distribuidores || []).map((d: any) => {
      const empresaLower = String(d.empresa || '').trim().toLowerCase()
      const ventasDistribuidor = empresaLower
        ? (ventas || []).filter((v: any) => String(v.taller || '').trim().toLowerCase() === empresaLower)
        : []
      const facturacion30d = ventasDistribuidor.reduce((a: number, v: any) => a + Number(v.precio || 0), 0)
      const ticketsDistribuidor = (tickets || []).filter((t: any) => t.distribuidor_id === d.id)
      const preciosDistribuidor = (precios || []).filter((p: any) => p.distribuidor_id === d.id)

      return {
        ...d,
        pedidos_30d: ventasDistribuidor.length,
        facturacion_30d: facturacion30d,
        comision_30d: (facturacion30d * Number(d.comision_porcentaje || 0)) / 100,
        ordenes_recientes: ventasDistribuidor.slice(0, 4),
        tickets: ticketsDistribuidor.slice(0, 4),
        tickets_abiertos: ticketsDistribuidor.filter((t: any) => t.estado !== 'cerrado').length,
        precios: preciosDistribuidor,
      }
    })

    const ventasCanal = (ventas || []).reduce((a: number, v: any) => a + Number(v.precio || 0), 0)
    const comisionesCanal = rows.reduce((a: number, r: any) => a + r.comision_30d, 0)

    return NextResponse.json({ distribuidores: rows, ventasCanal, comisionesCanal })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando distribuidores' }, { status })
  }
}

// PATCH /api/distribuidores — actualizar ficha comercial de un distribuidor
export async function PATCH(request: Request) {
  try {
    await requireStaff()
    const body = await request.json()
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'Falta el id del distribuidor' }, { status: 400 })

    const admin = adminClient()
    const payload: Record<string, any> = {}
    const editable = ['nivel', 'descuento_porcentaje', 'comision_porcentaje', 'limite_credito', 'ciudad', 'pais', 'telefono', 'nif', 'estado', 'notas_internas', 'comercial_nombre', 'comercial_telefono', 'comercial_email']
    for (const key of editable) if (key in body) payload[key] = body[key]
    payload.updated_at = new Date().toISOString()

    const { error } = await admin.from('akcloud_distribuidores').update(payload).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error actualizando distribuidor' }, { status })
  }
}
