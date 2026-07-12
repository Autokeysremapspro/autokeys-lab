'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Building2, Clock3, RefreshCw, Users } from 'lucide-react'

type Distribuidor = {
  id: string
  empresa: string
  nombre_contacto: string
  email: string
  estado: string
  plan_id: string | null
  plan_expira_at: string | null
  solicito_renovacion: boolean
  solicito_renovacion_at: string | null
}

type Plan = { id: string; nombre: string; duracion_dias: number | null }

function diasRestantes(fecha: string | null) {
  if (!fecha) return null
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86400000)
}

export default function DistribuidoresPage() {
  const [distribuidores, setDistribuidores] = useState<Distribuidor[]>([])
  const [planes, setPlanes] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'renovacion' | 'caducados'>('renovacion')

  async function loadAll() {
    setLoading(true)
    const [distRes, planesRes] = await Promise.all([
      supabase.from('akcloud_distribuidores').select('id, empresa, nombre_contacto, email, estado, plan_id, plan_expira_at, solicito_renovacion, solicito_renovacion_at').order('plan_expira_at', { ascending: true }),
      supabase.from('akcloud_planes').select('id, nombre, duracion_dias'),
    ])
    if (distRes.error) toast.error(distRes.error.message)
    setDistribuidores((distRes.data || []) as Distribuidor[])
    setPlanes((planesRes.data || []) as Plan[])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const filtrados = useMemo(() => {
    return distribuidores.filter((d) => {
      if (filtro === 'renovacion') return d.solicito_renovacion
      if (filtro === 'caducados') return d.plan_expira_at && new Date(d.plan_expira_at).getTime() < Date.now()
      return true
    })
  }, [distribuidores, filtro])

  async function confirmarRenovacion(d: Distribuidor) {
    const plan = planes.find((p) => p.id === d.plan_id)
    const dias = plan?.duracion_dias || 30
    const base = d.plan_expira_at && new Date(d.plan_expira_at).getTime() > Date.now() ? new Date(d.plan_expira_at) : new Date()
    const nuevaExpira = new Date(base.getTime() + dias * 24 * 60 * 60 * 1000)

    const { error } = await supabase
      .from('akcloud_distribuidores')
      .update({ plan_expira_at: nuevaExpira.toISOString(), solicito_renovacion: false, solicito_renovacion_at: null })
      .eq('id', d.id)

    if (error) return toast.error(error.message)
    toast.success(`${d.empresa} renovado hasta ${nuevaExpira.toLocaleDateString('es-ES')}`)
    loadAll()
  }

  const pendientesRenovacion = distribuidores.filter((d) => d.solicito_renovacion).length

  return (
    <AppShell>
      <div className="space-y-7">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b0f19] via-[#101827] to-[#19070d] p-7 shadow-2xl shadow-black/30">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link href="/ak-cloud" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
                <ArrowLeft size={16} /> Volver a AK Cloud
              </Link>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-300">
                <Users size={16} /> Distribuidores activos
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">Renovaciones</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">Confirma el pago fuera de aquí y luego dale a renovar — extiende el plan según los días configurados.</p>
            </div>
            <button onClick={loadAll} className="btn btn-dark inline-flex items-center gap-2">
              <RefreshCw size={18} /> Actualizar
            </button>
          </div>
        </section>

        {pendientesRenovacion > 0 && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
            {pendientesRenovacion} distribuidor{pendientesRenovacion === 1 ? '' : 'es'} esperando confirmación de renovación.
          </div>
        )}

        <section className="flex flex-wrap gap-2">
          {(['renovacion', 'caducados', 'todos'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFiltro(item)}
              className={`rounded-2xl px-4 py-2 text-sm font-black uppercase tracking-wider transition ${filtro === item ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
            >
              {item === 'renovacion' ? 'Pidieron renovar' : item === 'caducados' ? 'Caducados' : 'Todos'}
            </button>
          ))}
        </section>

        <section className="space-y-3">
          {loading ? (
            <div className="card p-8 text-zinc-500">Cargando...</div>
          ) : filtrados.length === 0 ? (
            <div className="card p-8 text-zinc-500">No hay distribuidores en este filtro.</div>
          ) : (
            filtrados.map((d) => {
              const dias = diasRestantes(d.plan_expira_at)
              const plan = planes.find((p) => p.id === d.plan_id)
              return (
                <article key={d.id} className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-black"><Building2 size={18} className="text-red-400" /> {d.empresa}</h3>
                    <p className="text-sm text-zinc-500">{d.nombre_contacto} · {d.email}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                      <Clock3 size={13} />
                      {plan?.nombre || 'Sin plan'} · {d.plan_expira_at ? (dias !== null && dias < 0 ? `Caducado hace ${Math.abs(dias)} días` : `${dias} días restantes`) : 'Sin caducidad'}
                    </p>
                    {d.solicito_renovacion && <p className="mt-1 text-xs font-bold text-amber-300">Pidió renovar el {new Date(d.solicito_renovacion_at!).toLocaleDateString('es-ES')}</p>}
                  </div>
                  <button onClick={() => confirmarRenovacion(d)} className="btn btn-red">
                    Confirmar renovación (+{plan?.duracion_dias || 30} días)
                  </button>
                </article>
              )
            })
          )}
        </section>
      </div>
    </AppShell>
  )
}
