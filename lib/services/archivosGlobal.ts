import { supabase } from '@/lib/supabase'
import type { ArchivoGlobal } from '@/types/archivosGlobal'

function matchText(value: unknown, q: string) {
  return String(value || '').toLowerCase().includes(q)
}

export async function getArchivosGlobales() {
  const { data: archivos, error } = await supabase
    .from('expediente_archivos_pro')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw new Error(error.message)

  const rows = (archivos || []) as ArchivoGlobal[]
  const expedienteIds = Array.from(new Set(rows.map((a) => a.expediente_id).filter(Boolean))) as string[]

  if (!expedienteIds.length) return rows

  const { data: expedientes } = await supabase
    .from('expedientes')
    .select('id,numero_ot,tipo_trabajo,estado,cliente_id,vehiculo_id')
    .in('id', expedienteIds)

  const expedientesList = (expedientes || []) as ArchivoGlobal['expediente'][]
  const expedienteMap = new Map(expedientesList.filter(Boolean).map((e: any) => [e.id, e]))

  const clienteIds = Array.from(new Set(expedientesList.map((e: any) => e?.cliente_id).filter(Boolean))) as string[]
  const vehiculoIds = Array.from(new Set(expedientesList.map((e: any) => e?.vehiculo_id).filter(Boolean))) as string[]

  const [clientesRes, vehiculosRes] = await Promise.all([
    clienteIds.length
      ? supabase.from('clientes').select('id,nombre,telefono').in('id', clienteIds)
      : Promise.resolve({ data: [], error: null } as any),
    vehiculoIds.length
      ? supabase.from('vehiculos').select('id,marca,modelo,matricula,bastidor,ecu').in('id', vehiculoIds)
      : Promise.resolve({ data: [], error: null } as any),
  ])

  const clienteMap = new Map((clientesRes.data || []).map((c: any) => [c.id, c]))
  const vehiculoMap = new Map((vehiculosRes.data || []).map((v: any) => [v.id, v]))

  return rows.map((archivo) => {
    const expediente = archivo.expediente_id ? expedienteMap.get(archivo.expediente_id) : null
    return {
      ...archivo,
      expediente: expediente || null,
      cliente: expediente?.cliente_id ? clienteMap.get(expediente.cliente_id) || null : null,
      vehiculo: expediente?.vehiculo_id ? vehiculoMap.get(expediente.vehiculo_id) || null : null,
    }
  })
}

export function filtrarArchivos(archivos: ArchivoGlobal[], query: string, categoria: string) {
  const q = query.trim().toLowerCase()

  return archivos.filter((archivo) => {
    const okCategoria = categoria === 'TODAS' || archivo.categoria === categoria
    if (!okCategoria) return false
    if (!q) return true

    return [
      archivo.nombre,
      archivo.categoria,
      archivo.ecu,
      archivo.hw,
      archivo.sw,
      archivo.vin,
      archivo.descripcion,
      archivo.notas,
      archivo.expediente?.numero_ot,
      archivo.expediente?.tipo_trabajo,
      archivo.cliente?.nombre,
      archivo.cliente?.telefono,
      archivo.vehiculo?.marca,
      archivo.vehiculo?.modelo,
      archivo.vehiculo?.matricula,
      archivo.vehiculo?.bastidor,
      archivo.vehiculo?.ecu,
    ].some((value) => matchText(value, q))
  })
}

export async function eliminarArchivoGlobal(archivo: ArchivoGlobal) {
  if (archivo.storage_bucket && archivo.storage_path) {
    await supabase.storage.from(archivo.storage_bucket).remove([archivo.storage_path])
  }

  const { error } = await supabase
    .from('expediente_archivos_pro')
    .delete()
    .eq('id', archivo.id)

  if (error) throw new Error(error.message)
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}
