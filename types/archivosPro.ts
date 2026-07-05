export type ArchivoProCategoria =
  | 'ORI'
  | 'MOD'
  | 'FLASH'
  | 'EEPROM'
  | 'MICRO'
  | 'OTP'
  | 'PASSWORD'
  | 'PDF'
  | 'FOTO'
  | 'OTRO'

export type ExpedienteArchivoPro = {
  id: string
  expediente_id: string
  nombre: string
  categoria: ArchivoProCategoria
  tipo_mime?: string | null
  tamano_bytes?: number | null
  storage_bucket: string
  storage_path: string
  url_publica?: string | null
  ecu?: string | null
  hw?: string | null
  sw?: string | null
  vin?: string | null
  version?: string | null
  descripcion?: string | null
  notas?: string | null
  creado_por?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export const ARCHIVO_PRO_CATEGORIAS: ArchivoProCategoria[] = [
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
]
