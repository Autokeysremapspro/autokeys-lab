# Autokeys Lab v2

ERP interno para Autokeys Lab.

## Cambios v2

- Ficha individual de expediente `/expedientes/[id]`.
- Pestañas: Resumen, ECU, Llaves e Historial.
- Nueva migración SQL técnica: `supabase/autokeys_lab_v2.sql`.
- Botón “Abrir ficha” desde el listado de expedientes.

## Configuración

Variables necesarias en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

## Supabase

Antes de usar las nuevas pestañas, ejecutar en Supabase:

`supabase/autokeys_lab_v2.sql`

## Deploy

Subir los archivos a GitHub y Vercel hará redeploy automático.
