# AK Cloud Sync v5 — Centro de Producción

## Instalación

1. Ejecutar en Supabase:

```text
supabase/autokeys_core_akcloud_produccion_v5.sql
```

2. Copiar el ZIP encima del repo `autokeys-lab`.
3. Commit + push.
4. Abrir:

```text
/ak-cloud/produccion
```

## Incluye

- Centro de Producción AK Cloud dentro de Autokeys Core.
- Vista Kanban por estado.
- Estados: Nuevos, Analizando, En proceso, Control calidad y Finalizados.
- Asignar técnico.
- Mover pedidos de columna.
- Notificación automática al distribuidor cuando cambia el estado.
- Acceso directo a la ficha interna del pedido.

> Nota: este ZIP no sobrescribe `AppShell.tsx` para evitar conflictos con tu menú actual. Si quieres, en el siguiente paso añadimos el enlace al menú lateral.
