# Autokeys Core v2.3 - Auditoría / Registro de actividad

## Instalación

1. Ejecutar en Supabase:

```text
supabase/autokeys_core_v2.3_auditoria.sql
```

2. Copiar los archivos encima del repo.
3. Commit + push.

## Incluye

- Nuevo apartado: `/auditoria`
- Menú lateral con acceso a Auditoría
- Tabla `auditoria_eventos`
- Función SQL `registrar_auditoria(...)`
- Servicio `lib/services/auditoria.ts`
- Tipos `types/auditoria.ts`
- Filtros por texto, módulo y severidad
- Estadísticas: eventos totales, eventos de hoy, avisos y críticos

## Próximo uso

En los siguientes sprints se puede llamar a `registrar_auditoria` desde acciones importantes:

- crear/editar/eliminar clientes
- crear/editar/eliminar vehículos
- cambios de estado de OT
- edición/eliminación de facturas
- movimientos de stock
- subida/eliminación de archivos
- cambios en usuarios y configuración
