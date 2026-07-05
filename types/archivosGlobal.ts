export type ArchivoGlobal = {
  id: string
  expediente_id: string | null
  nombre: string
  categoria: string
  tipo_mime: string | null
  tamano_bytes: number | null
  storage_bucket: string | null
  storage_path: string | null
  url_publica: string | null
  ecu: string | null
  hw: string | null
  sw: string | null
  vin: string | null
  version: string | null
  descripcion: string | null
  notas: string | null
  creado_por: string | null
  created_at: string | null
  expediente?: {
    id: string
    numero_ot: string | null
    tipo_trabajo: string | null
    estado: string | null
    cliente_id: string | null
    vehiculo_id: string | null
  } | null
  cliente?: {
    id: string
    nombre: string | null
    telefono: string | null
  } | null
  vehiculo?: {
    id: string
    marca: string | null
    modelo: string | null
    matricula: string | null
    bastidor: string | null
    ecu: string | null
  } | null
}

export const ARCHIVO_CATEGORIAS = [
  'TODAS',
  'ORI',
  'MOD',
  'FLASH',
  'EEPROM',
  'MICRO',
  'OTP',
  'PASSWORD',
  'PDF',
  'FOTO',
  'OTRO',
] as const
