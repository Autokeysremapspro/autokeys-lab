export type AgendaEvento = {
  id: string
  titulo: string
  tipo: string
  estado: string
  prioridad: string
  fecha_inicio: string
  fecha_fin?: string | null
  cliente_id?: string | null
  vehiculo_id?: string | null
  expediente_id?: string | null
  tecnico?: string | null
  ubicacion?: string | null
  notas?: string | null
  recordatorio_minutos?: number | null
  created_at?: string
  updated_at?: string
  cliente?: { id: string; nombre: string; telefono?: string | null } | null
  vehiculo?: { id: string; marca?: string | null; modelo?: string | null; matricula?: string | null; bastidor?: string | null } | null
  expediente?: { id: string; numero_ot?: string | null; tipo_trabajo?: string | null; estado?: string | null } | null
}

export type AgendaEventoInput = Omit<AgendaEvento, 'id' | 'created_at' | 'updated_at' | 'cliente' | 'vehiculo' | 'expediente'>
