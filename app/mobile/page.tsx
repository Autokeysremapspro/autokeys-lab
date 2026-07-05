'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  CalendarDays,
  Camera,
  Car,
  ClipboardList,
  Home,
  Loader2,
  LogOut,
  Plus,
  Search,
  User,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import MobileQuickCreate from '@/components/MobileQuickCreate'

type View = 'home' | 'alta' | 'buscar' | 'agenda'

type AgendaEvent = {
  id: string
  titulo: string | null
  tipo: string | null
  fecha: string | null
  hora: string | null
  prioridad: string | null
  estado: string | null
}

type SearchItem = {
  id: string
  type: 'cliente' | 'vehiculo' | 'expediente'
  title: string
  subtitle: string
  href: string
}

export default function MobilePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [view, setView] = useState<View>('home')
  const [agenda, setAgenda] = useState<AgendaEvent[]>([])
  const [counts, setCounts] = useState({ expedientes: 0, urgentes: 0, agendaHoy: 0 })
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchItem[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    if (!checking) loadMobileData()
  }, [checking])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) runSearch(query)
      else setResults([])
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  async function checkSession() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.replace('/login')
      return
    }
    setChecking(false)
  }

  async function loadMobileData() {
    const today = new Date().toISOString().slice(0, 10)

    const [agendaRes, expRes, urgRes] = await Promise.all([
      supabase
        .from('agenda_eventos')
        .select('id,titulo,tipo,fecha,hora,prioridad,estado')
        .eq('fecha', today)
        .order('hora', { ascending: true }),
      supabase
        .from('expedientes')
        .select('id', { count: 'exact', head: true })
        .neq('estado', 'entregado'),
      supabase
        .from('expedientes')
        .select('id', { count: 'exact', head: true })
        .eq('prioridad', 'urgente')
        .neq('estado', 'entregado'),
    ])

    if (!agendaRes.error) setAgenda((agendaRes.data || []) as AgendaEvent[])

    setCounts({
      expedientes: expRes.count || 0,
      urgentes: urgRes.count || 0,
      agendaHoy: agendaRes.data?.length || 0,
    })
  }

  async function runSearch(value: string) {
    const q = value.trim()
    setSearching(true)

    try {
      const [clientesRes, vehiculosRes, expedientesRes] = await Promise.all([
        supabase
          .from('clientes')
          .select('id,nombre,telefono,email')
          .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(6),
        supabase
          .from('vehiculos')
          .select('id,marca,modelo,matricula,bastidor,ecu')
          .or(`marca.ilike.%${q}%,modelo.ilike.%${q}%,matricula.ilike.%${q}%,bastidor.ilike.%${q}%,ecu.ilike.%${q}%`)
          .limit(6),
        supabase
          .from('expedientes')
          .select('id,numero_ot,tipo_trabajo,estado,prioridad')
          .or(`numero_ot.ilike.%${q}%,tipo_trabajo.ilike.%${q}%,estado.ilike.%${q}%`)
          .limit(6),
      ])

      const items: SearchItem[] = []

      ;(clientesRes.data || []).forEach((item: any) => {
        items.push({
          id: item.id,
          type: 'cliente',
          title: item.nombre || 'Cliente sin nombre',
          subtitle: item.telefono || item.email || 'Cliente',
          href: `/clientes/${item.id}`,
        })
      })

      ;(vehiculosRes.data || []).forEach((item: any) => {
        items.push({
          id: item.id,
          type: 'vehiculo',
          title: [item.marca, item.modelo, item.matricula].filter(Boolean).join(' ') || 'Vehículo',
          subtitle: item.bastidor || item.ecu || 'Vehículo',
          href: `/vehiculos/${item.id}`,
        })
      })

      ;(expedientesRes.data || []).forEach((item: any) => {
        items.push({
          id: item.id,
          type: 'expediente',
          title: item.numero_ot || item.tipo_trabajo || 'Expediente',
          subtitle: `${item.tipo_trabajo || 'Trabajo'} · ${item.estado || 'sin estado'}`,
          href: `/expedientes/${item.id}`,
        })
      })

      setResults(items)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo buscar')
    } finally {
      setSearching(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const title = useMemo(() => {
    if (view === 'alta') return 'Alta rápida'
    if (view === 'buscar') return 'Buscar'
    if (view === 'agenda') return 'Agenda de hoy'
    return 'Móvil Pro'
  }, [view])

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400"><Loader2 className="animate-spin" /> Comprobando sesión...</div>
      </main>
    )
  }

  if (view === 'alta') return <MobileQuickCreate onBack={() => setView('home')} />

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Autokeys Core</p>
            <h1 className="text-2xl font-black">{title}</h1>
          </div>
          <button onClick={logout} className="rounded-2xl border border-white/10 p-3 text-slate-300"><LogOut size={20} /></button>
        </div>
      </header>

      <section className="mx-auto max-w-xl space-y-5 p-4 pb-28">
        {view === 'home' && (
          <>
            <div className="rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-red-600/20 to-white/[0.03] p-5">
              <p className="text-sm text-red-100/70">Acceso rápido del laboratorio</p>
              <h2 className="mt-1 text-3xl font-black">Alta, búsqueda y agenda desde el móvil.</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MobileStat label="OT abiertas" value={counts.expedientes} />
              <MobileStat label="Urgentes" value={counts.urgentes} danger />
              <MobileStat label="Hoy" value={counts.agendaHoy} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MobileButton icon={<ClipboardList />} label="Nueva OT" onClick={() => setView('alta')} primary />
              <MobileButton icon={<Camera />} label="Cámara" onClick={() => toast('Cámara directa: siguiente sprint')} />
              <MobileButton icon={<Search />} label="Buscar" onClick={() => setView('buscar')} />
              <MobileButton icon={<CalendarDays />} label="Agenda" onClick={() => setView('agenda')} />
              <Link href="/clientes" className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center font-black"><User className="mx-auto mb-2 text-red-400" /> Clientes</Link>
              <Link href="/vehiculos" className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center font-black"><Car className="mx-auto mb-2 text-red-400" /> Vehículos</Link>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              Para instalar: abre autokeyslab.es desde Safari/Chrome y pulsa “Añadir a pantalla de inicio”.
            </div>
          </>
        )}

        {view === 'buscar' && (
          <>
            <button onClick={() => setView('home')} className="rounded-2xl border border-white/10 px-4 py-3 font-bold text-white"><Home size={16} className="mr-2 inline" /> Inicio</button>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <label className="text-sm font-bold text-slate-300">Buscar matrícula, teléfono, cliente, OT o ECU</label>
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-red-500" placeholder="Ej: 1234ABC, Carlos, MD1CS003..." />
            </div>
            {searching && <div className="text-slate-400"><Loader2 className="mr-2 inline animate-spin" /> Buscando...</div>}
            <div className="space-y-3">
              {results.map((item) => (
                <Link key={`${item.type}-${item.id}`} href={item.href} className="block rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-red-400">{item.type}</div>
                  <div className="mt-1 text-xl font-black">{item.title}</div>
                  <div className="text-sm text-slate-400">{item.subtitle}</div>
                </Link>
              ))}
              {query.trim().length >= 2 && !searching && results.length === 0 && <div className="rounded-3xl border border-white/10 p-6 text-center text-slate-500">Sin resultados.</div>}
            </div>
          </>
        )}

        {view === 'agenda' && (
          <>
            <button onClick={() => setView('home')} className="rounded-2xl border border-white/10 px-4 py-3 font-bold text-white"><Home size={16} className="mr-2 inline" /> Inicio</button>
            <div className="space-y-3">
              {agenda.length === 0 ? (
                <div className="rounded-3xl border border-white/10 p-6 text-center text-slate-500">No hay eventos para hoy.</div>
              ) : agenda.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-red-400">{item.tipo || 'agenda'}</div>
                      <div className="mt-1 text-xl font-black">{item.titulo || 'Evento sin título'}</div>
                      <div className="text-sm text-slate-400">{item.hora || 'Sin hora'} · {item.estado || 'pendiente'}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${item.prioridad === 'urgente' ? 'bg-red-600 text-white' : 'bg-white/10 text-slate-300'}`}>{item.prioridad || 'normal'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function MobileStat({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-3xl border p-4 text-center ${danger ? 'border-red-500/30 bg-red-500/10' : 'border-white/10 bg-white/[0.04]'}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  )
}

function MobileButton({ icon, label, onClick, primary = false }: { icon: React.ReactNode; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-3xl p-5 text-center font-black ${primary ? 'bg-red-600 text-white shadow-lg shadow-red-950/40' : 'border border-white/10 bg-white/[0.04] text-white'}`}>
      <span className="mx-auto mb-2 block w-fit text-red-100">{icon}</span>
      {label}
    </button>
  )
}
