'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Car,
  FolderOpen,
  ClipboardList,
  Receipt,
  Archive,
  Handshake,
  UserCog,
  Settings,
  Lock,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { LabLogoMark, LabWordmark } from './LabBrand'

const navigation = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/vehiculos', label: 'Vehículos', icon: Car },
  { href: '/expedientes', label: 'Expedientes', icon: FolderOpen },
  { href: '/ordenes-trabajo', label: 'Órdenes de trabajo', icon: ClipboardList },
  { href: '/facturas', label: 'Facturación', icon: Receipt },
  { href: '/stock', label: 'Stock', icon: Archive },
  { href: '/distribuidores', label: 'Distribuidores', icon: Handshake },
  { href: '/tecnicos', label: 'Técnicos', icon: UserCog },
  { href: '/configuracion', label: 'Ajustes', icon: Settings },
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function LabSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname() || '/'

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
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-5 border-r border-white/10 bg-[#0a0b0f] px-4 py-5',
          'transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2 px-1 lg:hidden">
          <Link href="/" onClick={onClose} className="flex items-center gap-3">
            <LabLogoMark size={38} />
            <LabWordmark />
          </Link>
          <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-zinc-400 hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-all',
                  active
                    ? 'bg-gradient-to-r from-[#c81f2a] to-[#8f141d] text-white shadow-lg shadow-[#c81f2a]/25'
                    : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100',
                ].join(' ')}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'} />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 rounded-xl px-1 py-1">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff4d4d] to-[#7a0f16] ring-1 ring-white/10">
              <span className="text-xs font-black text-white">AK</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-white">Admin</div>
              <div className="truncate text-xs text-zinc-500">Administrador</div>
            </div>
            <button className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white" aria-label="Más opciones">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs">
            <Lock size={14} className="text-[#4ade95]" />
            <div className="min-w-0">
              <div className="font-bold text-zinc-300">Conexión segura</div>
              <div className="truncate text-zinc-600">Servidor encriptado</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
