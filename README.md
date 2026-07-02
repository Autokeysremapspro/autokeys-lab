# Autokeys Core v1.8 - Configuración empresa + documentos

## Instalación

1. Ejecuta en Supabase:

```text
supabase/autokeys_core_v1.8_configuracion_documentos.sql
```

2. Copia los archivos sobre el repo.
3. Commit + push.

## Incluye

- Apartado Configuración.
- Datos de empresa.
- IVA por defecto.
- Prefijos de numeración.
- Textos legales y garantía.
- API inicial para vista HTML imprimible de documentos.

## Nota

La ruta `/api/documentos/[id]/pdf` genera una vista HTML imprimible. Más adelante puede convertirse a PDF real con una librería server-side.
