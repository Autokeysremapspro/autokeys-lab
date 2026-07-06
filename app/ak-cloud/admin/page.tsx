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
  const [tab, setTab] = useState<'servicios' | 'planes' | 'pagos' | 'branding'>('servicios')
  const [loading, setLoading] = useState(true)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [planes, setPlanes] = useState<Plan[]>([])
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [branding, setBranding] = useState<Branding | null>(null)
  const [servicio, setServicio] = useState<Servicio>(emptyServicio)
  const [plan, setPlan] = useState<Plan>(emptyPlan)
  const [metodo, setMetodo] = useState<MetodoPago>(emptyMetodo)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [serviciosRes, planesRes, metodosRes, brandingRes] = await Promise.all([
      supabase.from('akcloud_servicios').select('*').order('orden', { ascending: true }),
      supabase.from('akcloud_planes').select('*').order('orden', { ascending: true }),
      supabase.from('akcloud_metodos_pago').select('*').order('orden', { ascending: true }),
      supabase.from('akcloud_branding').select('*').eq('id', 1).maybeSingle(),
    ])

    if (serviciosRes.error) toast.error(serviciosRes.error.message)
    if (planesRes.error) toast.error(planesRes.error.message)
    if (metodosRes.error) toast.error(metodosRes.error.message)
    if (brandingRes.error) toast.error(brandingRes.error.message)

    setServicios((serviciosRes.data || []) as Servicio[])
    setPlanes((planesRes.data || []) as Plan[])
    setMetodos((metodosRes.data || []) as MetodoPago[])
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
  }), [servicios, planes, metodos])

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

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Servicios activos</p><p className="mt-2 text-3xl font-black">{stats.serviciosActivos}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Planes activos</p><p className="mt-2 text-3xl font-black">{stats.planesActivos}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Métodos pago</p><p className="mt-2 text-3xl font-black">{stats.pagosActivos}</p></div>
        <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Automáticos</p><p className="mt-2 text-3xl font-black">{stats.automaticos}</p></div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          ['servicios', 'Soluciones / Servicios'],
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
                <tbody>{servicios.map((s) => <tr key={s.id}><td><b>{s.icono} {s.nombre}</b><div className="text-xs text-zinc-500">{s.descripcion}</div></td><td>{s.categoria}</td><td>{s.precio} €</td><td>{s.creditos}</td><td><span className={`badge ${s.activo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-500/10 text-zinc-400'}`}>{s.activo ? 'Activo' : 'Inactivo'}</span></td><td><div className="flex gap-2"><button className="btn btn-dark" onClick={() => setServicio(s)}>Editar</button><button className="btn btn-dark text-red-300" onClick={() => remove('akcloud_servicios', s.id)}>Eliminar</button></div></td></tr>)}</tbody>
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
            <div className="flex gap-2"><Toggle checked={plan.activo} onChange={(v) => setPlan({ ...plan, activo: v })} label="Plan activo" /><Toggle checked={plan.destacado} onChange={(v) => setPlan({ ...plan, destacado: v })} label="Destacado" /></div>
            <div className="flex gap-2"><button onClick={savePlan} className="btn btn-red flex-1">Guardar plan</button><button onClick={() => setPlan(emptyPlan)} className="btn btn-dark">Limpiar</button></div>
          </div></div>
          <div className="grid gap-4 md:grid-cols-2">{planes.map((p) => <div key={p.id} className="card p-5"><div className="flex justify-between"><h3 className="text-xl font-black">{p.nombre}</h3><span className="badge bg-red-500/10 text-red-300">{p.precio_mensual} €/mes</span></div><p className="mt-2 text-sm text-zinc-400">{p.descripcion}</p><p className="mt-4 text-3xl font-black">{p.creditos_mes} créditos</p><ul className="mt-4 space-y-1 text-sm text-zinc-400">{(p.ventajas || []).map((v) => <li key={v}>✓ {v}</li>)}</ul><div className="mt-5 flex gap-2"><button className="btn btn-dark" onClick={() => setPlan(p)}>Editar</button><button className="btn btn-dark text-red-300" onClick={() => remove('akcloud_planes', p.id)}>Eliminar</button></div></div>)}</div>
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
