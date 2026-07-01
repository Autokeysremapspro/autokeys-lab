'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  FileText,
  Package,
  UploadCloud,
  LogOut,
  Search,
  Cpu,
  KeyRound,
  ShieldCheck,
  BarChart3,
  Settings,
  PlusCircle,
} from 'lucide-react'

const nav = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/expedientes', 'Expedientes', ClipboardList],
  ['/clientes', 'Clientes', Users],
  ['/vehiculos', 'Vehículos', Car],
  ['/expedientes', 'ECU', Cpu],
  ['/expedientes', 'Llaves', KeyRound],
  ['/expedientes', 'IMMO', ShieldCheck],
  ['/file-service', 'File Service', UploadCloud],
  ['/stock', 'Stock', Package],
  ['/facturas', 'Facturas', FileText],
  ['/', 'Informes', BarChart3],
  ['/', 'Configuración', Settings],
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#111827] text-zinc-100">
      <aside className="w-72 bg-[#0F172A] border-r border-white/10 p-5 hidden lg:flex flex-col">
        <div className="mb-8">
          <div className="text-2xl font-black tracking-tight">AUTOKEYS <span className="text-red-500">LAB</span></div>
          <div className="text-xs text-zinc-500 mt-1">ERP interno · ECU · IMMO · Llaves</div>
        </div>

        <Link href="/expedientes/nueva" className="btn btn-red mb-5 flex items-center justify-center gap-2">
          <PlusCircle size={18} /> Nueva OT
        </Link>

        <nav className="space-y-1 flex-1">
          {nav.map(([href, label, Icon]: any) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href) && ['Expedientes','Clientes','Vehículos','File Service','Stock','Facturas'].includes(label))
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition ${active ? 'bg-red-600 text-white shadow-lg shadow-red-950/40' : 'hover:bg-white/5 text-zinc-300'}`}
              >
                <Icon size={18} />
                <span className="font-semibold">{label}</span>
              </Link>
            )
          })}
        </nav>

        <button onClick={logout} className="mt-6 flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-zinc-400 w-full">
          <LogOut size={18} /> Salir
        </button>
      </aside>

      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
          <div>
            <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Centro de operaciones</p>
            <h1 className="text-3xl lg:text-5xl font-black mt-1">Autokeys Lab</h1>
            <p className="text-zinc-500 mt-2">Gestión interna para laboratorio, recepción y file service</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3 w-full xl:w-[460px]">
              <Search size={18} className="text-zinc-500" />
              <input placeholder="Buscar matrícula, VIN, teléfono, OT, ECU..." className="bg-transparent border-0 p-0 w-full" />
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
