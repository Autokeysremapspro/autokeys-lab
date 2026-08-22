'use client'

import { usePathname } from 'next/navigation'
import ChatInterno from '@/components/ChatInterno'
import LabShell from '@/components/lab/LabShell'

type PageMeta = {
  match: string
  title: string
  group: string
}

/*
 * Compatibility map for pages that still import AppShell.
 * AppShell no longer owns a second visual system: it delegates the complete
 * chrome (sidebar, topbar, responsive navigation, auth and footer) to LabShell.
 */
const pages: PageMeta[] = [
  { match: '/alta-rapida', title: 'Alta rápida', group: 'Operaciones' },
  { match: '/explorador', title: 'Explorador', group: 'Operaciones' },
  { match: '/agenda', title: 'Agenda', group: 'Operaciones' },
  { match: '/expedientes/nueva', title: 'Nueva orden de trabajo', group: 'Operaciones / Expedientes' },
  { match: '/expedientes', title: 'Expedientes', group: 'Operaciones' },
  { match: '/clientes', title: 'Clientes', group: 'Operaciones' },
  { match: '/vehiculos', title: 'Vehículos', group: 'Operaciones' },
  { match: '/crm', title: 'CRM', group: 'Operaciones' },

  { match: '/biblioteca-tecnica', title: 'Biblioteca técnica', group: 'Laboratorio' },
  { match: '/biblioteca', title: 'Biblioteca técnica', group: 'Laboratorio' },
  { match: '/archivos', title: 'Archivos', group: 'Laboratorio' },

  { match: '/ak-cloud/produccion', title: 'Producción', group: 'AK Cloud' },
  { match: '/ak-cloud/solicitudes', title: 'Solicitudes distribuidor', group: 'AK Cloud' },
  { match: '/ak-cloud/soporte', title: 'Soporte', group: 'AK Cloud' },
  { match: '/ak-cloud/facturacion', title: 'Facturación AK Cloud', group: 'AK Cloud' },
  { match: '/ak-cloud/recargas', title: 'Recargas', group: 'AK Cloud / Histórico' },
  { match: '/ak-cloud/planes', title: 'Planes', group: 'AK Cloud / Histórico' },
  { match: '/ak-cloud/distribuidores', title: 'Distribuidores', group: 'AK Cloud' },
  { match: '/ak-cloud/admin', title: 'Configuración AK Cloud', group: 'AK Cloud' },
  { match: '/ak-cloud', title: 'Centro AK Cloud', group: 'File Service' },
  { match: '/portal-distribuidores', title: 'Portal distribuidores', group: 'File Service' },
  { match: '/file-service', title: 'File Service', group: 'Histórico' },

  { match: '/stock', title: 'Stock', group: 'Negocio' },
  { match: '/facturas', title: 'Facturas', group: 'Negocio' },
  { match: '/pagos', title: 'Cobros / Pagos', group: 'Negocio' },
  { match: '/gastos', title: 'Gastos / Compras', group: 'Negocio' },
  { match: '/finanzas', title: 'Finanzas', group: 'Negocio' },
  { match: '/objetivos', title: 'Objetivos / KPIs', group: 'Negocio' },
  { match: '/informes', title: 'Informes', group: 'Negocio' },

  { match: '/usuarios', title: 'Usuarios', group: 'Sistema' },
  { match: '/notificaciones', title: 'Notificaciones', group: 'Sistema' },
  { match: '/backups', title: 'Backups', group: 'Sistema' },
  { match: '/auditoria', title: 'Auditoría', group: 'Sistema' },
  { match: '/configuracion', title: 'Configuración', group: 'Sistema' },
]

function currentPage(pathname: string) {
  const found = pages.find((page) => pathname === page.match || pathname.startsWith(`${page.match}/`))
  return found || { title: 'Autokeys Lab', group: 'Centro de operaciones' }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  const page = currentPage(pathname)

  return (
    <>
      <LabShell title={page.title} breadcrumb={page.group}>
        {children}
      </LabShell>
      <ChatInterno />
    </>
  )
}
