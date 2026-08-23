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
    const { usuario } = await requireStaff()
    const body = await request.json()
    const distribuidor_id = String(body.distribuidor_id || '')
    const servicio_id = String(body.servicio_id || '')
    const precio = Number(body.precio)

    if (!distribuidor_id || !servicio_id || !Number.isFinite(precio) || precio < 0) {
      return NextResponse.json({ error: 'Faltan datos válidos (distribuidor, servicio, precio)' }, { status: 400 })
    }

    const admin = adminClient()
    const [{ data: distribuidor }, { data: servicio }, { data: anterior }] = await Promise.all([
      admin.from('akcloud_distribuidores').select('empresa').eq('id', distribuidor_id).maybeSingle(),
      admin.from('akcloud_servicios').select('nombre,precio').eq('id', servicio_id).maybeSingle(),
      admin.from('distribuidor_precios').select('precio').eq('distribuidor_id', distribuidor_id).eq('servicio_id', servicio_id).maybeSingle(),
    ])

    const { data, error } = await admin
      .from('distribuidor_precios')
      .upsert({ distribuidor_id, servicio_id, precio, updated_at: new Date().toISOString() }, { onConflict: 'distribuidor_id,servicio_id' })
      .select('*')
      .single()
    if (error) throw error

    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'distribuidores',
      accion: 'fijar_precio_personalizado',
      descripcion: `${servicio?.nombre || servicio_id} para ${distribuidor?.empresa || distribuidor_id}: ${anterior ? `${anterior.precio} €` : `estándar (${servicio?.precio ?? '—'} €)`} → ${precio} €`,
      entidad: 'distribuidor_precios',
      entidad_id: data.id,
      metadata: { distribuidor_id, servicio_id, precio_anterior: anterior?.precio ?? null, precio_nuevo: precio },
    })

    return NextResponse.json({ precio: data })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando el precio' }, { status })
  }
}

// DELETE /api/distribuidores/precios?id=... — quita el precio manual (vuelve a la tarifa estándar)
export async function DELETE(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Falta el id del precio' }, { status: 400 })

    const admin = adminClient()
    const { data: existente } = await admin.from('distribuidor_precios').select('distribuidor_id,servicio_id,precio').eq('id', id).maybeSingle()

    const { error } = await admin.from('distribuidor_precios').delete().eq('id', id)
    if (error) throw error

    if (existente) {
      const [{ data: distribuidor }, { data: servicio }] = await Promise.all([
        admin.from('akcloud_distribuidores').select('empresa').eq('id', existente.distribuidor_id).maybeSingle(),
        admin.from('akcloud_servicios').select('nombre,precio').eq('id', existente.servicio_id).maybeSingle(),
      ])
      await admin.from('auditoria_core').insert({
        usuario: usuario.nombre,
        usuario_id: usuario.id,
        modulo: 'distribuidores',
        accion: 'quitar_precio_personalizado',
        descripcion: `${servicio?.nombre || existente.servicio_id} para ${distribuidor?.empresa || existente.distribuidor_id}: vuelve a la tarifa estándar (${servicio?.precio ?? '—'} €), dejó de ser ${existente.precio} €`,
        entidad: 'distribuidor_precios',
        entidad_id: id,
        metadata: { distribuidor_id: existente.distribuidor_id, servicio_id: existente.servicio_id, precio_personalizado_eliminado: existente.precio },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error eliminando el precio' }, { status })
  }
}
