import { supabase } from '@/lib/supabase'
import type { DocumentoFacturacion, LineaFactura } from '@/types/autokeys'

const FACTURAS = 'facturas'
const LINEAS = 'lineas_factura'

export const FacturacionService = {
  async getByExpediente(expedienteId: string): Promise<DocumentoFacturacion[]> {
    const { data, error } = await supabase
      .from(FACTURAS)
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    const docs = (data || []) as DocumentoFacturacion[]

    if (!docs.length) return []

    const ids = docs.map(d => d.id)
    const { data: lineasData, error: lineasError } = await supabase
      .from(LINEAS)
      .select('*')
      .in('factura_id', ids)
      .order('created_at', { ascending: true })

    if (lineasError) throw lineasError

    const grouped = new Map<string, LineaFactura[]>()
    ;((lineasData || []) as LineaFactura[]).forEach(linea => {
      const arr = grouped.get(linea.factura_id) || []
      arr.push(linea)
      grouped.set(linea.factura_id, arr)
    })

    return docs.map(doc => ({ ...doc, lineas: grouped.get(doc.id) || [] }))
  },

  async createDocumento(payload: {
    expediente_id: string
    cliente_id?: string | null
    tipo_documento: 'factura' | 'presupuesto' | 'albaran' | 'ticket'
    iva_porcentaje?: number
    notas?: string | null
  }): Promise<DocumentoFacturacion> {
    const { data, error } = await supabase
      .from(FACTURAS)
      .insert({
        expediente_id: payload.expediente_id,
        cliente_id: payload.cliente_id || null,
        tipo_documento: payload.tipo_documento,
        iva_porcentaje: payload.iva_porcentaje ?? 21,
        notas: payload.notas || null,
        estado: 'pendiente',
      })
      .select('*')
      .single()

    if (error) throw error
    return data as DocumentoFacturacion
  },

  async updateDocumento(id: string, payload: Partial<DocumentoFacturacion>): Promise<DocumentoFacturacion> {
    const { data, error } = await supabase
      .from(FACTURAS)
      .update({
        tipo_documento: payload.tipo_documento,
        iva_porcentaje: payload.iva_porcentaje,
        estado: payload.estado,
        notas: payload.notas,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as DocumentoFacturacion
  },

  async addLinea(payload: {
    factura_id: string
    concepto: string
    descripcion?: string | null
    cantidad?: number
    precio_unitario?: number
  }): Promise<LineaFactura> {
    const { data, error } = await supabase
      .from(LINEAS)
      .insert({
        factura_id: payload.factura_id,
        concepto: payload.concepto,
        descripcion: payload.descripcion || null,
        cantidad: payload.cantidad ?? 1,
        precio_unitario: payload.precio_unitario ?? 0,
      })
      .select('*')
      .single()

    if (error) throw error
    return data as LineaFactura
  },

  async updateLinea(id: string, payload: Partial<LineaFactura>): Promise<LineaFactura> {
    const { data, error } = await supabase
      .from(LINEAS)
      .update({
        concepto: payload.concepto,
        descripcion: payload.descripcion,
        cantidad: payload.cantidad,
        precio_unitario: payload.precio_unitario,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data as LineaFactura
  },

  async deleteLinea(id: string): Promise<void> {
    const { error } = await supabase.from(LINEAS).delete().eq('id', id)
    if (error) throw error
  },

  async deleteDocumento(id: string): Promise<void> {
    const { error } = await supabase.from(FACTURAS).delete().eq('id', id)
    if (error) throw error
  },
}
