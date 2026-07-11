'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Cloud,
  CreditCard,
  Gauge,
  LayoutDashboard,
  PackageCheck,
  Settings,
  Users,
  X,
} from 'lucide-react'

export type AKSidebarProps = {
  open?: boolean
  onClose?: () => void
}

const navigation = [
  { href: '/ak-cloud', label: 'Resumen', icon: LayoutDashboard },
  { href: '/ak-cloud/produccion', label: 'Producción', icon: Gauge },
  { href: '/ak-cloud/distribuidores', label: 'Distribuidores', icon: Users },
  { href: '/ak-cloud/recargas', label: 'Recargas', icon: CreditCard },
  { href: '/ak-cloud/facturacion', label: 'Facturación', icon: PackageCheck },
  { href: '/ak-cloud/admin', label: 'Configuración', icon: Settings },
]

function activeRoute(pathname: string, href: string) {
  if (href === '/ak-cloud') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AKSidebar({ open = false, onClose }: AKSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10',
          'bg-[#090b10]/98 px-4 py-5 shadow-2xl shadow-black/50 backdrop-blur-xl',
          'transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="mb-5 flex items-start justify-between gap-3 px-2">
          <Link href="/ak-cloud" onClick={onClose} className="group">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-red-500/30 bg-red-500/10 shadow-lg shadow-red-950/30">
                <Cloud className="text-red-400" size={22} />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-white">
                  AK <span className="text-red-500">CLOUD</span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
                  Control Center
                </div>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-red-300">
            <BarChart3 size={15} /> Administración interna
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Gestiona pedidos, distribuidores, precios y producción desde Core.
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = activeRoute(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  'group flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-bold transition-all',
                  active
                    ? 'border-red-500/30 bg-red-500/12 text-white shadow-lg shadow-red-950/20'
                    : 'border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid h-9 w-9 place-items-center rounded-xl transition-colors',
                    active ? 'bg-red-500 text-white' : 'bg-white/[0.04] text-zinc-500 group-hover:text-red-400',
                  ].join(' ')}
                >
                  <Icon size={18} />
                </span>
                <span className="flex-1">{item.label}</span>
                {active && <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.8)]" />}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/"
          onClick={onClose}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LayoutDashboard size={18} /> Volver a Autokeys Core
        </Link>
      </aside>
    </>
  )
}
