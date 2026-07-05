export type BibliotecaTecnica = {
  id: string
  titulo: string
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  anio?: number | null
  ecu?: string | null
  hardware?: string | null
  software?: string | null
  tipo_trabajo?: string | null
  herramienta?: string | null
  dificultad?: number | null
  tiempo_minutos?: number | null
  sintomas?: string | null
  solucion?: string | null
  notas?: string | null
  tags?: string[] | null
  destacado?: boolean | null
  solucion_definitiva?: boolean | null
  expediente_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type BibliotecaPayload = Omit<Partial<BibliotecaTecnica>, 'id' | 'created_at' | 'updated_at'>
