import { supabase } from '@/lib/supabase'
import type { CategoriaGasto, EstadoGasto, Gasto, GastoInput, MetodoPagoGasto, ResumenGastos } from '@/types/gastos'

export const CATEGORIAS_GASTO: { value: CategoriaGasto; label: string }[] = [
  { value: 'stock', label: 'Compra de stock' },
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'software', label: 'Software' },
  { value: 'licencias', label: 'Licencias' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'luz', label: 'Luz' },
  { value: 'internet', label: 'Internet' },
  { value: 'gestoria', label: 'Gestoría' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'material', label: 'Material' },
  { value: 'vehiculo', label: 'Vehículo / desplazamientos' },
  { value: 'otros', label: 'Otros' },
]

export const METODOS_PAGO_GASTO: { value: MetodoPagoGasto; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'bizum', label: 'Bizum' },
  { value: 'domiciliado', label: 'Domiciliado' },
  { value: 'otro', label: 'Otro' },
]

export const ESTADOS_GASTO: { value: EstadoGasto; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'cancelado', label: 'Cancelado' },
]

function calcularImportes(input: GastoInput) {
  const base = Number(input.base_imponible || 0)
  const ivaPorcentaje = Number(input.iva_porcentaje || 0)
  const ivaImporte = Number((base * ivaPorcentaje) / 100)
  const total = Number(base + ivaImporte)

  return {
    base_imponible: Number(base.toFixed(2)),
    iva_porcentaje: Number(ivaPorcentaje.toFixed(2)),
    iva_importe: Number(ivaImporte.toFixed(2)),
    total: Number(total.toFixed(2)),
  }
}

export async function getGastos(): Promise<Gasto[]> {
  const { data, error } = await supabase
    .from('gastos')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data || []) as Gasto[]
}

export async function crearGasto(input: GastoInput): Promise<Gasto> {
  const importes = calcularImportes(input)

  const { data, error } = await supabase
    .from('gastos')
    .insert({
      fecha: input.fecha || new Date().toISOString().slice(0, 10),
      concepto: input.concepto,
      categoria: input.categoria || 'otros',
      proveedor: input.proveedor || null,
      factura_numero: input.factura_numero || null,
      ...importes,
      metodo_pago: input.metodo_pago || 'transferencia',
      estado: input.estado || 'pagado',
      notas: input.notas || null,
      adjunto_url: input.adjunto_url || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await registrarAuditoriaGasto('crear', data?.id, input.concepto)

  return data as Gasto
}

export async function actualizarGasto(id: string, input: GastoInput): Promise<Gasto> {
  const importes = calcularImportes(input)

  const { data, error } = await supabase
    .from('gastos')
    .update({
      fecha: input.fecha || new Date().toISOString().slice(0, 10),
      concepto: input.concepto,
      categoria: input.categoria || 'otros',
      proveedor: input.proveedor || null,
      factura_numero: input.factura_numero || null,
      ...importes,
      metodo_pago: input.metodo_pago || 'transferencia',
      estado: input.estado || 'pagado',
      notas: input.notas || null,
      adjunto_url: input.adjunto_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await registrarAuditoriaGasto('editar', id, input.concepto)

  return data as Gasto
}

export async function eliminarGasto(id: string) {
  const { error } = await supabase.from('gastos').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await registrarAuditoriaGasto('eliminar', id, 'Gasto eliminado')
}

export function resumenGastos(gastos: Gasto[], ingresosMes = 0): ResumenGastos {
  const now = new Date()
  const mes = now.getMonth()
  const anio = now.getFullYear()

  const gastosValidos = gastos.filter((g) => g.estado !== 'cancelado')
  const gastosMes = gastosValidos.filter((g) => {
    const fecha = new Date(g.fecha)
    return fecha.getMonth() === mes && fecha.getFullYear() === anio
  })
  const gastosAnio = gastosValidos.filter((g) => new Date(g.fecha).getFullYear() === anio)

  const totalMes = gastosMes.reduce((sum, g) => sum + Number(g.total || 0), 0)
  const totalAnio = gastosAnio.reduce((sum, g) => sum + Number(g.total || 0), 0)
  const totalHistorico = gastosValidos.reduce((sum, g) => sum + Number(g.total || 0), 0)
  const ivaSoportadoMes = gastosMes.reduce((sum, g) => sum + Number(g.iva_importe || 0), 0)
  const pendientes = gastosValidos.filter((g) => g.estado === 'pendiente').length
  const pagados = gastosValidos.filter((g) => g.estado === 'pagado').length

  return {
    totalMes,
    totalAnio,
    totalHistorico,
    ivaSoportadoMes,
    pendientes,
    pagados,
    beneficioMes: Number(ingresosMes || 0) - totalMes,
  }
}

export function gastoCategoriaLabel(value?: string | null) {
  return CATEGORIAS_GASTO.find((c) => c.value === value)?.label || value || 'Otros'
}

export async function getIngresosMesActual() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('facturas')
    .select('total, fecha, estado')
    .gte('fecha', start)
    .lte('fecha', end)

  if (error) return 0

  return (data || [])
    .filter((f: any) => f.estado !== 'cancelada')
    .reduce((sum: number, f: any) => sum + Number(f.total || 0), 0)
}

async function registrarAuditoriaGasto(accion: string, entidadId: string, descripcion: string) {
  try {
    await supabase.rpc('registrar_auditoria', {
      p_modulo: 'gastos',
      p_accion: accion,
      p_entidad: 'gastos',
      p_entidad_id: entidadId,
      p_descripcion: descripcion,
      p_severidad: accion === 'eliminar' ? 'warning' : 'info',
    })
  } catch {
    // La auditoría no debe bloquear la operación principal.
  }
}
