import { supabase } from '@/lib/supabase'

export type SearchResult = {
  id: string
  type: 'cliente' | 'vehiculo' | 'expediente' | 'factura' | 'stock' | 'file_service'
  title: string
  subtitle: string
  href: string
  badge?: string
}

function safeQuery(value: string) {
  return value.trim().replaceAll('%', '').replaceAll(',', ' ')
}

function ilike(value: string) {
  return `%${safeQuery(value)}%`
}

export async function globalSearch(rawQuery: string): Promise<SearchResult[]> {
  const query = safeQuery(rawQuery)
  if (query.length < 2) return []

  const q = ilike(query)

  const [clientes, vehiculos, expedientes, facturas, stock, fileService] = await Promise.all([
    supabase
      .from('clientes')
      .select('id,nombre,telefono,email,nif')
      .or(`nombre.ilike.${q},telefono.ilike.${q},email.ilike.${q},nif.ilike.${q}`)
      .limit(6),

    supabase
      .from('vehiculos')
      .select('id,marca,modelo,motor,matricula,bastidor,ecu,cliente_id')
      .or(`marca.ilike.${q},modelo.ilike.${q},motor.ilike.${q},matricula.ilike.${q},bastidor.ilike.${q},ecu.ilike.${q}`)
      .limit(6),

    supabase
      .from('expedientes')
      .select('id,numero_ot,tipo_trabajo,estado,prioridad,tecnico,descripcion')
      .or(`numero_ot.ilike.${q},tipo_trabajo.ilike.${q},estado.ilike.${q},prioridad.ilike.${q},tecnico.ilike.${q},descripcion.ilike.${q}`)
      .limit(6),

    supabase
      .from('facturas')
      .select('id,numero_documento,tipo_documento,estado,total,fecha')
      .or(`numero_documento.ilike.${q},tipo_documento.ilike.${q},estado.ilike.${q},notas.ilike.${q}`)
      .limit(6),

    supabase
      .from('stock')
      .select('id,tipo,referencia,descripcion,marca,modelo,cantidad,ubicacion')
      .or(`tipo.ilike.${q},referencia.ilike.${q},descripcion.ilike.${q},marca.ilike.${q},modelo.ilike.${q},ubicacion.ilike.${q}`)
      .limit(6),

    supabase
      .from('file_service')
      .select('id,taller,marca,modelo,motor,matricula,ecu,hw,sw,servicio,estado,precio,pagado')
      .or(`taller.ilike.${q},marca.ilike.${q},modelo.ilike.${q},motor.ilike.${q},matricula.ilike.${q},ecu.ilike.${q},hw.ilike.${q},sw.ilike.${q},servicio.ilike.${q}`)
      .limit(6),
  ])

  const errors = [clientes.error, vehiculos.error, expedientes.error, facturas.error, stock.error, fileService.error].filter(Boolean)
  if (errors.length) throw errors[0]

  const results: SearchResult[] = []

  for (const c of clientes.data || []) {
    results.push({
      id: `cliente-${c.id}`,
      type: 'cliente',
      title: c.nombre || 'Cliente sin nombre',
      subtitle: [c.telefono, c.email, c.nif].filter(Boolean).join(' · ') || 'Cliente',
      href: `/clientes/${c.id}`,
      badge: 'Cliente',
    })
  }

  for (const v of vehiculos.data || []) {
    results.push({
      id: `vehiculo-${v.id}`,
      type: 'vehiculo',
      title: [v.marca, v.modelo, v.matricula].filter(Boolean).join(' ') || 'Vehículo',
      subtitle: [v.motor, v.bastidor, v.ecu].filter(Boolean).join(' · ') || 'Vehículo',
      href: `/vehiculos/${v.id}`,
      badge: 'Vehículo',
    })
  }

  for (const e of expedientes.data || []) {
    results.push({
      id: `expediente-${e.id}`,
      type: 'expediente',
      title: e.numero_ot || 'Expediente',
      subtitle: [e.tipo_trabajo, e.estado, e.tecnico].filter(Boolean).join(' · ') || 'OT',
      href: `/expedientes/${e.id}`,
      badge: e.prioridad === 'urgente' ? 'Urgente' : 'OT',
    })
  }

  for (const f of facturas.data || []) {
    results.push({
      id: `factura-${f.id}`,
      type: 'factura',
      title: f.numero_documento || 'Documento',
      subtitle: [f.tipo_documento, f.estado, `${Number(f.total || 0).toFixed(2)} €`].filter(Boolean).join(' · '),
      href: '/facturas',
      badge: 'Factura',
    })
  }

  for (const s of stock.data || []) {
    results.push({
      id: `stock-${s.id}`,
      type: 'stock',
      title: s.referencia || s.descripcion || 'Stock',
      subtitle: [s.tipo, s.marca, s.modelo, `Cantidad: ${s.cantidad ?? 0}`].filter(Boolean).join(' · '),
      href: '/stock',
      badge: 'Stock',
    })
  }

  for (const fs of fileService.data || []) {
    results.push({
      id: `file-${fs.id}`,
      type: 'file_service',
      title: [fs.taller, fs.matricula].filter(Boolean).join(' · ') || 'File Service',
      subtitle: [fs.servicio, fs.ecu, fs.hw, fs.sw, fs.estado].filter(Boolean).join(' · '),
      href: '/file-service',
      badge: 'File Service',
    })
  }

  return results.slice(0, 20)
}
