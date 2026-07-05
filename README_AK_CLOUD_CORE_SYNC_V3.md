# AK Cloud Sync v3 — Recargas y créditos desde Autokeys Core

## Pasos

1. Ejecuta en Supabase:

```text
supabase/autokeys_core_akcloud_sync_v3.sql
```

2. Copia el contenido del ZIP encima del repo `autokeys-lab`.

3. Commit + push.

## Incluye

- Nueva pantalla `/ak-cloud/recargas`.
- Aprobar recargas desde Autokeys Core.
- Rechazar recargas.
- Al aprobar, suma créditos en `ak_creditos_movimientos`.
- Notificación automática al distribuidor en AK Cloud.
- Menú lateral actualizado con AK Cloud.

## Nota

La facturación definitiva debe seguir viviendo en Autokeys Core. Este sprint deja preparado el control de créditos y recargas; el siguiente paso puede enlazar cada recarga aprobada con factura/recibo generado desde Core.
