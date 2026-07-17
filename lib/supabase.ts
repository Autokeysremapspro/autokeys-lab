import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase del navegador.
 *
 * Durante `next build`, Next.js importa los módulos de los Client Components para
 * prerenderizar rutas. La versión anterior intentaba crear el cliente con cadenas
 * vacías cuando Vercel no exponía las variables al build, provocando que fallasen
 * todas las páginas estáticas.
 *
 * El fallback solo permite completar el build y mostrar un diagnóstico claro. En
 * producción deben existir las variables reales en Vercel.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)?.trim()

export const hasSupabaseBrowserEnv = Boolean(supabaseUrl && supabaseKey)

if (!hasSupabaseBrowserEnv && typeof window !== 'undefined') {
  console.error(
    'AK Core: faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).'
  )
}

const buildSafeUrl = supabaseUrl || 'https://placeholder.supabase.co'
const buildSafeKey = supabaseKey || 'placeholder-public-key'

// createBrowserClient sincroniza la sesión en cookies, que es lo que lee el
// middleware. El fallback evita únicamente que el import rompa `next build`.
export const supabase = createBrowserClient(buildSafeUrl, buildSafeKey)
