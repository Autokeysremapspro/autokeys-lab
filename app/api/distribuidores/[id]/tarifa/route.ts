import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireStaff } from '@/lib/supabase/server'
import { getTarifaDistribuidor } from '@/lib/services/precios'

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// GET /api/distribuidores/[id]/tarifa — catálogo completo con precio efectivo (override o estándar) para este distribuidor
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireStaff()
    const admin = adminClient()
    const servicios = await getTarifaDistribuidor(admin, params.id)
    return NextResponse.json({ servicios })
  } catch (error: any) {
    const status = error.message === 'No autorizado' ? 401 : 500
    return NextResponse.json({ error: error.message || 'Error cargando la tarifa del distribuidor' }, { status })
  }
}
