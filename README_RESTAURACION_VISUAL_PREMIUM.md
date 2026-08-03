# Autokeys Core — restauración funcional + skin visual premium

Esta entrega parte del ZIP original facilitado por el usuario y conserva su estructura funcional.

## Comprobaciones específicas

- Ruta `/ak-cloud/planes` conservada.
- Pestañas de administración conservadas en `/ak-cloud/admin`:
  - Servicios
  - Planes
  - Servicios por plan
  - Pagos
  - Novedades
  - Branding
- Creación, edición y eliminación de planes conservadas.
- Asignación y retirada de servicios por plan conservadas.
- Categorías y servicios existentes no han sido reemplazados.
- No se han cambiado esquemas SQL, consultas Supabase, rutas, formularios ni lógica de negocio.

## Archivos modificados

- `app/globals.css` — sistema visual premium global.
- `components/AppShell.tsx` — ajustes exclusivamente visuales del marco, sidebar y cabecera.

El resto del proyecto proviene directamente del ZIP funcional original.
