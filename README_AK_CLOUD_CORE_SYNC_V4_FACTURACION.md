# AK Cloud Sync v4 — Facturación desde Autokeys Core

## Qué añade

- Nueva pantalla `/ak-cloud/facturacion`.
- Listado de recargas AK Cloud.
- Crear factura de recarga desde Autokeys Core.
- Vincular `ak_creditos_recargas.core_factura_id` con `facturas.id`.
- Ver / imprimir factura usando el sistema PDF existente de Autokeys Core.

## Pasos

1. Ejecuta en Supabase:

```text
supabase/autokeys_core_akcloud_sync_v4_facturacion.sql
```

2. Copia el contenido del ZIP encima del repo `autokeys-lab`.
3. Commit + push.
4. Entra en:

```text
/ak-cloud/facturacion
```

## Archivos incluidos

```text
app/ak-cloud/facturacion/page.tsx
lib/services/akCloudFacturacion.ts
supabase/autokeys_core_akcloud_sync_v4_facturacion.sql
```

## Nota

No modifica `components/AppShell.tsx` para evitar pisar cambios previos. Puedes acceder desde `/ak-cloud/facturacion` directamente o añadir el enlace al menú cuando confirmemos que compila.
