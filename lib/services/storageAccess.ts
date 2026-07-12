import { supabase } from '@/lib/supabase'

/**
 * Genera una URL de acceso temporal (10 min) a un archivo privado.
 * Sustituye a getPublicUrl() ahora que los buckets de expedientes son privados —
 * una URL firmada exige que quien la pida cumpla la política RLS de Storage
 * (en la práctica: ser staff), y caduca sola en vez de quedar accesible para siempre.
 */
export async function getSignedFileUrl(bucket: string, path: string, expiresInSeconds = 600) {
  if (!bucket || !path) return null
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
  if (error) {
    console.warn('No se pudo generar la URL firmada:', error.message)
    return null
  }
  return data.signedUrl
}
