import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan variables de entorno de Supabase')
}

// createBrowserClient (en vez de createClient) sincroniza la sesión en cookies,
// que es lo que lee middleware.ts en el servidor. Con createClient normal la
// sesión solo vivía en localStorage y el middleware nunca la veía.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
