'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { globalSearch, type SearchResult } from '@/lib/services/search'
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
  Loader2,
  X,
  Wrench,
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

const resultIcons: Record<SearchResult['type'], any> = {
  cliente: Users,
  vehiculo: Car,
  expediente: ClipboardList,
  factura: FileText,
  stock: Package,
  file_service: UploadCloud,
}

function GlobalSearchBox() {
  const router = useRouter()
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const current = query.trim()
    setError(null)
    if (current.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const rows = await globalSearch(current)
        setResults(rows)
        setOpen(true)
      } catch (err: any) {
        setError(err?.message || 'Error buscando')
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => clearTimeout(timer)
  }, [query])

  function goTo(result: SearchResult) {
    setOpen(false)
    setQuery('')
    router.push(result.href)
  }

  return (
    <div ref={boxRef} className="relative w-full xl:w-[520px]">
      <div className="flex items-center gap-2 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3 w-full focus-within:border-red-700 focus-within:ring-4 focus-within:ring-red-900/20">
        <Search size={18} className="text-zinc-500" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar matrícula, VIN, teléfono, OT, ECU..."
          className="bg-transparent border-0 p-0 w-full shadow-none focus:shadow-none focus:ring-0"
        />
        {loading && <Loader2 size={17} className="text-zinc-500 animate-spin" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]) }} className="text-zinc-500 hover:text-white">
            <X size={17} />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-3 w-full card p-2 max-h-[520px] overflow-auto">
          <div className="px-3 py-2 text-xs uppercase tracking-[0.18em] text-zinc-500 font-black">Búsqueda universal</div>

          {error && <div className="m-2 rounded-2xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-300">{error}</div>}

          {!error && !loading && results.length === 0 && (
            <div className="m-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
              No hay resultados para <span className="font-black text-white">{query}</span>.
            </div>
          )}

          <div className="space-y-1">
            {results.map((result) => {
              const Icon = resultIcons[result.type] || Wrench
              return (
                <button
                  key={result.id}
                  onClick={() => goTo(result)}
                  className="w-full text-left flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/5 transition"
                >
                  <div className="h-10 w-10 rounded-2xl bg-red-600/15 border border-red-900/40 grid place-items-center text-red-300 shrink-0">
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black truncate">{result.title}</div>
                    <div className="text-sm text-zinc-500 truncate">{result.subtitle}</div>
                  </div>
                  <span className="badge bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">{result.badge}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const title = useMemo(() => {
    if (pathname.startsWith('/clientes')) return 'Clientes'
    if (pathname.startsWith('/vehiculos')) return 'Vehículos'
    if (pathname.startsWith('/expedientes')) return 'Expedientes'
    if (pathname.startsWith('/file-service')) return 'File Service'
    if (pathname.startsWith('/stock')) return 'Stock'
    if (pathname.startsWith('/facturas')) return 'Facturación'
    return 'Autokeys Core'
  }, [pathname])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#111827] text-zinc-100">
      <aside className="w-72 bg-[#0F172A] border-r border-white/10 p-5 hidden lg:flex flex-col">
        <div className="mb-8">
          <div className="text-2xl font-black tracking-tight">AUTOKEYS <span className="text-red-500">CORE</span></div>
          <div className="text-xs text-zinc-500 mt-1">Laboratorio de electrónica · ECU · IMMO · Llaves</div>
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
            <h1 className="text-3xl lg:text-5xl font-black mt-1">{title}</h1>
            <p className="text-zinc-500 mt-2">ERP interno para laboratorio, recepción y file service</p>
          </div>

          <div className="flex items-center gap-3">
            <GlobalSearchBox />
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
