# Autokeys Core - AK Cloud Sync

## Instalación

1. Ejecuta en Supabase:

```text
supabase/autokeys_core_akcloud_sync.sql
```

2. Copia el contenido del ZIP encima del repo `autokeys-lab`.
3. Commit + push.

## Añade

- Nuevo módulo `/ak-cloud` en Autokeys Core.
- Menú lateral con acceso a AK Cloud.
- Vista de pedidos recibidos desde AK Cloud.
- Ficha interna de pedido `/ak-cloud/[id]`.
- Convertir pedido de AK Cloud en expediente de Autokeys Core.
- Enlace directo al expediente creado.
- Descarga de ORI/MOD desde Storage compartido.
- Visor de recargas pendientes.

## Notas

Este módulo usa las tablas compartidas:

- `file_service_pedidos`
- `ak_creditos_recargas`
- `ak_creditos_movimientos`

Y añade campos de sincronización:

- `core_cliente_id`
- `core_vehiculo_id`
- `core_expediente_id`
- `tecnico_asignado`
- `notas_core`
- `convertido_at`
