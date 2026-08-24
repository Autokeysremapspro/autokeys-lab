import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET(request: Request) {
  try {
    await requireStaff()
    const distribuidorId = new URL(request.url).searchParams.get('distribuidor_id')
    if (!distribuidorId) return NextResponse.json({ error: 'Falta distribuidor_id' }, { status: 400 })

    const admin = adminClient()
    const [{ data: reglas, error: reglasError }, { data: servicios, error: serviciosError }] = await Promise.all([
      admin
        .from('distribuidor_precios_condicionales')
        .select('id,distribuidor_id,servicio_id,requiere_servicio_id,precio,activo,created_at,updated_at')
        .eq('distribuidor_id', distribuidorId)
        .order('created_at', { ascending: true }),
      admin
        .from('akcloud_servicios')
        .select('id,nombre,slug,categoria,precio,orden,activo')
        .eq('activo', true)
        .order('orden', { ascending: true }),
    ])
    if (reglasError) throw reglasError
    if (serviciosError) throw serviciosError

    return NextResponse.json({ reglas: reglas || [], servicios: servicios || [] })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando las reglas condicionales' }, { status })
  }
}

export async function PUT(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const body = await request.json()
    const distribuidorId = String(body.distribuidor_id || '')
    const servicioId = String(body.servicio_id || '')
    const requiereServicioId = String(body.requiere_servicio_id || '')
    const precio = Number(body.precio)

    if (!distribuidorId || !servicioId || !requiereServicioId || servicioId === requiereServicioId || !Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ error: 'Indica distribuidor, servicio, condición y un precio válido' }, { status: 400 })
    }

    const admin = adminClient()
    const [{ data: distribuidor }, { data: servicio }, { data: requiere }, { data: anterior }] = await Promise.all([
      admin.from('akcloud_distribuidores').select('empresa').eq('id', distribuidorId).maybeSingle(),
      admin.from('akcloud_servicios').select('nombre').eq('id', servicioId).maybeSingle(),
      admin.from('akcloud_servicios').select('nombre').eq('id', requiereServicioId).maybeSingle(),
      admin
        .from('distribuidor_precios_condicionales')
        .select('id,precio,activo')
        .eq('distribuidor_id', distribuidorId)
        .eq('servicio_id', servicioId)
        .eq('requiere_servicio_id', requiereServicioId)
        .maybeSingle(),
    ])

    if (!distribuidor || !servicio || !requiere) {
      return NextResponse.json({ error: 'Distribuidor o servicio no válido' }, { status: 404 })
    }

    const { data, error } = await admin
      .from('distribuidor_precios_condicionales')
      .upsert({
        distribuidor_id: distribuidorId,
        servicio_id: servicioId,
        requiere_servicio_id: requiereServicioId,
        precio,
        activo: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'distribuidor_id,servicio_id,requiere_servicio_id' })
      .select('*')
      .single()
    if (error) throw error

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'distribuidores',
      accion: anterior ? 'actualizar_precio_condicional' : 'crear_precio_condicional',
      descripcion: `${servicio.nombre} para ${distribuidor.empresa}: ${precio} € cuando el pedido incluye ${requiere.nombre}`,
      entidad: 'distribuidor_precios_condicionales',
      entidad_id: data.id,
      metadata: {
        distribuidor_id: distribuidorId,
        servicio_id: servicioId,
        requiere_servicio_id: requiereServicioId,
        precio_anterior: anterior?.precio ?? null,
        precio_nuevo: precio,
      },
    })

    return NextResponse.json({ regla: data })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando la regla condicional' }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id de la regla' }, { status: 400 })

    const admin = adminClient()
    const { data: existente } = await admin
      .from('distribuidor_precios_condicionales')
      .select('id,distribuidor_id,servicio_id,requiere_servicio_id,precio')
      .eq('id', id)
      .maybeSingle()

    if (!existente) return NextResponse.json({ ok: true })

    const [{ data: distribuidor }, { data: servicio }, { data: requiere }] = await Promise.all([
      admin.from('akcloud_distribuidores').select('empresa').eq('id', existente.distribuidor_id).maybeSingle(),
      admin.from('akcloud_servicios').select('nombre').eq('id', existente.servicio_id).maybeSingle(),
      admin.from('akcloud_servicios').select('nombre').eq('id', existente.requiere_servicio_id).maybeSingle(),
    ])

    const { error } = await admin.from('distribuidor_precios_condicionales').delete().eq('id', id)
    if (error) throw error

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'distribuidores',
      accion: 'eliminar_precio_condicional',
      descripcion: `Eliminada regla: ${servicio?.nombre || existente.servicio_id} = ${existente.precio} € con ${requiere?.nombre || existente.requiere_servicio_id} para ${distribuidor?.empresa || existente.distribuidor_id}`,
      entidad: 'distribuidor_precios_condicionales',
      entidad_id: id,
      metadata: existente,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error eliminando la regla condicional' }, { status })
  }
}
