# AK Core v2 — Supabase / Vercel Build Fix

## Qué corrige

- Evita que `lib/supabase.ts` rompa `next build` al importarse durante el prerender.
- Acepta tanto `NEXT_PUBLIC_SUPABASE_ANON_KEY` como la nueva `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Añade validación explícita para clientes server y middleware.
- Evita errores crípticos de `@supabase/ssr` cuando falte configuración.

## Variables obligatorias en Vercel

En **Autokeys Core → Settings → Environment Variables**, configura para Production y Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`

Después realiza un **Redeploy** con la caché limpia.
