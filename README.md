# Autokeys Core v2.6 - PDF documentos

## Pasos

1. Ejecuta en Supabase:
   supabase/autokeys_core_v2.6_documentos_pdf.sql

2. Copia los archivos encima del repo.

3. Commit + push.

## Uso

Endpoint:
/api/documentos/[id]

Abre una vista imprimible de la factura/presupuesto/albarán/ticket.
Desde el navegador usa "Imprimir / Guardar PDF".

Componente opcional:
components/DocumentPdfButton.tsx

Puedes añadirlo en páginas de facturas:
<DocumentPdfButton id={factura.id} />
