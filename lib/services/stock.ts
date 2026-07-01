import { supabase } from '@/lib/supabase'
import type { MovimientoStock, StockItem } from '@/types/autokeys'

export const StockService = {
  async getAll(): Promise<StockItem[]> {
    const { data, error } = await supabase
      .from('stock')
      .select('*')
      .order('descripcion', { ascending: true })

    if (error) throw error
    return (data || []) as StockItem[]
  },

  async getMovimientosByExpediente(expedienteId: string): Promise<MovimientoStock[]> {
    const { data, error } = await supabase
      .from('movimientos_stock')
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as MovimientoStock[]
  },

  async addMovimiento(payload: {
    stock_id: string
    expediente_id: string
    tipo_movimiento: 'entrada' | 'salida' | 'ajuste'
    cantidad: number
    motivo?: string | null
  }): Promise<MovimientoStock> {
    const { data, error } = await supabase
      .from('movimientos_stock')
      .insert(payload)
      .select('*')
      .single()

    if (error) throw error
    return data as MovimientoStock
  },
}
