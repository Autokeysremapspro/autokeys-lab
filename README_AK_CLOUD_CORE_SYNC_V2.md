# AK Cloud Sync v2 para Autokeys Core

## Qué añade

- Responder pedidos AK Cloud desde Autokeys Core.
- Descargar ORI.
- Subir MOD y finalizar pedido.
- Cambiar estado pendiente/en proceso/finalizado/cancelado.
- Notas internas.
- Chat con distribuidor desde Core.
- Notificación al distribuidor cuando el MOD está listo.
- Historial automático si el pedido está convertido en expediente.

## Instalación

1. Ejecutar en Supabase:

```text
supabase/autokeys_core_akcloud_sync_v2.sql
```

2. Copiar archivos encima del repo `autokeys-lab`.
3. Commit + push.

## Archivos incluidos

```text
app/ak-cloud/page.tsx
app/ak-cloud/[id]/page.tsx
lib/services/akCloud.ts
supabase/autokeys_core_akcloud_sync_v2.sql
```
