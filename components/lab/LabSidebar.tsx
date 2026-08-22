'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Car, FolderOpen, ClipboardList, Receipt, Archive, FolderCog,
  Handshake, UserCog, Settings, Lock, MoreHorizontal, X,
} from 'lucide-react'
import { LabLogoMark, LabWordmark, LabProBadge } from './LabBrand'

const navigation = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/vehiculos', label: 'Vehículos', icon: Car },
  { href: '/expedientes', label: 'Expedientes', icon: FolderOpen },
  { href: '/ordenes-trabajo', label: 'Órdenes de trabajo', icon: ClipboardList },
  { href: '/facturas', label: 'Facturación', icon: Receipt },
  { href: '/stock', label: 'Stock', icon: Archive },
  { href: '/file-service', label: 'File Service', icon: FolderCog },
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
      {open && <button type="button" aria-label="Cerrar menú" onClick={onClose} className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm xl:hidden" />}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-white/[0.075] bg-[#090a0d] px-4 py-4',
          'shadow-[24px_0_60px_rgba(0,0,0,.22)] transition-transform duration-300',
          'xl:sticky xl:top-0 xl:h-screen xl:w-[238px] xl:translate-x-0 2xl:w-[252px]',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="mb-5 flex h-[60px] items-center justify-between gap-2 px-1.5">
          <Link href="/" onClick={onClose} className="flex min-w-0 items-center gap-2.5">
            <LabLogoMark size={44} />
            <LabWordmark />
          </Link>
          <button onClick={onClose} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:bg-white/5 xl:hidden" aria-label="Cerrar menú"><X size={18} /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-0.5">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  'group flex min-h-[45px] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium transition-all duration-150 2xl:min-h-[47px] 2xl:text-[14px]',
                  active
                    ? 'border-[#ff343f]/35 bg-gradient-to-r from-[#bb151f] via-[#d91d27] to-[#b51620] text-white shadow-[0_8px_22px_rgba(216,29,39,.24),inset_0_1px_0_rgba(255,255,255,.08)]'
                    : 'border-transparent text-zinc-300 hover:border-white/[0.05] hover:bg-white/[0.035] hover:text-white',
                ].join(' ')}
              >
                <Icon size={18} strokeWidth={1.8} className={active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'} />
                <span className="flex-1 truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0d0f13] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
            <LabProBadge size={36} />
            <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold text-white">Admin</div><div className="truncate text-[11px] text-zinc-500">Administrador</div></div>
            <button className="rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-white" aria-label="Más opciones"><MoreHorizontal size={16} /></button>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#0b0d11] px-3.5 py-3 text-[12px]">
            <Lock size={17} strokeWidth={1.7} className="text-[#f12632]" />
            <div className="min-w-0"><div className="font-medium text-zinc-300">Conexión segura</div><div className="truncate text-[10px] italic text-zinc-500">Servidor encriptado</div></div>
          </div>
        </div>
      </aside>
    </>
  )
}
