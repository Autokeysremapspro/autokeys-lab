import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}
function normalize(value: unknown) { return String(value || '').trim().replace(/[^A-Z0-9.\/_-]/gi, '').toUpperCase() || null }

export async function POST(request: Request) {
  try {
    const { user, usuario } = await requireStaff()
    const body = await request.json()
    const sha256 = String(body.sha256 || '').toLowerCase()
    const ecu = String(body.ecu || '').trim()
    const fileSize = Number(body.file_size || 0)
    const hwNormalized = normalize(body.hw)
    const swNormalized = normalize(body.sw)
    if (!/^[a-f0-9]{64}$/.test(sha256)) return NextResponse.json({ error: 'sha256 no válido' }, { status: 400 })
    if (!ecu) return NextResponse.json({ error: 'Indica la ECU real antes de confirmar' }, { status: 400 })

    const admin = adminClient(); const now = new Date().toISOString()
    const { error: fingerprintError } = await admin.from('ak_ecu_fingerprints').upsert({
      sha256, rule_id: body.rule_id || null, vehiculo: body.vehiculo || null, marca: body.marca || null,
      modelo: body.modelo || null, motor: body.motor || null, ecu, hw: body.hw || null, sw: body.sw || null,
      file_size: fileSize || null, pedido_id: body.pedido_id || null, confirmado_por: user.id, updated_at: now,
    }, { onConflict: 'sha256' })
    if (fingerprintError) throw fingerprintError

    let signatureUpdated = false; let distinctEvidence = 0; let duplicateEvidence = false
    if (hwNormalized && swNormalized && fileSize > 0) {
      const signatureKey = `${hwNormalized}|${swNormalized}|${fileSize}|${ecu.toUpperCase()}`
      const { data: existing, error: existingError } = await admin.from('ak_ecu_verified_signatures').select('id').eq('signature_key', signatureKey).maybeSingle()
      if (existingError && existingError.code !== '42P01') throw existingError
      if (!existing) {
        const { error } = await admin.from('ak_ecu_verified_signatures').insert({ signature_key: signatureKey, hw_normalized: hwNormalized, sw_normalized: swNormalized, file_size: fileSize, ecu, vehiculo: body.vehiculo || null, marca: body.marca || null, modelo: body.modelo || null, motor: body.motor || null, confirmaciones: 1, activo: true, ultima_confirmacion_por: user.id })
        if (error) throw error
      }
      const { error: evidenceError } = await admin.from('ak_ecu_signature_evidence').insert({ signature_key: signatureKey, sha256, ecu, pedido_id: body.pedido_id || null, confirmado_por: user.id })
      if (evidenceError && evidenceError.code === '23505') duplicateEvidence = true
      else if (evidenceError) throw evidenceError
      const { count, error: countError } = await admin.from('ak_ecu_signature_evidence').select('sha256', { count: 'exact', head: true }).eq('signature_key', signatureKey)
      if (countError) throw countError
      distinctEvidence = count || 0
      signatureUpdated = !duplicateEvidence
    }

    await admin.from('auditoria_core').insert({ usuario: usuario.nombre, usuario_id: usuario.id, modulo: 'ak_cloud', accion: 'confirmar_ecu_detector', entidad: 'ak_ecu_fingerprints', entidad_id: body.pedido_id || null, metadata: { sha256, ecu, hw: body.hw, sw: body.sw, file_size: fileSize, distinct_evidence: distinctEvidence, duplicate_evidence: duplicateEvidence } })
    return NextResponse.json({ ok: true, fingerprint_saved: true, signature_updated: signatureUpdated, distinct_evidence: distinctEvidence, duplicate_evidence: duplicateEvidence })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error guardando la identificación' }, { status })
  }
}
