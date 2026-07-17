'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UniversalSearch from '@/components/UniversalSearch'
import NotificationCenter from '@/components/NotificationCenter'
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  FileText,
  Package,
  Cloud,
  UploadCloud,
  LogOut,
  Cpu,
  KeyRound,
  ShieldCheck,
  Layers,
  BarChart3,
  Settings,
  PlusCircle,
  UserCog,
  BookOpen,
  Globe2,
  FolderTree,
  ChevronDown,
  CalendarDays,
  History,
  Bell,
  Archive,
  CreditCard,
  ReceiptText,
  TrendingUp,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: any
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    title: 'Operaciones',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/alta-rapida', label: 'Alta rápida', icon: PlusCircle },
      { href: '/explorador', label: 'Explorador', icon: FolderTree },
      { href: '/agenda', label: 'Agenda', icon: CalendarDays },
      { href: '/expedientes', label: 'Expedientes', icon: ClipboardList },
      { href: '/clientes', label: 'Clientes', icon: Users },
      { href: '/vehiculos', label: 'Vehículos', icon: Car },
      { href: '/crm', label: 'CRM', icon: Users },
    ],
  },
  {
    title: 'Laboratorio',
    items: [
      { href: '/expedientes?tipo=ecu', label: 'ECU', icon: Cpu },
      { href: '/expedientes?tipo=llave', label: 'Llaves', icon: KeyRound },
      { href: '/expedientes?tipo=immo', label: 'IMMO', icon: ShieldCheck },
      { href: '/biblioteca', label: 'Biblioteca Técnica', icon: BookOpen },
      { href: '/biblioteca-tecnica', label: 'Biblioteca Técnica 2 (casos ECU)', icon: BookOpen },
      { href: '/archivos', label: 'Archivos', icon: FolderTree },
    ],
  },
  {
    title: 'File Service (AK Cloud)',
    items: [
      { href: '/ak-cloud', label: 'Centro AK Cloud', icon: Cloud },
      { href: '/ak-cloud/solicitudes', label: 'Solicitudes distribuidor', icon: ShieldCheck },
      { href: '/ak-cloud/distribuidores', label: 'Renovaciones', icon: Users },
      { href: '/ak-cloud/planes', label: 'Planes AK', icon: Layers },
      { href: '/ak-cloud/produccion', label: 'Producción', icon: UploadCloud },
      { href: '/ak-cloud/soporte', label: 'Soporte', icon: Bell },
      { href: '/ak-cloud/facturacion', label: 'Facturación AK Cloud', icon: FileText },
      { href: '/ak-cloud/admin', label: 'Configuración AK Cloud', icon: Settings },
      { href: '/portal-distribuidores', label: 'Portal Distribuidores', icon: Globe2 },
    ],
  },
  {
    title: 'Histórico',
    items: [
      { href: '/file-service', label: 'File Service (histórico pre-AK Cloud)', icon: UploadCloud },
      { href: '/ak-cloud/recargas', label: 'Recargas (histórico, sistema de créditos descontinuado)', icon: CreditCard },
    ],
  },
  {
    title: 'Negocio',
    items: [
      { href: '/stock', label: 'Stock', icon: Package },
      { href: '/facturas', label: 'Facturas', icon: FileText },
      { href: '/pagos', label: 'Cobros / Pagos', icon: CreditCard },
      { href: '/gastos', label: 'Gastos / Compras', icon: ReceiptText },
      { href: '/finanzas', label: 'Finanzas', icon: TrendingUp },
      { href: '/objetivos', label: 'Objetivos / KPIs', icon: TrendingUp },
      { href: '/informes', label: 'Informes', icon: BarChart3 },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { href: '/usuarios', label: 'Usuarios', icon: UserCog },
      { href: '/notificaciones', label: 'Notificaciones', icon: Bell },
      { href: '/backups', label: 'Backups', icon: Archive },
      { href: '/auditoria', label: 'Auditoría', icon: History },
      { href: '/configuracion', label: 'Configuración', icon: Settings },
    ],
  },
]

const activeLabels = [
  'Dashboard',
  'Explorador',
  'Agenda',
  'Expedientes',
  'Clientes',
  'Vehículos',
  'AK Cloud',
  'AK Cloud Admin',
  'File Service',
  'Stock',
  'Facturas',
  'Cobros / Pagos',
  'Gastos / Compras',
  'Finanzas',
  'Usuarios',
  'Portal Distribuidores',
  'Biblioteca Técnica',
  'Informes',
  'Auditoría',
  'Notificaciones',
  'Backups',
  'Configuración',
]

function isActive(pathname: string, href: string, label: string) {
  if (href === '/') return pathname === '/'
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`) && activeLabels.includes(label)
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let alive = true

    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      const session = data.session

      if (!alive) return

      if (!session) {
        setAuthorized(false)
        setCheckingSession(false)
        const next = pathname || '/'
        router.replace(`/login?next=${encodeURIComponent(next)}`)
        return
      }

      setAuthorized(true)
      setCheckingSession(false)
    }

    checkSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return

      if (!session) {
        setAuthorized(false)
        router.replace('/login')
        return
      }

      setAuthorized(true)
      setCheckingSession(false)
    })

    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [pathname, router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checkingSession || !authorized) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#07090d] text-zinc-100 p-6">
        <div className="card max-w-md w-full p-9 text-center overflow-hidden">
          <div className="text-3xl font-black tracking-tight">
            AUTOKEYS <span className="text-red-500">CORE</span>
          </div>
          <p className="text-zinc-500 mt-3">Comprobando sesión segura...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen flex bg-transparent text-zinc-100">
      <aside className="w-[300px] shrink-0 border-r border-white/[0.07] bg-[#090c12]/95 p-5 hidden lg:flex flex-col shadow-[24px_0_70px_rgba(0,0,0,.24)] backdrop-blur-xl">
        <div className="mb-7 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 shadow-inner">
          <div className="text-[22px] font-black tracking-[-0.035em]">
            AUTOKEYS <span className="text-red-500">CORE</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mt-1.5">Laboratory Management System</div>
        </div>

        <Link href="/expedientes/nueva" className="btn btn-red mb-6 flex items-center justify-center gap-2 py-3">
          <PlusCircle size={18} /> Nueva OT
        </Link>

        <nav className="space-y-6 flex-1 overflow-auto pr-1 -mr-1">
          {groups.map((group) => (
            <section key={group.title}>
              <div className="flex items-center justify-between px-3 mb-2.5 text-[9px] font-black uppercase tracking-[0.24em] text-zinc-600">
                <span>{group.title}</span>
                <ChevronDown size={13} />
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href, item.label)

                  return (
                    <Link
                      key={`${group.title}-${item.href}-${item.label}`}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 ${
                        active
                          ? 'border-red-500/30 bg-gradient-to-r from-red-600 to-red-700 text-white shadow-[0_10px_25px_rgba(184,15,33,.22)]'
                          : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${active ? 'border-white/15 bg-white/10' : 'border-white/[0.05] bg-white/[0.025] group-hover:bg-white/[0.05]'}`}><Icon size={16} /></span>
                      <span className="font-semibold text-[13px] leading-tight">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </nav>

        <button onClick={logout} className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent hover:border-white/[0.06] hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-200 w-full transition">
          <LogOut size={18} /> Salir
        </button>
      </aside>

      <main className="relative flex-1 w-full min-w-0 p-4 lg:p-8 xl:p-10">
        <div className="sticky top-0 z-20 -mx-4 -mt-4 mb-8 flex flex-col gap-4 border-b border-white/[0.06] bg-[#07090d]/88 px-4 py-5 backdrop-blur-xl lg:-mx-8 lg:-mt-8 lg:px-8 xl:-mx-10 xl:-mt-10 xl:flex-row xl:items-center xl:justify-between xl:px-10">
          <div>
            <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.24em]">Centro de operaciones</p>
            <h1 className="text-2xl lg:text-3xl font-black tracking-[-0.04em] mt-1">Autokeys Core</h1>
            <p className="text-xs text-zinc-600 mt-1.5">ERP · LMS · File Service · Gestión técnica del laboratorio</p>
          </div>

          <div className="flex items-center gap-2.5">
            <UniversalSearch />
            <NotificationCenter />
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
