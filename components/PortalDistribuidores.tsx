'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Edit3,
  Euro,
  MessageSquare,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  UploadCloud,
  Users,
  X,
} from 'lucide-react'
import {
  actualizarSolicitudDistribuidor,
  crearMensajeSolicitud,
  crearSolicitudDistribuidor,
  eliminarSolicitudDistribuidor,
  getDistribuidores,
  getMensajesSolicitud,
  getPerfilesDistribuidores,
  getSolicitudesDistribuidores,
  type DistribuidorPerfil,
  type DistribuidorUsuario,
  type MensajeDistribuidor,
  type SolicitudDistribuidor,
  upsertPerfilDistribuidor,
} from '@/lib/services/portal-distribuidores'

const estados = ['pendiente', 'en_proceso', 'enviado', 'revision', 'finalizado', 'cancelado']
const prioridades = ['baja', 'normal', 'alta', 'urgente']

type SolicitudForm = Partial<SolicitudDistribuidor>

const emptySolicitud: SolicitudForm = {
  distribuidor_id: '',
  taller: '',
  marca: '',
  modelo: '',
  motor: '',
  matricula: '',
  ecu: '',
  hw: '',
  sw: '',
  servicio: 'Stage 1',
  estado: 'pendiente',
  prioridad: 'normal',
  precio: 0,
  pagado: false,
  fecha_entrega_prevista: '',
  notas: '',
}

function money(value?: number | null) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function statusClass(estado?: string | null) {
  if (estado === 'finalizado') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
  if (estado === 'enviado') return 'bg-blue-500/15 text-blue-300 border-blue-500/20'
  if (estado === 'en_proceso') return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20'
  if (estado === 'cancelado') return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/20'
  if (estado === 'revision') return 'bg-purple-500/15 text-purple-300 border-purple-500/20'
  return 'bg-red-500/15 text-red-300 border-red-500/20'
}

export default function PortalDistribuidores() {
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [distribuidores, setDistribuidores] = useState<DistribuidorUsuario[]>([])
  const [perfiles, setPerfiles] = useState<DistribuidorPerfil[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudDistribuidor[]>([])
  const [editing, setEditing] = useState<SolicitudDistribuidor | null>(null)
  const [form, setForm] = useState<SolicitudForm>(emptySolicitud)
  const [openForm, setOpenForm] = useState(false)
  const [selected, setSelected] = useState<SolicitudDistribuidor | null>(null)
  const [mensajes, setMensajes] = useState<MensajeDistribuidor[]>([])
  const [mensaje, setMensaje] = useState('')
  const [perfilDraft, setPerfilDraft] = useState<DistribuidorPerfil | null>(null)

  async function loadAll() {
    setLoading(true)
    try {
      const [dist, perf, sols] = await Promise.all([
        getDistribuidores(),
        getPerfilesDistribuidores(),
        getSolicitudesDistribuidores(),
      ])
      setDistribuidores(dist)
      setPerfiles(perf)
      setSolicitudes(sols)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    async function loadMensajes() {
      if (!selected?.id) {
        setMensajes([])
        return
      }
      setMensajes(await getMensajesSolicitud(selected.id))
    }
    loadMensajes()
  }, [selected?.id])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return solicitudes
    return solicitudes.filter((s) => [
      s.taller,
      s.usuarios?.nombre,
      s.marca,
      s.modelo,
      s.motor,
      s.matricula,
      s.ecu,
      s.hw,
      s.sw,
      s.servicio,
      s.estado,
    ].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [query, solicitudes])

  const stats = useMemo(() => {
    return {
      total: solicitudes.length,
      pendientes: solicitudes.filter((s) => s.estado === 'pendiente').length,
      proceso: solicitudes.filter((s) => s.estado === 'en_proceso').length,
      finalizados: solicitudes.filter((s) => s.estado === 'finalizado').length,
      pendienteCobro: solicitudes.filter((s) => !s.pagado).reduce((sum, s) => sum + Number(s.precio || 0), 0),
    }
  }, [solicitudes])

  function startCreate() {
    setEditing(null)
    setForm(emptySolicitud)
    setOpenForm(true)
  }

  function startEdit(s: SolicitudDistribuidor) {
    setEditing(s)
    setForm({ ...s, fecha_entrega_prevista: s.fecha_entrega_prevista || '' })
    setOpenForm(true)
  }

  async function submitSolicitud(e: React.FormEvent) {
    e.preventDefault()
    if (!form.servicio) return alert('Indica el servicio')
    if (editing) await actualizarSolicitudDistribuidor(editing.id, form)
    else await crearSolicitudDistribuidor(form)
    setOpenForm(false)
    setEditing(null)
    setForm(emptySolicitud)
    await loadAll()
  }

  async function removeSolicitud(id: string) {
    if (!confirm('¿Eliminar esta solicitud de File Service?')) return
    await eliminarSolicitudDistribuidor(id)
    if (selected?.id === id) setSelected(null)
    await loadAll()
  }

  async function sendMensaje() {
    if (!selected || !mensaje.trim()) return
    await crearMensajeSolicitud({
      file_service_id: selected.id,
      distribuidor_id: selected.distribuidor_id || null,
      autor: 'Autokeys',
      mensaje: mensaje.trim(),
      visible_distribuidor: true,
    })
    setMensaje('')
    setMensajes(await getMensajesSolicitud(selected.id))
  }

  function openPerfil(usuario: DistribuidorUsuario) {
    const current = perfiles.find((p) => p.usuario_id === usuario.id)
    setPerfilDraft(current || {
      usuario_id: usuario.id,
      nombre_comercial: usuario.nombre,
      telefono: '',
      email_facturacion: usuario.email,
      tarifa: 'general',
      activo: usuario.activo !== false,
    })
  }

  async function savePerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!perfilDraft) return
    await upsertPerfilDistribuidor(perfilDraft)
    setPerfilDraft(null)
    await loadAll()
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"><p className="text-sm text-slate-400">Solicitudes</p><p className="mt-2 text-3xl font-black text-white">{stats.total}</p></div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"><p className="text-sm text-slate-400">Pendientes</p><p className="mt-2 text-3xl font-black text-red-300">{stats.pendientes}</p></div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"><p className="text-sm text-slate-400">En proceso</p><p className="mt-2 text-3xl font-black text-yellow-300">{stats.proceso}</p></div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"><p className="text-sm text-slate-400">Finalizadas</p><p className="mt-2 text-3xl font-black text-emerald-300">{stats.finalizados}</p></div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"><p className="text-sm text-slate-400">Pendiente cobro</p><p className="mt-2 text-3xl font-black text-white">{money(stats.pendienteCobro)}</p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Solicitudes de distribuidores</h2>
              <p className="text-sm text-slate-400">File service asociado a distribuidores y colaboradores.</p>
            </div>
            <button onClick={startCreate} className="btn btn-red flex items-center gap-2"><Plus size={18} /> Nueva solicitud</button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Search size={18} className="text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar taller, ECU, matrícula, HW, SW..." className="w-full border-0 bg-transparent p-0 text-white outline-none" />
          </div>

          <div className="mt-5 space-y-3">
            {loading && <div className="rounded-2xl border border-white/10 p-4 text-slate-400">Cargando...</div>}
            {!loading && filtered.length === 0 && <div className="rounded-2xl border border-white/10 p-4 text-slate-400">No hay solicitudes.</div>}
            {filtered.map((s) => (
              <div key={s.id} className="rounded-3xl border border-white/10 bg-[#0B1220] p-4 transition hover:border-red-500/30">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <button onClick={() => setSelected(s)} className="text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${statusClass(s.estado)}`}>{s.estado || 'pendiente'}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">{s.prioridad || 'normal'}</span>
                      {!s.pagado && <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-300">Pendiente cobro</span>}
                    </div>
                    <h3 className="mt-3 text-xl font-black text-white">{s.usuarios?.nombre || s.taller || 'Distribuidor sin asignar'}</h3>
                    <p className="mt-1 text-sm text-slate-400">{[s.marca, s.modelo, s.motor, s.matricula].filter(Boolean).join(' · ') || 'Vehículo sin definir'}</p>
                    <p className="mt-1 text-sm text-slate-500">{[s.ecu, s.hw, s.sw].filter(Boolean).join(' · ') || 'ECU/HW/SW pendiente'}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="mr-2 text-right"><p className="text-lg font-black text-white">{money(s.precio)}</p><p className="text-xs text-slate-500">{s.servicio}</p></div>
                    <button onClick={() => startEdit(s)} className="rounded-2xl border border-white/10 p-3 text-slate-300 hover:bg-white/5"><Edit3 size={17} /></button>
                    <button onClick={() => removeSolicitud(s.id)} className="rounded-2xl border border-red-500/20 p-3 text-red-300 hover:bg-red-500/10"><Trash2 size={17} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <Users className="text-red-400" />
              <div>
                <h2 className="text-xl font-black text-white">Distribuidores</h2>
                <p className="text-sm text-slate-400">Usuarios con rol distribuidor.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {distribuidores.length === 0 && <p className="text-sm text-slate-400">Crea usuarios con rol distribuidor en Usuarios.</p>}
              {distribuidores.map((u) => (
                <button key={u.id} onClick={() => openPerfil(u)} className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left hover:border-red-500/30">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="font-black text-white">{u.nombre}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                    {u.activo !== false ? <CheckCircle2 className="text-emerald-400" size={18} /> : <AlertTriangle className="text-red-400" size={18} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-red-400" />
              <div>
                <h2 className="text-xl font-black text-white">Mensajes</h2>
                <p className="text-sm text-slate-400">Comunicación visible en el portal.</p>
              </div>
            </div>
            {!selected ? (
              <p className="mt-5 text-sm text-slate-400">Selecciona una solicitud para ver sus mensajes.</p>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-bold text-white">{selected.servicio}</p>
                  <p className="text-xs text-slate-500">{selected.usuarios?.nombre || selected.taller || 'Sin distribuidor'}</p>
                </div>
                <div className="max-h-72 space-y-3 overflow-auto pr-1">
                  {mensajes.length === 0 && <p className="text-sm text-slate-500">Sin mensajes todavía.</p>}
                  {mensajes.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase text-red-300">{m.autor}</p><p className="text-xs text-slate-600">{m.created_at ? new Date(m.created_at).toLocaleString('es-ES') : ''}</p></div>
                      <p className="mt-2 text-sm text-slate-300">{m.mensaje}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribir mensaje..." className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
                  <button onClick={sendMensaje} className="rounded-2xl bg-red-600 px-4 text-white hover:bg-red-500"><Send size={18} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {openForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={submitSolicitud} className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-2xl font-black text-white">{editing ? 'Editar solicitud' : 'Nueva solicitud'}</h2><p className="text-sm text-slate-400">File service para distribuidor.</p></div>
              <button type="button" onClick={() => setOpenForm(false)} className="rounded-2xl border border-white/10 p-3 text-slate-400 hover:bg-white/5"><X size={18} /></button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Distribuidor</span><select value={form.distribuidor_id || ''} onChange={(e) => setForm({ ...form, distribuidor_id: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"><option value="">Sin asignar</option>{distribuidores.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Taller</span><input value={form.taller || ''} onChange={(e) => setForm({ ...form, taller: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Marca</span><input value={form.marca || ''} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Modelo</span><input value={form.modelo || ''} onChange={(e) => setForm({ ...form, modelo: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Motor</span><input value={form.motor || ''} onChange={(e) => setForm({ ...form, motor: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Matrícula</span><input value={form.matricula || ''} onChange={(e) => setForm({ ...form, matricula: e.target.value.toUpperCase() })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">ECU</span><input value={form.ecu || ''} onChange={(e) => setForm({ ...form, ecu: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">HW</span><input value={form.hw || ''} onChange={(e) => setForm({ ...form, hw: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">SW</span><input value={form.sw || ''} onChange={(e) => setForm({ ...form, sw: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Servicio</span><input value={form.servicio || ''} onChange={(e) => setForm({ ...form, servicio: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Estado</span><select value={form.estado || 'pendiente'} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">{estados.map((e) => <option key={e} value={e}>{e}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Prioridad</span><select value={form.prioridad || 'normal'} onChange={(e) => setForm({ ...form, prioridad: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white">{prioridades.map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Precio</span><input type="number" value={Number(form.precio || 0)} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Entrega prevista</span><input type="date" value={form.fecha_entrega_prevista || ''} onChange={(e) => setForm({ ...form, fecha_entrega_prevista: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><input type="checkbox" checked={Boolean(form.pagado)} onChange={(e) => setForm({ ...form, pagado: e.target.checked })} /><span className="text-sm font-bold text-white">Pagado</span></label>
              <label className="space-y-2 md:col-span-2"><span className="text-xs font-bold uppercase text-slate-500">Notas</span><textarea value={form.notas || ''} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={4} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpenForm(false)} className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-300 hover:bg-white/5">Cancelar</button><button className="btn btn-red flex items-center gap-2"><Save size={18} /> Guardar</button></div>
          </form>
        </div>
      )}

      {perfilDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={savePerfil} className="w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black text-white">Perfil de distribuidor</h2><p className="text-sm text-slate-400">Datos comerciales y facturación.</p></div><button type="button" onClick={() => setPerfilDraft(null)} className="rounded-2xl border border-white/10 p-3 text-slate-400 hover:bg-white/5"><X size={18} /></button></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Nombre comercial</span><input value={perfilDraft.nombre_comercial || ''} onChange={(e) => setPerfilDraft({ ...perfilDraft, nombre_comercial: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">CIF</span><input value={perfilDraft.cif || ''} onChange={(e) => setPerfilDraft({ ...perfilDraft, cif: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Teléfono</span><input value={perfilDraft.telefono || ''} onChange={(e) => setPerfilDraft({ ...perfilDraft, telefono: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Email facturación</span><input value={perfilDraft.email_facturacion || ''} onChange={(e) => setPerfilDraft({ ...perfilDraft, email_facturacion: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Tarifa</span><input value={perfilDraft.tarifa || ''} onChange={(e) => setPerfilDraft({ ...perfilDraft, tarifa: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2"><span className="text-xs font-bold uppercase text-slate-500">Población</span><input value={perfilDraft.poblacion || ''} onChange={(e) => setPerfilDraft({ ...perfilDraft, poblacion: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
              <label className="space-y-2 md:col-span-2"><span className="text-xs font-bold uppercase text-slate-500">Notas</span><textarea value={perfilDraft.notas || ''} onChange={(e) => setPerfilDraft({ ...perfilDraft, notas: e.target.value })} rows={4} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setPerfilDraft(null)} className="rounded-2xl border border-white/10 px-5 py-3 font-bold text-slate-300 hover:bg-white/5">Cancelar</button><button className="btn btn-red flex items-center gap-2"><Save size={18} /> Guardar perfil</button></div>
          </form>
        </div>
      )}
    </div>
  )
}
