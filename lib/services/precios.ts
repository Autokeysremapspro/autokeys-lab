import type { SupabaseClient } from '@supabase/supabase-js'

// Fuente única de verdad para el precio de un servicio del catálogo AK Cloud
// (akcloud_servicios) frente a un distribuidor concreto:
//
//   precioEfectivo = precioPersonalizado(distribuidor, servicio) ?? tarifaEstandar(servicio)
//
// Se usa tanto desde el admin (Distribuidores > Precios, con el cliente de
// service role) como desde el propio distribuidor (mi-cuenta, con el cliente
// del navegador sujeto a RLS — solo ve sus propios overrides).

export type ServicioConPrecio = {
  id: string
  nombre: string
  slug: string
  categoria: string
  icono: string | null
  tarifaEstandar: number
  precioEfectivo: number
  personalizado: boolean
  overrideId: string | null
}

export async function getTarifaDistribuidor(client: SupabaseClient, distribuidorId: string): Promise<ServicioConPrecio[]> {
  const [{ data: servicios, error: errServicios }, { data: overrides, error: errOverrides }] = await Promise.all([
    client.from('akcloud_servicios').select('id,nombre,slug,categoria,icono,precio,orden').eq('activo', true).order('orden', { ascending: true }),
    client.from('distribuidor_precios').select('id,servicio_id,precio').eq('distribuidor_id', distribuidorId),
  ])
  if (errServicios) throw errServicios
  if (errOverrides) throw errOverrides

  const overrideMap = new Map((overrides || []).map((o: any) => [o.servicio_id, o]))

  return (servicios || []).map((s: any) => {
    const override = overrideMap.get(s.id)
    const tarifaEstandar = Number(s.precio || 0)
    return {
      id: s.id,
      nombre: s.nombre,
      slug: s.slug,
      categoria: s.categoria,
      icono: s.icono,
      tarifaEstandar,
      precioEfectivo: override ? Number(override.precio) : tarifaEstandar,
      personalizado: Boolean(override),
      overrideId: override?.id || null,
    }
  })
}

export async function getPrecioEfectivo(client: SupabaseClient, distribuidorId: string, servicioId: string): Promise<number> {
  const [{ data: override, error: errOverride }, { data: servicio, error: errServicio }] = await Promise.all([
    client.from('distribuidor_precios').select('precio').eq('distribuidor_id', distribuidorId).eq('servicio_id', servicioId).maybeSingle(),
    client.from('akcloud_servicios').select('precio').eq('id', servicioId).single(),
  ])
  if (errServicio) throw errServicio
  if (errOverride) throw errOverride
  return override ? Number(override.precio) : Number(servicio!.precio)
}

export const CATEGORIA_LABELS: Record<string, string> = {
  coches: 'Coches',
  motos: 'Motos',
  agricola: 'Agrícola',
  camion: 'Camión',
  especiales: 'Servicios especiales',
}
