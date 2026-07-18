# AK Core · AK Cloud V2

## Incluido en el ERP

- Precio calculado y precio final editable.
- Motivo del ajuste de precio.
- Subida de varias versiones V1, V2, V3…
- Nota interna y nota visible para el cliente por versión.
- Selección manual de la versión final.
- La subida de archivos no finaliza el pedido.
- Finalización manual y reapertura del pedido.
- Estados de trabajo, incluyendo espera de prueba y revisión.
- Compatibilidad con el antiguo flujo `subirModAkCloud`, que ahora crea una versión sin cerrar el pedido.

## Instalación

1. Ejecuta una sola vez en Supabase SQL Editor:
   `supabase/migrations/20260717_akcloud_v2_versiones_precio_legal.sql`
2. Despliega el proyecto en Vercel.
3. Abre un pedido desde `AK Cloud` y prueba:
   - editar precio;
   - subir V1 y V2;
   - marcar una como final;
   - finalizar manualmente;
   - reabrir.

## Importante

No se han eliminado las pestañas ni módulos existentes de AK Core. La pestaña Planes y la asignación de servicios a planes permanecen en el proyecto.
