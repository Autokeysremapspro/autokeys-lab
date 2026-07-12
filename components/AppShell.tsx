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
      { href: '/ak-cloud/planes', label: 'Planes AK', icon: Layers },
      { href: '/ak-cloud/produccion', label: 'Producción', icon: UploadCloud },
      { href: '/ak-cloud/recargas', label: 'Recargas', icon: CreditCard },
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
      <main className="min-h-screen grid place-items-center bg-[#111827] text-zinc-100 p-6">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="text-3xl font-black tracking-tight">
            AUTOKEYS <span className="text-red-500">CORE</span>
          </div>
          <p className="text-zinc-500 mt-3">Comprobando sesión segura...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#111827] text-zinc-100">
      <aside className="w-80 bg-[#0B1220] border-r border-white/10 p-5 hidden lg:flex flex-col">
        <div className="mb-6">
          <div className="text-2xl font-black tracking-tight">
            AUTOKEYS <span className="text-red-500">CORE</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1">Laboratory Management System</div>
        </div>

        <Link href="/expedientes/nueva" className="btn btn-red mb-5 flex items-center justify-center gap-2 shadow-lg shadow-red-950/40">
          <PlusCircle size={18} /> Nueva OT
        </Link>

        <nav className="space-y-5 flex-1 overflow-auto pr-1">
          {groups.map((group) => (
            <section key={group.title}>
              <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
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
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                        active
                          ? 'bg-red-600 text-white shadow-lg shadow-red-950/40'
                          : 'hover:bg-white/5 text-zinc-300'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-semibold">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </nav>

        <button onClick={logout} className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-zinc-400 w-full">
          <LogOut size={18} /> Salir
        </button>
      </aside>

      <main className="flex-1 p-4 lg:p-8 max-w-[1700px] mx-auto w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
          <div>
            <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Centro de operaciones</p>
            <h1 className="text-3xl lg:text-5xl font-black mt-1">Autokeys Core</h1>
            <p className="text-zinc-500 mt-2">ERP · LMS · File Service · Gestión técnica del laboratorio</p>
          </div>

          <div className="flex items-center gap-3">
            <UniversalSearch />
            <NotificationCenter />
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
