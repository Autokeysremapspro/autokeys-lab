'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UniversalSearch from '@/components/UniversalSearch'
import NotificationCenter from '@/components/NotificationCenter'
import {
  LayoutDashboard, Users, Car, ClipboardList, FileText, Package, Cloud, UploadCloud,
  LogOut, Cpu, KeyRound, ShieldCheck, BarChart3, Settings, PlusCircle, UserCog,
  BookOpen, Globe2, FolderTree, CalendarDays, History, Bell, Archive, CreditCard,
  ReceiptText, TrendingUp, Menu, X, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Command, Sparkles,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: any }
type NavGroup = { title: string; items: NavItem[] }

const groups: NavGroup[] = [
  { title: 'Operaciones', items: [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/alta-rapida', label: 'Alta rápida', icon: PlusCircle },
    { href: '/explorador', label: 'Explorador', icon: FolderTree },
    { href: '/agenda', label: 'Agenda', icon: CalendarDays },
    { href: '/expedientes', label: 'Expedientes', icon: ClipboardList },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/vehiculos', label: 'Vehículos', icon: Car },
    { href: '/crm', label: 'CRM', icon: Users },
  ]},
  { title: 'Laboratorio', items: [
    { href: '/expedientes?tipo=ecu', label: 'ECU', icon: Cpu },
    { href: '/expedientes?tipo=llave', label: 'Llaves', icon: KeyRound },
    { href: '/expedientes?tipo=immo', label: 'IMMO', icon: ShieldCheck },
    { href: '/biblioteca', label: 'Biblioteca Técnica', icon: BookOpen },
    { href: '/biblioteca-tecnica', label: 'Casos ECU', icon: BookOpen },
    { href: '/archivos', label: 'Archivos', icon: FolderTree },
  ]},
  { title: 'AK Cloud', items: [
    { href: '/ak-cloud', label: 'Centro AK Cloud', icon: Cloud },
    { href: '/ak-cloud/solicitudes', label: 'Solicitudes', icon: ShieldCheck },
    { href: '/ak-cloud/produccion', label: 'Producción', icon: UploadCloud },
    { href: '/ak-cloud/recargas', label: 'Recargas', icon: CreditCard },
    { href: '/ak-cloud/soporte', label: 'Soporte', icon: Bell },
    { href: '/ak-cloud/facturacion', label: 'Facturación', icon: FileText },
    { href: '/ak-cloud/admin', label: 'Configuración', icon: Settings },
    { href: '/portal-distribuidores', label: 'Distribuidores', icon: Globe2 },
  ]},
  { title: 'Histórico', items: [
    { href: '/file-service', label: 'File Service anterior', icon: UploadCloud },
  ]},
  { title: 'Negocio', items: [
    { href: '/stock', label: 'Stock', icon: Package },
    { href: '/facturas', label: 'Facturas', icon: FileText },
    { href: '/pagos', label: 'Cobros / Pagos', icon: CreditCard },
    { href: '/gastos', label: 'Gastos / Compras', icon: ReceiptText },
    { href: '/finanzas', label: 'Finanzas', icon: TrendingUp },
    { href: '/objetivos', label: 'Objetivos / KPIs', icon: TrendingUp },
    { href: '/informes', label: 'Informes', icon: BarChart3 },
  ]},
  { title: 'Sistema', items: [
    { href: '/usuarios', label: 'Usuarios', icon: UserCog },
    { href: '/notificaciones', label: 'Notificaciones', icon: Bell },
    { href: '/backups', label: 'Backups', icon: Archive },
    { href: '/auditoria', label: 'Auditoría', icon: History },
    { href: '/configuracion', label: 'Configuración', icon: Settings },
  ]},
]

function routePath(href: string) { return href.split('?')[0] }
function isActive(pathname: string, href: string) {
  const path = routePath(href)
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

function currentPage(pathname: string) {
  for (const group of groups) {
    const exact = group.items.find((item) => routePath(item.href) === pathname)
    if (exact) return { group: group.title, label: exact.label }
  }
  for (const group of groups) {
    const nested = group.items.find((item) => pathname.startsWith(`${routePath(item.href)}/`))
    if (nested) return { group: group.title, label: nested.label }
  }
  return { group: 'Autokeys Core', label: 'Centro de operaciones' }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const page = useMemo(() => currentPage(pathname), [pathname])

  useEffect(() => {
    let alive = true
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (!alive) return
      if (!data.session) {
        setAuthorized(false); setCheckingSession(false)
        router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`)
        return
      }
      setAuthorized(true); setCheckingSession(false)
    }
    checkSession()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return
      if (!session) { setAuthorized(false); router.replace('/login'); return }
      setAuthorized(true); setCheckingSession(false)
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [pathname, router])

  useEffect(() => setMobileOpen(false), [pathname])

  async function logout() { await supabase.auth.signOut(); router.push('/login') }

  if (checkingSession || !authorized) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="card w-full max-w-sm overflow-hidden p-8 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400"><Sparkles size={25} /></div>
          <div className="text-2xl font-black tracking-[-0.04em]">AUTOKEYS <span className="text-red-500">CORE</span></div>
          <p className="mt-3 text-sm text-zinc-500">Preparando tu centro de operaciones…</p>
          <div className="mx-auto mt-6 h-1 w-32 overflow-hidden rounded-full bg-white/5"><div className="h-full w-1/2 animate-pulse rounded-full bg-red-500" /></div>
        </div>
      </main>
    )
  }

  const sidebar = (
    <aside className={`flex h-full flex-col border-r border-white/[0.065] bg-[#090c12]/95 backdrop-blur-2xl transition-[width] duration-300 ${collapsed ? 'w-[88px]' : 'w-[286px]'}`}>
      <div className="flex h-[82px] items-center border-b border-white/[0.055] px-5">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-500/25 bg-gradient-to-br from-red-500/20 to-red-950/20 font-black text-red-400 shadow-lg shadow-red-950/20">AK</div>
          {!collapsed && <div className="min-w-0"><div className="truncate text-[17px] font-black tracking-[-0.035em] text-white">AUTOKEYS <span className="text-red-500">CORE</span></div><div className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[.2em] text-zinc-600">Laboratory OS</div></div>}
        </Link>
        {!collapsed && <button onClick={() => setCollapsed(true)} className="hidden rounded-lg p-2 text-zinc-600 hover:bg-white/5 hover:text-zinc-300 xl:block" aria-label="Contraer menú"><PanelLeftClose size={17} /></button>}
      </div>

      <div className="px-3 pt-4">
        <Link href="/expedientes/nueva" title="Nueva OT" className={`btn btn-red flex items-center justify-center gap-2 ${collapsed ? 'px-0' : ''}`}>
          <PlusCircle size={18} /> {!collapsed && <span>Nueva OT</span>}
        </Link>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-5">
        {groups.map((group) => (
          <section key={group.title} className="mb-5">
            {!collapsed && <div className="mb-1.5 px-3 text-[9px] font-black uppercase tracking-[.2em] text-zinc-700">{group.title}</div>}
            {collapsed && <div className="mx-auto mb-2 h-px w-8 bg-white/[0.06]" />}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(pathname, item.href)
                return (
                  <Link key={`${group.title}-${item.href}-${item.label}`} href={item.href} title={collapsed ? item.label : undefined}
                    className={`group relative flex h-10 items-center rounded-xl text-[13px] font-semibold transition ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} ${active ? 'bg-red-500/[0.11] text-white' : 'text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200'}`}>
                    {active && <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-red-500 shadow-[0_0_14px_rgba(239,43,45,.55)]" />}
                    <Icon size={17} className={`shrink-0 ${active ? 'text-red-400' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
                    {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                    {!collapsed && active && <ChevronRight size={13} className="text-red-400/70" />}
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="border-t border-white/[0.055] p-3">
        {collapsed && <button onClick={() => setCollapsed(false)} className="mb-1 hidden h-10 w-full place-items-center rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white xl:grid" aria-label="Expandir menú"><PanelLeftOpen size={18} /></button>}
        <button onClick={logout} title="Cerrar sesión" className={`flex h-10 w-full items-center rounded-xl text-sm font-semibold text-zinc-600 hover:bg-red-500/[0.07] hover:text-red-300 ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}><LogOut size={17} /> {!collapsed && 'Cerrar sesión'}</button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen text-zinc-100">
      <div className="fixed inset-y-0 left-0 z-40 hidden xl:block">{sidebar}</div>
      {mobileOpen && <button aria-label="Cerrar menú" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden" />}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 xl:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}<button onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 rounded-xl border border-white/10 bg-black/40 p-2 text-zinc-300"><X size={18} /></button></div>

      <div className={`min-h-screen transition-[padding] duration-300 ${collapsed ? 'xl:pl-[88px]' : 'xl:pl-[286px]'}`}>
        <header className="sticky top-0 z-30 border-b border-white/[0.055] bg-[#070a0f]/78 backdrop-blur-2xl">
          <div className="flex h-[82px] items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setMobileOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-zinc-300 xl:hidden"><Menu size={19} /></button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.16em] text-zinc-600"><span>{page.group}</span><ChevronRight size={11} /><span className="text-red-400/80">Activo</span></div>
              <h1 className="mt-1 truncate text-xl font-black tracking-[-0.035em] text-white sm:text-2xl">{page.label}</h1>
            </div>
            <div className="hidden min-w-[260px] max-w-md flex-1 items-center lg:flex"><UniversalSearch /></div>
            <div className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs text-zinc-500 sm:flex"><Command size={14} /><span className="hidden 2xl:inline">Búsqueda rápida</span><kbd className="rounded border border-white/10 bg-black/25 px-1.5 py-0.5 text-[10px] text-zinc-600">⌘ K</kbd></div>
            <NotificationCenter />
          </div>
        </header>

        <main className="ak-page-enter mx-auto w-full max-w-[1720px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
