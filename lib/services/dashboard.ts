import { supabase } from '@/lib/supabase'

export const DashboardService = {
  async getStats() {
    const [clientes, vehiculos, expedientes, facturas, fileService, stock] = await Promise.all([
      supabase.from('clientes').select('id', { count: 'exact', head: true }),
      supabase.from('vehiculos').select('id', { count: 'exact', head: true }),
      supabase.from('expedientes').select('id,estado,precio_final,created_at'),
      supabase.from('facturas').select('id,total,estado,created_at'),
      supabase.from('file_service').select('id,estado', { count: 'exact' }),
      supabase.from('stock').select('id,cantidad,cantidad_minima'),
    ])

    const errors = [clientes.error, vehiculos.error, expedientes.error, facturas.error, fileService.error, stock.error].filter(Boolean)
    if (errors.length) throw errors[0]

    const exp = expedientes.data || []
    const fac = facturas.data || []
    const fs = fileService.data || []
    const st = stock.data || []
    const today = new Date().toISOString().slice(0, 10)

    return {
      clientes: clientes.count || 0,
      vehiculos: vehiculos.count || 0,
      otAbiertas: exp.filter(e => !['entregado', 'cancelado'].includes(String(e.estado))).length,
      terminadasHoy: exp.filter(e => e.estado === 'terminado' && String(e.created_at || '').startsWith(today)).length,
      facturacionHoy: fac.filter(f => String(f.created_at || '').startsWith(today)).reduce((a, f) => a + Number(f.total || 0), 0),
      pendientesCobro: fac.filter(f => f.estado === 'pendiente').length,
      fileServiceActivos: fs.filter(f => !['finalizado', 'cancelado'].includes(String(f.estado))).length,
      stockBajo: st.filter(s => Number(s.cantidad || 0) <= Number(s.cantidad_minima || 0)).length,
      ultimosExpedientes: exp.slice(0, 6),
    }
  },
}
