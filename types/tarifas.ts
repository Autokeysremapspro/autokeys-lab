export const TARIFA_CATEGORIAS = ['llaves', 'ecus', 'reparaciones', 'talleres', 'files'] as const

export type TarifaCategoria = (typeof TARIFA_CATEGORIAS)[number]

export type TarifaServicio = {
  id: string
  codigo: string
  categoria: TarifaCategoria
  familia: string | null
  marca: string | null
  modelo: string | null
  anios: string | null
  motor: string | null
  sistema: string | null
  ecu: string | null
  combustible: string | null
  acceso: string | null
  transponder: string | null
  espadin: string | null
  situacion: string | null
  servicio: string
  descripcion: string | null
  pvp: number
  precio_minimo?: number | null
  precio_taller: number | null
  incluye: string | null
  condiciones: string | null
  plazo: string | null
  requiere_laboratorio: boolean
  activo: boolean
  orden: number
  created_at: string
  updated_at: string
}

export type TarifaForm = Omit<TarifaServicio, 'id' | 'codigo' | 'created_at' | 'updated_at' | 'orden'> & {
  id?: string
}
