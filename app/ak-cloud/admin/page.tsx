'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Servicio = {
  id?: string
  nombre: string
  slug: string
  categoria: string
  grupo_facturacion?: string | null
  descripcion: string | null
  precio: number
  creditos: number
  icono: string | null
  activo: boolean
  orden: number
}

type Plan = {
  id?: string
  nombre: string
  slug: string
  descripcion: string | null
  precio_mensual: number
  creditos_mes: number
  ventajas: string[] | null
  destacado: boolean
  activo: boolean
  orden: number
  grupos_incluidos?: string[] | null
  descuento_plan_pct?: number | null
}

type MetodoPago = {
  id?: string
  codigo: string
  nombre: string
  descripcion: string | null
  activo: boolean
  automatico: boolean
  instrucciones: string | null
  orden: number
}

type ReglaPrecio = {
  id?: string
  nombre: string
  servicio_principal_slug: string
  servicios_gratis: string[] | null
  descuentos: Record<string, number> | null
  solo_planes: string[] | null
  activo: boolean
  orden: number
  nota: string | null
}

type Branding = {
  id: number
  nombre_producto: string
  slogan: string
  subtitulo: string | null
  telefono_soporte: string | null
  email_soporte: string | null
  whatsapp_soporte: string | null
  aviso_portal: string | null
  color_principal: string | null
}

const emptyServicio: Servicio = {
  nombre: '',
  slug: '',
  categoria: 'reprogramacion',
  grupo_facturacion: null,
  descripcion: '',
  precio: 0,
  creditos: 0,
  icono: '⚙️',
  activo: true,
  orden: 100,
}

const emptyPlan: Plan = {
  nombre: '',
  slug: '',
  descripcion: '',
  precio_mensual: 0,
  creditos_mes: 0,
  ventajas: [],
  destacado: false,
  activo: true,
  orden: 100,
  grupos_incluidos: [],
  descuento_plan_pct: 0,
}

const emptyMetodo: MetodoPago = {
  codigo: '',
  nombre: '',
  descripcion: '',
  activo: true,
  automatico: false,
  instrucciones: '',
  orden: 100,
}

const emptyRegla: ReglaPrecio = {
  nombre: '',
  servicio_principal_slug: '',
  servicios_gratis: [],
  descuentos: {},
  solo_planes: [],
  activo: true,
  orden: 100,
  nota: '',
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${checked ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-zinc-800 bg-black/20 text-zinc-400'}`}
    >
      {checked ? 'Activo' : 'Inactivo'} · {label}
    </button>
  )
}

export default function AkCloudAdminPage() {
  const [tab, setTab] = useState<'servicios' | 'reglas' | 'planes' | 'pagos' | 'branding'>('servicios')
  const [loading, setLoading] = useState(true)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [planes, setPlanes] = useState<Plan[]>([])
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [reglas, setReglas] = useState<ReglaPrecio[]>([])
  const [branding, setBranding] = useState<Branding | null>(null)
  const [servicio, setServicio] = useState<Servicio>(emptyServicio)
  const [plan, setPlan] = useState<Plan>(emptyPlan)
  const [metodo, setMetodo] = useState<MetodoPago>(emptyMetodo)
  const [regla, setRegla] = useState<ReglaPrecio>(emptyRegla)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [serviciosRes, planesRes, metodosRes, reglasRes, brandingRes] = await Promise.all([
      supabase.from('akcloud_servicios').select('*').order('orden', { ascending: true }),
      supabase.from('akcloud_planes').select('*').order('orden', { ascending: true }),
      supabase.from('akcloud_metodos_pago').select('*').order('orden', { ascending: true }),
      supabase.from('akcloud_reglas_precios').select('*').order('orden', { ascending: true }),
      supabase.from('akcloud_branding').select('*').eq('id', 1).maybeSingle(),
    ])

    if (serviciosRes.error) toast.error(serviciosRes.error.message)
    if (planesRes.error) toast.error(planesRes.error.message)
    if (metodosRes.error) toast.error(metodosRes.error.message)
    if (reglasRes.error) toast.error(reglasRes.error.message)
    if (brandingRes.error) toast.error(brandingRes.error.message)

    setServicios((serviciosRes.data || []) as Servicio[])
    setPlanes((planesRes.data || []) as Plan[])
    setMetodos((metodosRes.data || []) as MetodoPago[])
    setReglas((reglasRes.data || []) as ReglaPrecio[])
    setBranding((brandingRes.data || null) as Branding | null)
    setLoading(false)
  }

  async function saveServicio() {
    const payload = {
      ...servicio,
      slug: servicio.slug || slugify(servicio.nombre),
      descripcion: servicio.descripcion || null,
      icono: servicio.icono || '⚙️',
      precio: Number(servicio.precio || 0),
      creditos: Number(servicio.creditos || 0),
      orden: Number(servicio.orden || 100),
    }
    const { error } = payload.id
      ? await supabase.from('akcloud_servicios').update(payload).eq('id', payload.id)
      : await supabase.from('akcloud_servicios').insert(payload)
    if (error) return toast.error(error.message)
    toast.success('Servicio guardado')
    setServicio(emptyServicio)
    loadAll()
  }

  async function savePlan() {
    const payload = {
      ...plan,
      slug: plan.slug || slugify(plan.nombre),
      descripcion: plan.descripcion || null,
      precio_mensual: Number(plan.precio_mensual || 0),
      creditos_mes: Number(plan.creditos_mes || 0),
      orden: Number(plan.orden || 100),
      ventajas: Array.isArray(plan.ventajas) ? plan.ventajas : [],
    }
    const { error } = payload.id
      ? await supabase.from('akcloud_planes').update(payload).eq('id', payload.id)
      : await supabase.from('akcloud_planes').insert(payload)
    if (error) return toast.error(error.message)
    toast.success('Plan guardado')
    setPlan(emptyPlan)
    loadAll()
  }

  async function saveMetodo() {
    const payload = {
      ...metodo,
      codigo: metodo.codigo || slugify(metodo.nombre),
      descripcion: metodo.descripcion || null,
      instrucciones: metodo.instrucciones || null,
      orden: Number(metodo.orden || 100),
    }
    const { error } = payload.id
      ? await supabase.from('akcloud_metodos_pago').update(payload).eq('id', payload.id)
      : await supabase.from('akcloud_metodos_pago').insert(payload)
    if (error) return toast.error(error.message)
    toast.success('Método de pago guardado')
    setMetodo(emptyMetodo)
    loadAll()
  }

  function toggleServicioGratis(slug: string) {
    const current = regla.servicios_gratis || []
    const exists = current.includes(slug)
    setRegla({ ...regla, servicios_gratis: exists ? current.filter((item) => item !== slug) : [...current, slug] })
  }

  async function saveRegla() {
    const payload = {
      ...regla,
      nombre: regla.nombre || `Pack ${regla.servicio_principal_slug}`,
      servicios_gratis: regla.servicios_gratis || [],
      descuentos: regla.descuentos || {},
      solo_planes: regla.solo_planes || [],
      activo: Boolean(regla.activo),
      orden: Number(regla.orden || 100),
      nota: regla.nota || null,
    }

    if (!payload.servicio_principal_slug) {
      toast.error('Selecciona un servicio principal')
      return
    }

    const { error } = payload.id
      ? await supabase.from('akcloud_reglas_precios').update(payload).eq('id', payload.id)
      : await supabase.from('akcloud_reglas_precios').insert(payload)

    if (error) return toast.error(error.message)
    toast.success('Regla de precio guardada')
    setRegla(emptyRegla)
    loadAll()
  }

  async function saveBranding() {
    if (!branding) return
    const { error } = await supabase.from('akcloud_branding').upsert({ ...branding, id: 1 })
    if (error) return toast.error(error.message)
    toast.success('Branding guardado')
    loadAll()
  }

  async function remove(table: string, id?: string) {
    if (!id) return
    if (!confirm('¿Eliminar definitivamente este registro?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) return toast.error(error.message)
    toast.success('Eliminado')
    loadAll()
  }

  const stats = useMemo(() => ({
    serviciosActivos: servicios.filter((s) => s.activo).length,
    planesActivos: planes.filter((p) => p.activo).length,
    pagosActivos: metodos.filter((m) => m.activo).length,
    automaticos: metodos.filter((m) => m.automatico).length,
    reglasActivas: reglas.filter((r) => r.activo).length,
  }), [servicios, planes, metodos, reglas])

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-red-300">AK Cloud Admin</div>
          <h1 className="text-3xl font-black tracking-tight">Centro de control AK Cloud</h1>
          <p className="mt-1 text-zinc-500">Configura desde Core lo que verán los distribuidores en el portal: soluciones, precios, planes, pagos y branding.</p>
        </div>
        <button onClick={loadAll} className="btn btn-dark">Actualizar</button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Servicios activos</p><p className="mt-2 text-3xl font-black">{stats.serviciosActivos}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Planes activos</p><p className="mt-2 text-3xl font-black">{stats.planesActivos}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Métodos pago</p><p className="mt-2 text-3xl font-black">{stats.pagosActivos}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Automáticos</p><p className="mt-2 text-3xl font-black">{stats.automaticos}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Reglas pack</p><p className="mt-2 text-3xl font-black">{stats.reglasActivas}</p></div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ['servicios', 'Soluciones / Servicios'],
          ['reglas', 'Reglas de packs'],
          ['planes', 'Planes'],
          ['pagos', 'Métodos de pago'],
          ['branding', 'Branding'],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`btn ${tab === key ? 'btn-red' : 'btn-dark'}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className="card p-8 text-zinc-400">Cargando configuración...</div> : null}

      {!loading && tab === 'servicios' && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="card p-5">
            <h2 className="mb-4 text-xl font-black">{servicio.id ? 'Editar servicio' : 'Nuevo servicio'}</h2>
            <div className="grid gap-4">
              <Field label="Nombre"><input className="w-full" value={servicio.nombre} onChange={(e) => setServicio({ ...servicio, nombre: e.target.value, slug: servicio.slug || slugify(e.target.value) })} placeholder="Stage 1" /></Field>
              <Field label="Slug"><input className="w-full" value={servicio.slug} onChange={(e) => setServicio({ ...servicio, slug: slugify(e.target.value) })} placeholder="stage-1" /></Field>
              <Field label="Categoría"><select className="w-full" value={servicio.categoria} onChange={(e) => setServicio({ ...servicio, categoria: e.target.value })}><option value="reprogramacion">Reprogramación</option><option value="anticontaminacion">Anticontaminación</option><option value="opciones">Opciones</option><option value="electronica">Electrónica</option><option value="otros">Otros</option></select></Field>
              <Field label="Grupo de facturación (qué plan lo cubre con descuento)"><select className="w-full" value={servicio.grupo_facturacion || ''} onChange={(e) => setServicio({ ...servicio, grupo_facturacion: e.target.value || null })}><option value="">Sin grupo (siempre precio completo)</option><option value="anulacion">Anulación (EGR/DPF/AdBlue/DTC/Flaps OFF)</option><option value="tuning">Tuning (Stage 1/2, Pops & Bangs, Hardcut...)</option></select></Field>
              <div className="grid grid-cols-3 gap-3"><Field label="Icono"><input className="w-full" value={servicio.icono || ''} onChange={(e) => setServicio({ ...servicio, icono: e.target.value })} /></Field><Field label="Precio €"><input type="number" className="w-full" value={servicio.precio} onChange={(e) => setServicio({ ...servicio, precio: Number(e.target.value) })} /></Field><Field label="Créditos"><input type="number" className="w-full" value={servicio.creditos} onChange={(e) => setServicio({ ...servicio, creditos: Number(e.target.value) })} /></Field></div>
              <Field label="Descripción"><textarea className="h-24 w-full" value={servicio.descripcion || ''} onChange={(e) => setServicio({ ...servicio, descripcion: e.target.value })} /></Field>
              <div className="flex gap-3"><Toggle checked={servicio.activo} onChange={(v) => setServicio({ ...servicio, activo: v })} label="Visible en portal" /><Field label="Orden"><input type="number" className="w-24" value={servicio.orden} onChange={(e) => setServicio({ ...servicio, orden: Number(e.target.value) })} /></Field></div>
              <div className="flex gap-2"><button onClick={saveServicio} className="btn btn-red flex-1">Guardar servicio</button><button onClick={() => setServicio(emptyServicio)} className="btn btn-dark">Limpiar</button></div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-zinc-800 p-5"><h2 className="text-xl font-black">Servicios publicados</h2></div>
            <div className="overflow-auto">
              <table>
                <thead><tr><th>Servicio</th><th>Categoría</th><th>Precio</th><th>Créditos</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{servicios.map((s) => <tr key={s.id}><td><b>{s.icono} {s.nombre}</b><div className="text-xs text-zinc-500">{s.descripcion}</div></td><td>{s.categoria}{s.grupo_facturacion && <div className="text-xs text-red-300">Grupo: {s.grupo_facturacion}</div>}</td><td>{s.precio} €</td><td>{s.creditos}</td><td><span className={`badge ${s.activo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-500/10 text-zinc-400'}`}>{s.activo ? 'Activo' : 'Inactivo'}</span></td><td><div className="flex gap-2"><button className="btn btn-dark" onClick={() => setServicio(s)}>Editar</button><button className="btn btn-dark text-red-300" onClick={() => remove('akcloud_servicios', s.id)}>Eliminar</button></div></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'reglas' && (
        <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
          <div className="card p-5">
            <h2 className="mb-4 text-xl font-black">{regla.id ? 'Editar regla de pack' : 'Nueva regla de pack'}</h2>
            <p className="mb-5 text-sm text-zinc-500">Define qué extras quedan incluidos a 0 € cuando el distribuidor selecciona un servicio principal como Stage 1 o Stage 2.</p>
            <div className="grid gap-4">
              <Field label="Nombre de la regla">
                <input className="w-full" value={regla.nombre} onChange={(e) => setRegla({ ...regla, nombre: e.target.value })} placeholder="Stage 1 incluye EGR + Start/Stop" />
              </Field>
              <Field label="Servicio principal">
                <select className="w-full" value={regla.servicio_principal_slug} onChange={(e) => setRegla({ ...regla, servicio_principal_slug: e.target.value, nombre: regla.nombre || `Pack ${e.target.value}` })}>
                  <option value="">Seleccionar servicio...</option>
                  {servicios.filter((s) => s.activo).map((s) => <option key={s.slug} value={s.slug}>{s.icono} {s.nombre}</option>)}
                </select>
              </Field>

              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Extras incluidos gratis</p>
                <div className="grid max-h-80 gap-2 overflow-auto rounded-3xl border border-zinc-800 bg-black/20 p-3">
                  {servicios.filter((s) => s.slug !== regla.servicio_principal_slug).map((s) => {
                    const checked = (regla.servicios_gratis || []).includes(s.slug)
                    return (
                      <button
                        key={s.slug}
                        type="button"
                        onClick={() => toggleServicioGratis(s.slug)}
                        className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${checked ? 'border-red-500/50 bg-red-500/10 text-white' : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700'}`}
                      >
                        <span className="font-bold">{s.icono} {s.nombre}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-black ${checked ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{checked ? 'Incluido' : '+ Añadir'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Field label="Aplicar solo a planes (opcional, uno por línea)">
                <textarea className="h-20 w-full" value={(regla.solo_planes || []).join('\n')} onChange={(e) => setRegla({ ...regla, solo_planes: e.target.value.split('\n').map((v) => v.trim()).filter(Boolean) })} placeholder="pro\nbusiness" />
              </Field>
              <Field label="Nota interna">
                <textarea className="h-20 w-full" value={regla.nota || ''} onChange={(e) => setRegla({ ...regla, nota: e.target.value })} placeholder="Regla para promociones o packs de Stage" />
              </Field>
              <div className="flex gap-3"><Toggle checked={regla.activo} onChange={(v) => setRegla({ ...regla, activo: v })} label="Regla activa" /><Field label="Orden"><input type="number" className="w-24" value={regla.orden} onChange={(e) => setRegla({ ...regla, orden: Number(e.target.value) })} /></Field></div>
              <div className="flex gap-2"><button onClick={saveRegla} className="btn btn-red flex-1">Guardar regla</button><button onClick={() => setRegla(emptyRegla)} className="btn btn-dark">Limpiar</button></div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-zinc-800 p-5">
              <h2 className="text-xl font-black">Reglas activas del portal</h2>
              <p className="mt-1 text-sm text-zinc-500">AK Cloud usará estas reglas para mostrar extras incluidos y calcular el total del pedido.</p>
            </div>
            <div className="overflow-auto">
              <table>
                <thead><tr><th>Regla</th><th>Servicio principal</th><th>Extras incluidos</th><th>Planes</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{reglas.map((r) => <tr key={r.id}><td><b>{r.nombre}</b><div className="text-xs text-zinc-500">{r.nota || 'Sin nota'}</div></td><td>{servicios.find((s) => s.slug === r.servicio_principal_slug)?.nombre || r.servicio_principal_slug}</td><td>{(r.servicios_gratis || []).length ? (r.servicios_gratis || []).map((slug) => servicios.find((s) => s.slug === slug)?.nombre || slug).join(', ') : '—'}</td><td>{(r.solo_planes || []).length ? (r.solo_planes || []).join(', ') : 'Todos'}</td><td><span className={`badge ${r.activo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-500/10 text-zinc-400'}`}>{r.activo ? 'Activa' : 'Inactiva'}</span></td><td><div className="flex gap-2"><button className="btn btn-dark" onClick={() => setRegla({ ...r, servicios_gratis: r.servicios_gratis || [], solo_planes: r.solo_planes || [] })}>Editar</button><button className="btn btn-dark text-red-300" onClick={() => remove('akcloud_reglas_precios', r.id)}>Eliminar</button></div></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && tab === 'planes' && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="card p-5"><h2 className="mb-4 text-xl font-black">{plan.id ? 'Editar plan' : 'Nuevo plan'}</h2><div className="grid gap-4">
            <Field label="Nombre"><input className="w-full" value={plan.nombre} onChange={(e) => setPlan({ ...plan, nombre: e.target.value, slug: plan.slug || slugify(e.target.value) })} /></Field>
            <Field label="Slug"><input className="w-full" value={plan.slug} onChange={(e) => setPlan({ ...plan, slug: slugify(e.target.value) })} /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Precio mensual"><input type="number" className="w-full" value={plan.precio_mensual} onChange={(e) => setPlan({ ...plan, precio_mensual: Number(e.target.value) })} /></Field><Field label="Créditos / mes"><input type="number" className="w-full" value={plan.creditos_mes} onChange={(e) => setPlan({ ...plan, creditos_mes: Number(e.target.value) })} /></Field></div>
            <Field label="Descripción"><textarea className="h-20 w-full" value={plan.descripcion || ''} onChange={(e) => setPlan({ ...plan, descripcion: e.target.value })} /></Field>
            <Field label="Ventajas (una por línea)"><textarea className="h-28 w-full" value={(plan.ventajas || []).join('\n')} onChange={(e) => setPlan({ ...plan, ventajas: e.target.value.split('\n').map((v) => v.trim()).filter(Boolean) })} /></Field>
            <Field label="Grupos cubiertos con descuento">
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={(plan.grupos_incluidos || []).includes('anulacion')} onChange={(e) => {
                    const current = plan.grupos_incluidos || []
                    setPlan({ ...plan, grupos_incluidos: e.target.checked ? [...current, 'anulacion'] : current.filter((g: string) => g !== 'anulacion') })
                  }} /> Anulaciones
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300">
                  <input type="checkbox" checked={(plan.grupos_incluidos || []).includes('tuning')} onChange={(e) => {
                    const current = plan.grupos_incluidos || []
                    setPlan({ ...plan, grupos_incluidos: e.target.checked ? [...current, 'tuning'] : current.filter((g: string) => g !== 'tuning') })
                  }} /> Tuning
                </label>
              </div>
            </Field>
            <Field label="Descuento en esos grupos (%)"><input type="number" className="w-full" value={plan.descuento_plan_pct || 0} onChange={(e) => setPlan({ ...plan, descuento_plan_pct: Number(e.target.value) })} /></Field>
            <div className="flex gap-2"><Toggle checked={plan.activo} onChange={(v) => setPlan({ ...plan, activo: v })} label="Plan activo" /><Toggle checked={plan.destacado} onChange={(v) => setPlan({ ...plan, destacado: v })} label="Destacado" /></div>
            <div className="flex gap-2"><button onClick={savePlan} className="btn btn-red flex-1">Guardar plan</button><button onClick={() => setPlan(emptyPlan)} className="btn btn-dark">Limpiar</button></div>
          </div></div>
          <div className="grid gap-4 md:grid-cols-2">{planes.map((p) => <div key={p.id} className="card p-5"><div className="flex justify-between"><h3 className="text-xl font-black">{p.nombre}</h3><span className="badge bg-red-500/10 text-red-300">{p.precio_mensual} €/mes</span></div><p className="mt-2 text-sm text-zinc-400">{p.descripcion}</p><p className="mt-4 text-3xl font-black">{p.creditos_mes} créditos</p><div className="mt-2 flex gap-2 text-xs text-zinc-400">{(p.grupos_incluidos || []).length === 0 ? <span>Sin descuento de grupo</span> : <span>{(p.grupos_incluidos || []).join(' + ')} · -{p.descuento_plan_pct || 0}%</span>}</div><ul className="mt-4 space-y-1 text-sm text-zinc-400">{(p.ventajas || []).map((v) => <li key={v}>✓ {v}</li>)}</ul><div className="mt-5 flex gap-2"><button className="btn btn-dark" onClick={() => setPlan(p)}>Editar</button><button className="btn btn-dark text-red-300" onClick={() => remove('akcloud_planes', p.id)}>Eliminar</button></div></div>)}</div>
        </div>
      )}

      {!loading && tab === 'pagos' && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="card p-5"><h2 className="mb-4 text-xl font-black">{metodo.id ? 'Editar método' : 'Nuevo método'}</h2><div className="grid gap-4">
            <Field label="Nombre"><input className="w-full" value={metodo.nombre} onChange={(e) => setMetodo({ ...metodo, nombre: e.target.value, codigo: metodo.codigo || slugify(e.target.value) })} /></Field>
            <Field label="Código"><input className="w-full" value={metodo.codigo} onChange={(e) => setMetodo({ ...metodo, codigo: slugify(e.target.value) })} /></Field>
            <Field label="Descripción"><textarea className="h-20 w-full" value={metodo.descripcion || ''} onChange={(e) => setMetodo({ ...metodo, descripcion: e.target.value })} /></Field>
            <Field label="Instrucciones visibles"><textarea className="h-28 w-full" value={metodo.instrucciones || ''} onChange={(e) => setMetodo({ ...metodo, instrucciones: e.target.value })} /></Field>
            <div className="flex gap-2"><Toggle checked={metodo.activo} onChange={(v) => setMetodo({ ...metodo, activo: v })} label="Visible" /><Toggle checked={metodo.automatico} onChange={(v) => setMetodo({ ...metodo, automatico: v })} label="Automático" /></div>
            <div className="flex gap-2"><button onClick={saveMetodo} className="btn btn-red flex-1">Guardar método</button><button onClick={() => setMetodo(emptyMetodo)} className="btn btn-dark">Limpiar</button></div>
          </div></div>
          <div className="grid gap-4 md:grid-cols-2">{metodos.map((m) => <div key={m.id} className="card p-5"><div className="flex items-start justify-between"><h3 className="text-xl font-black">{m.nombre}</h3><span className={`badge ${m.activo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-500/10 text-zinc-400'}`}>{m.activo ? 'Activo' : 'Oculto'}</span></div><p className="mt-2 text-sm text-zinc-400">{m.descripcion}</p><p className="mt-3 rounded-2xl bg-black/20 p-3 text-sm text-zinc-400">{m.instrucciones || 'Sin instrucciones'}</p><p className="mt-3 text-xs uppercase tracking-wider text-zinc-500">{m.automatico ? 'Activación automática' : 'Activación manual'}</p><div className="mt-5 flex gap-2"><button className="btn btn-dark" onClick={() => setMetodo(m)}>Editar</button><button className="btn btn-dark text-red-300" onClick={() => remove('akcloud_metodos_pago', m.id)}>Eliminar</button></div></div>)}</div>
        </div>
      )}

      {!loading && tab === 'branding' && branding && (
        <div className="grid gap-6 xl:grid-cols-[520px_1fr]">
          <div className="card p-5"><h2 className="mb-4 text-xl font-black">Marca y textos del portal</h2><div className="grid gap-4">
            <Field label="Nombre producto"><input className="w-full" value={branding.nombre_producto} onChange={(e) => setBranding({ ...branding, nombre_producto: e.target.value })} /></Field>
            <Field label="Slogan"><input className="w-full" value={branding.slogan} onChange={(e) => setBranding({ ...branding, slogan: e.target.value })} /></Field>
            <Field label="Subtítulo"><input className="w-full" value={branding.subtitulo || ''} onChange={(e) => setBranding({ ...branding, subtitulo: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Email soporte"><input className="w-full" value={branding.email_soporte || ''} onChange={(e) => setBranding({ ...branding, email_soporte: e.target.value })} /></Field><Field label="WhatsApp"><input className="w-full" value={branding.whatsapp_soporte || ''} onChange={(e) => setBranding({ ...branding, whatsapp_soporte: e.target.value })} /></Field></div>
            <Field label="Aviso del portal"><textarea className="h-24 w-full" value={branding.aviso_portal || ''} onChange={(e) => setBranding({ ...branding, aviso_portal: e.target.value })} /></Field>
            <Field label="Color principal"><input className="w-full" value={branding.color_principal || '#D90429'} onChange={(e) => setBranding({ ...branding, color_principal: e.target.value })} /></Field>
            <button onClick={saveBranding} className="btn btn-red">Guardar branding</button>
          </div></div>
          <div className="card overflow-hidden p-0"><div className="bg-gradient-to-br from-red-600/25 via-black to-zinc-950 p-8"><p className="text-xs font-black uppercase tracking-[0.3em] text-red-300">Preview AK Cloud</p><h3 className="mt-8 text-5xl font-black">{branding.nombre_producto}</h3><p className="mt-3 max-w-xl text-xl text-zinc-300">{branding.slogan}</p><p className="mt-2 text-zinc-500">{branding.subtitulo}</p><div className="mt-8 inline-flex rounded-2xl bg-red-600 px-5 py-3 font-black">Entrar al portal</div></div></div>
        </div>
      )}
    </AppShell>
  )
}
