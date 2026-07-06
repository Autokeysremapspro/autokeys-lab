# AK Cloud Admin v7.1 — Reglas de precios y packs

## Instalación

1. Ejecuta en Supabase:

```text
supabase/autokeys_core_akcloud_admin_v7_1_reglas_packs.sql
```

2. Copia los archivos encima del repo `autokeys-lab`.

3. Commit + push.

## Incluye

- Nueva pestaña **Reglas de packs** en `/ak-cloud/admin`.
- Configurar servicio principal, por ejemplo `Stage 1` o `Stage 2`.
- Seleccionar extras incluidos gratis.
- Aplicar reglas solo a ciertos planes si quieres.
- Activar/desactivar reglas.
- Base lista para que AK Cloud calcule extras a 0 €.

## Siguiente paso

Aplicar estas reglas en el portal `autokeys-file-service`, para que el resumen del pedido muestre:

```text
Stage 1        40 €
EGR OFF         0 € Incluido
Start/Stop      0 € Incluido
Total          40 €
```
