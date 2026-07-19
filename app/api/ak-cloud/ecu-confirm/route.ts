import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function normalize(value: unknown) {
  return String(value || '').trim().replace(/[^A-Z0-9.\/_-]/gi, '').toUpperCase() || null
}

// POST /api/ak-cloud/ecu-confirm
// Equivalente al /api/ecu/confirm de AK Cloud, pero ejecutado desde Core —
// que es donde el laboratorio trabaja realmente cada pedido. Antes este
// "enseñar al detector" solo existía en /admin/pedidos/[id] de AK Cloud,
// una pantalla que el laboratorio no usa en el día a día, así que la base
// de firmas verificadas nunca llegaba a acumular confirmaciones.
//
// Misma política estricta que en AK Cloud: guarda siempre la huella exacta
// (sha256) del archivo, y solo cuando hay HW + SW + tamaño incrementa una
// firma verificada. Esa firma no se usa para identificar automáticamente
// hasta alcanzar el mínimo de confirmaciones definido en el detector.
export async function POST(request: Request) {
  try {
    const { usuario } = await requireStaff()
    const body = await request.json()
    const sha256 = String(body.sha256 || '').toLowerCase()
    const ecu = String(body.ecu || '').trim()
    const fileSize = Number(body.file_size || 0)
    const hwNormalized = normalize(body.hw)
    const swNormalized = normalize(body.sw)

    if (!/^[a-f0-9]{64}$/.test(sha256)) {
      return NextResponse.json({ error: 'sha256 no válido' }, { status: 400 })
    }
    if (!ecu) {
      return NextResponse.json({ error: 'Indica la ECU real antes de confirmar' }, { status: 400 })
    }

    const admin = adminClient()
    const now = new Date().toISOString()

    const { error: fingerprintError } = await admin.from('ak_ecu_fingerprints').upsert(
      {
        sha256,
        rule_id: body.rule_id || null,
        vehiculo: body.vehiculo || null,
        marca: body.marca || null,
        modelo: body.modelo || null,
        motor: body.motor || null,
        ecu,
        hw: body.hw || null,
        sw: body.sw || null,
        file_size: fileSize || null,
        pedido_id: body.pedido_id || null,
        confirmado_por: usuario.id,
        updated_at: now,
      },
      { onConflict: 'sha256' }
    )
    if (fingerprintError) throw fingerprintError

    let signatureUpdated = false
    if (hwNormalized && swNormalized && fileSize > 0) {
      const signatureKey = `${hwNormalized}|${swNormalized}|${fileSize}|${ecu.toUpperCase()}`
      const { data: existing, error: existingError } = await admin
        .from('ak_ecu_verified_signatures')
        .select('id, confirmaciones')
        .eq('signature_key', signatureKey)
        .maybeSingle()
      if (existingError && existingError.code !== '42P01') throw existingError

      if (existing) {
        const { error } = await admin
          .from('ak_ecu_verified_signatures')
          .update({
            confirmaciones: Number(existing.confirmaciones || 0) + 1,
            vehiculo: body.vehiculo || null,
            marca: body.marca || null,
            modelo: body.modelo || null,
            motor: body.motor || null,
            updated_at: now,
            ultima_confirmacion_por: usuario.id,
          })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await admin.from('ak_ecu_verified_signatures').insert({
          signature_key: signatureKey,
          hw_normalized: hwNormalized,
          sw_normalized: swNormalized,
          file_size: fileSize,
          ecu,
          vehiculo: body.vehiculo || null,
          marca: body.marca || null,
          modelo: body.modelo || null,
          motor: body.motor || null,
          confirmaciones: 1,
          activo: true,
          ultima_confirmacion_por: usuario.id,
        })
        if (error && error.code !== '42P01') throw error
      }
      signatureUpdated = true
    }

    // Auditoría en Core: queda constancia de qué técnico enseñó esta ECU al detector
    await admin.from('auditoria_core').insert({
      usuario: usuario.nombre,
      usuario_id: usuario.id,
      modulo: 'ak_cloud',
      accion: 'confirmar_ecu_detector',
      entidad: 'ak_ecu_fingerprints',
      entidad_id: body.pedido_id || null,
      metadata: { sha256, ecu, hw: body.hw, sw: body.sw, file_size: fileSize },
    })

    return NextResponse.json({ ok: true, fingerprint_saved: true, signature_updated: signatureUpdated })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando la identificación' }, { status })
  }
}
