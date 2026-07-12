'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Layers, Plus, Save, Sparkles, Trash2, X } from 'lucide-react'

type Plan = {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  precio_mensual: number
  creditos_mes: number
  activo: boolean
  destacado: boolean
  duracion_dias: number | null
  limite_diario_pedidos: number | null
}

type Servicio = {
  id: string
  nombre: string
  slug: string
  icono: string | null
  precio: number
  creditos: number
}

type PlanServicio = {
  id?: string
  plan_id: string
  servicio_id: string
  incluido: boolean
  precio_override: number | null
  creditos_override: number | null
}

function slugify(value: string) {
  return value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const emptyPlan = { nombre: '', descripcion: '', precio_mensual: 0, creditos_mes: 0, activo: true, destacado: false, duracion_dias: 30, limite_diario_pedidos: null as number | null }

export default function PlanesAkPage() {
  const [planes, setPlanes] = useState<Plan[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [planServicios, setPlanServicios] = useState<PlanServicio[]>([])
  const [loading, setLoading] = useState(true)
  const [planActivo, setPlanActivo] = useState<string | null>(null)
  const [nuevoPlan, setNuevoPlan] = useState(emptyPlan)
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [servicioAAgregar, setServicioAAgregar] = useState('')

  async function loadAll() {
    setLoading(true)
    const [planesRes, serviciosRes, planServiciosRes] = await Promise.all([
      supabase.from('akcloud_planes').select('id, nombre, slug, descripcion, precio_mensual, creditos_mes, activo, destacado, duracion_dias, limite_diario_pedidos').order('orden', { ascending: true }),
      supabase.from('akcloud_servicios').select('id, nombre, slug, icono, precio, creditos').eq('activo', true).order('orden', { ascending: true }),
      supabase.from('akcloud_plan_servicios').select('*'),
    ])
    if (planesRes.error) toast.error(planesRes.error.message)
    setPlanes((planesRes.data || []) as Plan[])
    setServicios((serviciosRes.data || []) as Servicio[])
    setPlanServicios((planServiciosRes.data || []) as PlanServicio[])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const plan = useMemo(() => planes.find((p) => p.id === planActivo) || null, [planes, planActivo])
  const serviciosDelPlan = useMemo(
    () => planServicios.filter((ps) => ps.plan_id === planActivo && ps.incluido),
    [planServicios, planActivo]
  )
  const serviciosDisponibles = useMemo(
    () => servicios.filter((s) => !serviciosDelPlan.some((ps) => ps.servicio_id === s.id)),
    [servicios, serviciosDelPlan]
  )

  async function crearPlan() {
    if (!nuevoPlan.nombre.trim()) return toast.error('Ponle un nombre al plan')
    const { data, error } = await supabase
      .from('akcloud_planes')
      .insert({
        nombre: nuevoPlan.nombre.trim(),
        slug: slugify(nuevoPlan.nombre),
        descripcion: nuevoPlan.descripcion || null,
        precio_mensual: Number(nuevoPlan.precio_mensual || 0),
        creditos_mes: Number(nuevoPlan.creditos_mes || 0),
        duracion_dias: Number(nuevoPlan.duracion_dias || 30),
        limite_diario_pedidos: nuevoPlan.limite_diario_pedidos,
        activo: true,
        destacado: false,
        orden: 100,
      })
      .select('id')
      .single()
    if (error) return toast.error(error.message)
    toast.success('Plan creado')
    setNuevoPlan(emptyPlan)
    setMostrarNuevo(false)
    await loadAll()
    setPlanActivo(data.id)
  }

  async function borrarPlan(id: string) {
    if (!confirm('¿Borrar este plan? Los distribuidores que lo tengan asignado se quedarán sin plan.')) return
    const { error } = await supabase.from('akcloud_planes').delete().eq('id', id)
    if (error) return toast.error(error.message)
    if (planActivo === id) setPlanActivo(null)
    toast.success('Plan borrado')
    loadAll()
  }

  async function guardarDatosPlan() {
    if (!plan) return
    const { error } = await supabase
      .from('akcloud_planes')
      .update({
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precio_mensual: Number(plan.precio_mensual || 0),
        creditos_mes: Number(plan.creditos_mes || 0),
        duracion_dias: Number(plan.duracion_dias || 30),
        limite_diario_pedidos: plan.limite_diario_pedidos,
        activo: plan.activo,
        destacado: plan.destacado,
      })
      .eq('id', plan.id)
    if (error) return toast.error(error.message)
    toast.success('Plan actualizado')
    loadAll()
  }

  async function agregarServicio() {
    if (!planActivo || !servicioAAgregar) return
    const servicio = servicios.find((s) => s.id === servicioAAgregar)
    if (!servicio) return

    const { error } = await supabase.from('akcloud_plan_servicios').upsert(
      {
        plan_id: planActivo,
        servicio_id: servicioAAgregar,
        incluido: true,
        precio_override: servicio.precio,
        creditos_override: servicio.creditos,
      },
      { onConflict: 'plan_id,servicio_id' }
    )
    if (error) return toast.error(error.message)
    setServicioAAgregar('')
    loadAll()
  }

  async function quitarServicio(servicioId: string) {
    if (!planActivo) return
    const { error } = await supabase
      .from('akcloud_plan_servicios')
      .delete()
      .eq('plan_id', planActivo)
      .eq('servicio_id', servicioId)
    if (error) return toast.error(error.message)
    loadAll()
  }

  function actualizarValorLocal(servicioId: string, campo: 'precio_override' | 'creditos_override', valor: number) {
    setPlanServicios((current) =>
      current.map((ps) => (ps.plan_id === planActivo && ps.servicio_id === servicioId ? { ...ps, [campo]: valor } : ps))
    )
  }

  async function guardarValorServicio(servicioId: string) {
    if (!planActivo) return
    const fila = planServicios.find((ps) => ps.plan_id === planActivo && ps.servicio_id === servicioId)
    if (!fila) return
    const { error } = await supabase
      .from('akcloud_plan_servicios')
      .update({ precio_override: fila.precio_override, creditos_override: fila.creditos_override })
      .eq('plan_id', planActivo)
      .eq('servicio_id', servicioId)
    if (error) toast.error(error.message)
    else toast.success('Precio actualizado')
  }

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
                <Layers size={16} /> Planes AK
              </div>
              <h1 className="text-4xl font-black tracking-tight lg:text-6xl">Diseña tus planes</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">Crea cada plan y decide qué servicios lleva y a qué precio exacto — libre, sin porcentajes ni reglas automáticas.</p>
            </div>
            <button onClick={() => setMostrarNuevo(true)} className="btn btn-red inline-flex items-center gap-2">
              <Plus size={18} /> Nuevo plan
            </button>
          </div>
        </section>

        {mostrarNuevo && (
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Nuevo plan</h2>
              <button onClick={() => setMostrarNuevo(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre del plan</label>
                <input className="w-full" placeholder="Essential" value={nuevoPlan.nombre} onChange={(e) => setNuevoPlan({ ...nuevoPlan, nombre: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Descripción</label>
                <input className="w-full" placeholder="Anulaciones con descuento" value={nuevoPlan.descripcion} onChange={(e) => setNuevoPlan({ ...nuevoPlan, descripcion: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Precio mensual (€)</label>
                <input type="number" className="w-full" value={nuevoPlan.precio_mensual} onChange={(e) => setNuevoPlan({ ...nuevoPlan, precio_mensual: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Créditos incluidos al mes</label>
                <input type="number" className="w-full" value={nuevoPlan.creditos_mes} onChange={(e) => setNuevoPlan({ ...nuevoPlan, creditos_mes: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Duración del plan (días)</label>
                <input type="number" className="w-full" placeholder="30" value={nuevoPlan.duracion_dias} onChange={(e) => setNuevoPlan({ ...nuevoPlan, duracion_dias: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Límite de pedidos al día (vacío = sin límite)</label>
                <input type="number" className="w-full" placeholder="Sin límite" value={nuevoPlan.limite_diario_pedidos ?? ''} onChange={(e) => setNuevoPlan({ ...nuevoPlan, limite_diario_pedidos: e.target.value === '' ? null : Number(e.target.value) })} />
              </div>
            </div>
            <button onClick={crearPlan} className="btn btn-red mt-4 inline-flex items-center gap-2"><Save size={16} /> Crear plan</button>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-3">
            {loading ? (
              <div className="card p-6 text-zinc-500">Cargando...</div>
            ) : planes.length === 0 ? (
              <div className="card p-6 text-zinc-500">Todavía no hay planes. Crea el primero.</div>
            ) : (
              planes.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlanActivo(p.id)}
                  className={`card block w-full p-4 text-left transition ${planActivo === p.id ? 'border-red-500/40 bg-red-500/[.06]' : 'hover:border-red-400/25'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black">{p.nombre}</span>
                    {p.destacado && <Sparkles size={14} className="text-red-400" />}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{p.precio_mensual} €/mes · {p.creditos_mes} créditos</p>
                  <p className="mt-1 text-xs text-zinc-500">{p.duracion_dias || 30} días{p.limite_diario_pedidos ? ` · máx. ${p.limite_diario_pedidos}/día` : ' · sin límite diario'}</p>
                  <p className="mt-1 text-xs text-zinc-600">{planServicios.filter((ps) => ps.plan_id === p.id && ps.incluido).length} servicios</p>
                </button>
              ))
            )}
          </div>

          <div>
            {!plan ? (
              <div className="card flex h-full min-h-[300px] items-center justify-center p-8 text-center text-zinc-500">
                Elige un plan de la lista, o crea uno nuevo, para añadirle servicios y precios.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="card p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre</label>
                      <input className="w-full" value={plan.nombre} onChange={(e) => setPlanes((cur) => cur.map((x) => (x.id === plan.id ? { ...x, nombre: e.target.value } : x)))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Descripción</label>
                      <input className="w-full" value={plan.descripcion || ''} onChange={(e) => setPlanes((cur) => cur.map((x) => (x.id === plan.id ? { ...x, descripcion: e.target.value } : x)))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Precio mensual (€)</label>
                      <input type="number" className="w-full" value={plan.precio_mensual} onChange={(e) => setPlanes((cur) => cur.map((x) => (x.id === plan.id ? { ...x, precio_mensual: Number(e.target.value) } : x)))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Créditos / mes</label>
                      <input type="number" className="w-full" value={plan.creditos_mes} onChange={(e) => setPlanes((cur) => cur.map((x) => (x.id === plan.id ? { ...x, creditos_mes: Number(e.target.value) } : x)))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Duración del plan (días)</label>
                      <input type="number" className="w-full" value={plan.duracion_dias ?? 30} onChange={(e) => setPlanes((cur) => cur.map((x) => (x.id === plan.id ? { ...x, duracion_dias: Number(e.target.value) } : x)))} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500">Límite de pedidos al día</label>
                      <input type="number" className="w-full" placeholder="Sin límite" value={plan.limite_diario_pedidos ?? ''} onChange={(e) => setPlanes((cur) => cur.map((x) => (x.id === plan.id ? { ...x, limite_diario_pedidos: e.target.value === '' ? null : Number(e.target.value) } : x)))} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={guardarDatosPlan} className="btn btn-red inline-flex items-center gap-2"><Save size={16} /> Guardar datos del plan</button>
                    <button onClick={() => borrarPlan(plan.id)} className="btn btn-dark inline-flex items-center gap-2 text-red-300"><Trash2 size={16} /> Borrar plan</button>
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="mb-4 text-lg font-black">Servicios de este plan</h3>

                  <div className="mb-4 flex gap-2">
                    <select className="flex-1" value={servicioAAgregar} onChange={(e) => setServicioAAgregar(e.target.value)}>
                      <option value="">Elige un servicio para añadir...</option>
                      {serviciosDisponibles.map((s) => (
                        <option key={s.id} value={s.id}>{s.icono} {s.nombre}</option>
                      ))}
                    </select>
                    <button onClick={agregarServicio} disabled={!servicioAAgregar} className="btn btn-red inline-flex items-center gap-2 disabled:opacity-40">
                      <Plus size={16} /> Añadir
                    </button>
                  </div>

                  {serviciosDelPlan.length === 0 ? (
                    <p className="py-6 text-center text-sm text-zinc-500">Este plan todavía no tiene ningún servicio añadido.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                          <th className="pb-2">Servicio</th>
                          <th className="pb-2">Precio en este plan (€)</th>
                          <th className="pb-2">Créditos en este plan</th>
                          <th className="pb-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {serviciosDelPlan.map((ps) => {
                          const servicio = servicios.find((s) => s.id === ps.servicio_id)
                          if (!servicio) return null
                          return (
                            <tr key={ps.servicio_id} className="border-t border-white/5">
                              <td className="py-2"><b>{servicio.icono} {servicio.nombre}</b><div className="text-xs text-zinc-600">Precio base: {servicio.precio} € · {servicio.creditos} cr</div></td>
                              <td className="py-2">
                                <input
                                  type="number"
                                  className="w-28"
                                  value={ps.precio_override ?? ''}
                                  onChange={(e) => actualizarValorLocal(servicio.id, 'precio_override', Number(e.target.value))}
                                  onBlur={() => guardarValorServicio(servicio.id)}
                                />
                              </td>
                              <td className="py-2">
                                <input
                                  type="number"
                                  className="w-28"
                                  value={ps.creditos_override ?? ''}
                                  onChange={(e) => actualizarValorLocal(servicio.id, 'creditos_override', Number(e.target.value))}
                                  onBlur={() => guardarValorServicio(servicio.id)}
                                />
                              </td>
                              <td className="py-2 text-right">
                                <button onClick={() => quitarServicio(servicio.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                  <p className="mt-4 text-xs text-zinc-600">Los cambios de precio/créditos se guardan solos al salir del campo (clic fuera).</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
