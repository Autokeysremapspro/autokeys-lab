'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UniversalSearch from '@/components/UniversalSearch'
import NotificationCenter from '@/components/NotificationCenter'
import ChatInterno from '@/components/ChatInterno'
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
  ChevronRight,
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
      { href: '/ak-cloud/planes', label: 'Planes AK (histórico, se cobra por archivo)', icon: Layers },
      { href: '/ak-cloud/distribuidores', label: 'Renovaciones (histórico, ya no hay planes)', icon: Users },
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

// Deriva el título y el grupo de la página actual a partir de la ruta —
// así la cabecera dice de verdad dónde estás, en vez de mostrar siempre
// "Autokeys Core" sin importar la pantalla.
function currentPage(pathname: string) {
  for (const group of groups) {
    const item = group.items.find((i) => isActive(pathname, i.href, i.label))
    if (item) return { title: item.label, group: group.title }
  }
  return { title: 'Autokeys Core', group: 'Centro de operaciones' }
}

const COLLAPSE_KEY = 'ak-core-nav-collapsed'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

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

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_KEY)
      if (stored) setCollapsed(JSON.parse(stored))
    } catch {
      // localStorage puede fallar en modo privado — no pasa nada, se queda todo expandido.
    }
  }, [])

  function toggleGroup(title: string) {
    setCollapsed((current) => {
      const next = { ...current, [title]: !current[title] }
      try {
        window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next))
      } catch {
        // ver arriba
      }
      return next
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (checkingSession || !authorized) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#0a0d12] text-zinc-100 p-6">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="font-display text-3xl font-bold tracking-tight">
            AUTOKEYS <span className="text-[#ffb870]">CORE</span>
          </div>
          <p className="text-zinc-500 mt-3">Comprobando sesión segura...</p>
        </div>
      </main>
    )
  }

  const page = currentPage(pathname || '/')

  return (
    <div className="min-h-screen flex bg-[#0a0d12] text-zinc-100">
      <aside className="w-80 bg-[#0c0f16] border-r border-white/10 p-5 hidden lg:flex flex-col">
        <Link href="/" className="mb-4 block">
          <div className="font-display text-2xl font-bold tracking-tight">
            AUTOKEYS <span className="text-[#ffb870]">CORE</span>
          </div>
          <div className="ak-mono text-[10px] text-zinc-500 mt-1 uppercase tracking-[.14em]">Laboratory Management System</div>
        </Link>
        <div className="ak-pinrow mb-5" style={{ ['--ak-pin-pos' as any]: '20%' }} />

        <Link href="/expedientes/nueva" className="btn btn-red mb-5 flex items-center justify-center gap-2 shadow-lg shadow-black/40">
          <PlusCircle size={18} /> Nueva OT
        </Link>

        <nav className="space-y-4 flex-1 overflow-auto pr-1">
          {groups.map((group) => {
            const isCollapsed = Boolean(collapsed[group.title])
            return (
              <section key={group.title}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400"
                >
                  <span>{group.title}</span>
                  <ChevronDown size={13} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>

                {!isCollapsed && (
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = isActive(pathname || '', item.href, item.label)

                      return (
                        <Link
                          key={`${group.title}-${item.href}-${item.label}`}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${
                            active
                              ? 'bg-gradient-to-r from-[#8a4a1f] to-[#e2954d] text-[#0a0d12] shadow-lg shadow-black/40'
                              : 'hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          <Icon size={18} />
                          <span className="font-semibold">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </nav>

        <button onClick={logout} className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-zinc-400 w-full">
          <LogOut size={18} /> Salir
        </button>
      </aside>

      <main className="flex-1 p-4 lg:p-8 max-w-[1700px] mx-auto w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
          <div>
            <p className="ak-mono text-sm text-[#ffb870] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
              {page.group}
              {page.title !== page.group && <ChevronRight size={14} className="text-zinc-600" />}
            </p>
            <h1 className="font-display text-3xl lg:text-5xl font-bold mt-1">{page.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <UniversalSearch />
            <NotificationCenter />
          </div>
        </div>

        {children}
      </main>
      <ChatInterno />
    </div>
  )
}
