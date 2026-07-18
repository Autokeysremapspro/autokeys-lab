'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import AppShell from '@/components/AppShell'
import CustomSelect from '@/components/ak/CustomSelect'
import {
  AkCloudMensaje,
  AkCloudPedido,
  AkCloudVersion,
  akCloudEstadoClass,
  convertirAkCloudPedidoEnExpediente,
  crearMensajeAkCloud,
  formatPedidoTitle,
  formatServicios,
  getAkCloudPedido,
  getMensajesAkCloud,
  getSignedFileUrl,
  getVersionesAkCloud,
  subirVersionAkCloud,
  marcarVersionFinalAkCloud,
  finalizarPedidoAkCloud,
  reabrirPedidoAkCloud,
  updateAkCloudPedido,
} from '@/lib/services/akCloud'
import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  Download,
  ExternalLink,
  FileCode2,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  UploadCloud,
  Euro,
  GitBranch,
  LockKeyhole,
  RotateCcw,
} from 'lucide-react'

const timeline = [
  { key: 'pendiente', label: 'Pedido recibido' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'esperando_prueba', label: 'Esperando prueba' },
  { key: 'finalizado', label: 'Finalizado manualmente' },
]

export default function AkCloudPedidoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [pedido, setPedido] = useState<AkCloudPedido | null>(null)
  const [mensajes, setMensajes] = useState<AkCloudMensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [notas, setNotas] = useState('')
  const [tecnico, setTecnico] = useState('Carlos')
  const [estado, setEstado] = useState('pendiente')
  const [mensaje, setMensaje] = useState('')
  const [modFile, setModFile] = useState<File | null>(null)
  const [versiones, setVersiones] = useState<AkCloudVersion[]>([])
  const [notaCliente, setNotaCliente] = useState('')
  const [notaInternaVersion, setNotaInternaVersion] = useState('')
  const [precioFinal, setPrecioFinal] = useState('')
  const [precioMotivo, setPrecioMotivo] = useState('')

  async function load() {
    if (!id) return
    setLoading(true)
    try {
      const row = await getAkCloudPedido(id)
      setPedido(row)
      setNotas(row?.notas_core || '')
      setTecnico(row?.tecnico_asignado || 'Carlos')
      setEstado(row?.estado || 'pendiente')
      setPrecioFinal(String(row?.precio_final ?? row?.precio ?? ''))
      setPrecioMotivo(row?.precio_motivo || '')
      if (row?.id) {
        setMensajes(await getMensajesAkCloud(row.id))
        setVersiones(await getVersionesAkCloud(row.id))
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const currentIndex = useMemo(() => {
    return Math.max(0, timeline.findIndex((item) => item.key === (pedido?.estado || 'pendiente')))
  }, [pedido?.estado])

  async function saveAdmin() {
    if (!pedido) return
    setWorking('save')
    try {
      const updated = await updateAkCloudPedido(pedido.id, {
        estado,
        tecnico_asignado: tecnico,
        notas_core: notas,
        precio_final: precioFinal === '' ? null : Number(precioFinal),
        precio_motivo: precioMotivo || null,
      })
      setPedido(updated)
      toast.success('Pedido actualizado')
      if (estado === 'en_proceso') {
        await crearMensajeAkCloud({
          pedidoId: pedido.id,
          userId: pedido.user_id || null,
          autorNombre: 'Autokeys Core',
          autorTipo: 'admin',
          mensaje: 'Tu pedido ya está en proceso en el laboratorio.',
        })
      }
      setMensajes(await getMensajesAkCloud(pedido.id))
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar')
    } finally {
      setWorking(null)
    }
  }

  async function convertir() {
    if (!pedido) return
    setWorking('convertir')
    try {
      const result = await convertirAkCloudPedidoEnExpediente(pedido.id)
      toast.success('Pedido convertido en expediente')
      router.push(`/expedientes/${result.expedienteId}`)
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo convertir en expediente')
    } finally {
      setWorking(null)
    }
  }

  async function downloadFile(kind: 'ori' | 'mod') {
    if (!pedido) return
    const bucket = kind === 'ori' ? pedido.ori_bucket : pedido.mod_bucket
    const path = kind === 'ori' ? pedido.ori_path : pedido.mod_path
    if (!bucket || !path) {
      toast.error(kind === 'ori' ? 'No hay ORI disponible' : 'No hay MOD disponible')
      return
    }
    try {
      const url = await getSignedFileUrl(bucket, path)
      if (url) window.open(url, '_blank')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo abrir el archivo')
    }
  }

  async function uploadMod() {
    if (!pedido || !modFile) { toast.error('Selecciona un archivo'); return }
    setWorking('upload-mod')
    try {
      await subirVersionAkCloud(pedido, modFile, { notaCliente, notaInterna: notaInternaVersion })
      setPedido(await getAkCloudPedido(pedido.id))
      setVersiones(await getVersionesAkCloud(pedido.id))
      setMensajes(await getMensajesAkCloud(pedido.id))
      setModFile(null); setNotaCliente(''); setNotaInternaVersion('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success('Nueva versión subida. El pedido sigue abierto.')
    } catch (error: any) { toast.error(error?.message || 'No se pudo subir la versión') }
    finally { setWorking(null) }
  }

  async function setFinalVersion(versionId: string) {
    if (!pedido) return
    setWorking(`final-${versionId}`)
    try { await marcarVersionFinalAkCloud(pedido.id, versionId); await load(); toast.success('Versión final seleccionada') }
    catch (e:any) { toast.error(e?.message || 'No se pudo marcar') } finally { setWorking(null) }
  }

  async function finishOrder() {
    if (!pedido) return
    const final = versiones.find(v => v.es_final) || versiones[0]
    if (!final) { toast.error('Sube al menos una versión antes de finalizar'); return }
    if (!confirm(`¿Finalizar el pedido con V${final.numero_version}?`)) return
    setWorking('finish')
    try { await finalizarPedidoAkCloud(pedido, final.id); await load(); toast.success('Pedido finalizado manualmente') }
    catch (e:any) { toast.error(e?.message || 'No se pudo finalizar') } finally { setWorking(null) }
  }

  async function reopenOrder() {
    if (!pedido) return
    setWorking('reopen')
    try { await reabrirPedidoAkCloud(pedido); await load(); toast.success('Pedido reabierto') }
    catch (e:any) { toast.error(e?.message || 'No se pudo reabrir') } finally { setWorking(null) }
  }

  async function downloadVersion(version: AkCloudVersion) {
    try { const url = await getSignedFileUrl(version.bucket, version.path); if (url) window.open(url, '_blank') }
    catch (e:any) { toast.error(e?.message || 'No se pudo descargar') }
  }

  async function sendMessage() {
    if (!pedido) return
    const text = mensaje.trim()
    if (!text) return

    setWorking('message')
    try {
      await crearMensajeAkCloud({
        pedidoId: pedido.id,
        userId: pedido.user_id || null,
        autorNombre: 'Autokeys Core',
        autorTipo: 'admin',
        mensaje: text,
      })
      setMensaje('')
      setMensajes(await getMensajesAkCloud(pedido.id))
      toast.success('Mensaje enviado')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo enviar el mensaje')
    } finally {
      setWorking(null)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="card p-8 text-zinc-500">Cargando pedido AK Cloud...</div>
      </AppShell>
    )
  }

  if (!pedido) {
    return (
      <AppShell>
        <div className="card p-8 text-zinc-500">Pedido no encontrado.</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link href="/ak-cloud" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
              <ArrowLeft size={16} /> Volver a AK Cloud
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-red-300">{pedido.numero || 'FS-SIN-NUM'}</span>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${akCloudEstadoClass(pedido.estado)}`}>{(pedido.estado || 'pendiente').replace('_', ' ')}</span>
              {pedido.core_expediente_id && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase text-emerald-300">Con expediente</span>}
            </div>
            <h1 className="mt-2 text-4xl font-black lg:text-5xl">{formatPedidoTitle(pedido)}</h1>
            <p className="mt-2 text-zinc-500">{pedido.cliente_nombre || pedido.cliente_email || 'Distribuidor sin identificar'}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={load} className="btn btn-dark inline-flex items-center gap-2"><RefreshCw size={17} /> Actualizar</button>
            {pedido.core_expediente_id ? (
              <Link href={`/expedientes/${pedido.core_expediente_id}`} className="btn btn-red inline-flex items-center gap-2">
                Abrir expediente <ExternalLink size={17} />
              </Link>
            ) : (
              <button onClick={convertir} disabled={working === 'convertir'} className="btn btn-red inline-flex items-center gap-2 disabled:opacity-50">
                {working === 'convertir' ? <Loader2 className="animate-spin" size={17} /> : <Link2 size={17} />} Convertir en expediente
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_440px]">
          <main className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0B1220] to-[#111827] p-6">
              <div className="mb-5 flex items-center gap-3">
                <Cloud className="text-red-300" />
                <div>
                  <h2 className="text-2xl font-black">Timeline AK Cloud</h2>
                  <p className="text-sm text-zinc-500">Estado visible para el distribuidor.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {timeline.map((item, index) => {
                  const done = index <= currentIndex || pedido.estado === 'finalizado'
                  return (
                    <div key={item.key} className={`rounded-3xl border p-4 ${done ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-white/10 bg-black/20'}`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className={done ? 'text-emerald-300' : 'text-zinc-600'} />
                        <span className="font-black">{item.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-6">
              <div className="mb-5 flex items-center gap-3">
                <FileCode2 className="text-red-300" />
                <div>
                  <h2 className="text-2xl font-black">Ficha técnica</h2>
                  <p className="text-sm text-zinc-500">Datos recibidos desde el portal AK Cloud.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Info label="Marca" value={pedido.marca || '—'} />
                <Info label="Modelo" value={pedido.modelo || '—'} />
                <Info label="Motor" value={pedido.motor || '—'} />
                <Info label="CV" value={pedido.cv || '—'} />
                <Info label="ECU" value={pedido.ecu || '—'} />
                <Info label="HW" value={pedido.hw || '—'} />
                <Info label="SW" value={pedido.sw || '—'} />
                <Info label="Cambio" value={pedido.cambio || '—'} />
              </div>
              <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Servicios</div>
                <div className="mt-2 text-xl font-black text-red-200">{formatServicios(pedido.servicios)}</div>
              </div>
              {pedido.observaciones && (
                <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Observaciones del distribuidor</div>
                  <p className="mt-2 whitespace-pre-wrap text-zinc-300">{pedido.observaciones}</p>
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-6">
              <div className="mb-5 flex items-center gap-3">
                <MessageCircle className="text-red-300" />
                <div>
                  <h2 className="text-2xl font-black">Chat con distribuidor</h2>
                  <p className="text-sm text-zinc-500">Mensajes visibles en AK Cloud.</p>
                </div>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-auto rounded-3xl border border-white/10 bg-black/20 p-4">
                {mensajes.length === 0 ? (
                  <div className="py-8 text-center text-sm text-zinc-500">Aún no hay mensajes en este pedido.</div>
                ) : (
                  mensajes.map((item) => {
                    const admin = item.autor_tipo === 'admin'
                    return (
                      <div key={item.id} className={`flex ${admin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] rounded-3xl border px-4 py-3 ${admin ? 'border-red-500/25 bg-red-500/10' : 'border-white/10 bg-white/[0.04]'}`}>
                          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{item.autor_nombre || (admin ? 'Autokeys' : 'Distribuidor')}</div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{item.mensaje}</p>
                          <div className="mt-2 text-[10px] text-zinc-600">{item.created_at ? new Date(item.created_at).toLocaleString('es-ES') : ''}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <input
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe un mensaje para el distribuidor..."
                  className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-red-500/50"
                />
                <button onClick={sendMessage} disabled={working === 'message'} className="btn btn-red inline-flex items-center gap-2 disabled:opacity-50">
                  {working === 'message' ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />} Enviar
                </button>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-6">
              <h2 className="text-2xl font-black">Control interno</h2>
              <p className="mt-1 text-sm text-zinc-500">Datos solo visibles en Autokeys Core.</p>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-400">Estado</span>
                  <CustomSelect
                    value={estado}
                    onChange={setEstado}
                    options={[
                      { value: 'pendiente', label: 'Pendiente' },
                      { value: 'en_proceso', label: 'En proceso' },
                      { value: 'esperando_prueba', label: 'Esperando prueba' },
                      { value: 'revision_solicitada', label: 'Revisión solicitada' },
                      { value: 'finalizado', label: 'Finalizado' },
                      { value: 'cancelado', label: 'Cancelado' },
                    ]}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-400">Técnico asignado</span>
                  <input value={tecnico} onChange={(e) => setTecnico(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
                </label>

                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="mb-3 flex items-center gap-2 font-black text-amber-200"><Euro size={18}/> Precio final editable</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Precio calculado" value={`${Number(pedido.precio_inicial ?? pedido.precio ?? 0).toFixed(2)} €`} />
                    <label><span className="mb-2 block text-xs font-bold text-zinc-400">Precio final (€)</span><input type="number" step="0.01" value={precioFinal} onChange={(e)=>setPrecioFinal(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" /></label>
                  </div>
                  <label className="mt-3 block"><span className="mb-2 block text-xs font-bold text-zinc-400">Motivo del cambio</span><input value={precioMotivo} onChange={(e)=>setPrecioMotivo(e.target.value)} placeholder="Urgencia, desbloqueo, trabajo especial..." className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" /></label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-zinc-400">Notas internas</span>
                  <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="h-32 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none" />
                </label>

                <button onClick={saveAdmin} disabled={working === 'save'} className="btn btn-red inline-flex w-full items-center justify-center gap-2 disabled:opacity-50">
                  {working === 'save' ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />} Guardar cambios
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-6">
              <div className="flex items-center gap-3"><GitBranch className="text-red-300"/><div><h2 className="text-2xl font-black">Versiones del archivo</h2><p className="text-sm text-zinc-500">Sube V1, V2, V3… sin cerrar automáticamente el pedido.</p></div></div>
              <button onClick={() => downloadFile('ori')} className="btn btn-dark mt-5 inline-flex w-full items-center justify-center gap-2"><Download size={17}/> Descargar ORI</button>
              <div className="mt-4 space-y-3">
                {versiones.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">Aún no hay versiones.</div> : versiones.map(v => (
                  <div key={v.id} className={`rounded-2xl border p-4 ${v.es_final ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-black/20'}`}>
                    <div className="flex items-center justify-between gap-3"><div><div className="font-black">V{v.numero_version} · {v.nombre_archivo}</div><div className="text-xs text-zinc-500">{v.created_at ? new Date(v.created_at).toLocaleString('es-ES') : ''}</div></div>{v.es_final && <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">FINAL</span>}</div>
                    {v.nota_cliente && <p className="mt-2 text-sm text-zinc-300">{v.nota_cliente}</p>}
                    <div className="mt-3 flex gap-2"><button onClick={()=>downloadVersion(v)} className="btn btn-dark flex-1">Descargar</button><button onClick={()=>setFinalVersion(v.id)} disabled={!!v.es_final} className="btn btn-dark flex-1 disabled:opacity-40">Marcar final</button></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-3xl border border-dashed border-red-500/30 bg-red-500/5 p-4">
                <div className="font-black text-red-200">+ Subir nueva versión</div>
                <input ref={fileInputRef} type="file" onChange={(e)=>setModFile(e.target.files?.[0] || null)} className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm"/>
                <input value={notaCliente} onChange={(e)=>setNotaCliente(e.target.value)} placeholder="Nota visible para el cliente" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"/>
                <input value={notaInternaVersion} onChange={(e)=>setNotaInternaVersion(e.target.value)} placeholder="Nota interna (solo laboratorio)" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"/>
                <button onClick={uploadMod} disabled={working === 'upload-mod'} className="btn btn-red mt-3 inline-flex w-full items-center justify-center gap-2 disabled:opacity-50"><UploadCloud size={17}/> Subir versión (mantener abierto)</button>
              </div>
              <div className="mt-5 border-t border-white/10 pt-5">
                {pedido.estado === 'finalizado' ? <button onClick={reopenOrder} className="btn btn-dark inline-flex w-full items-center justify-center gap-2"><RotateCcw size={17}/> Reabrir pedido</button> : <button onClick={finishOrder} disabled={working === 'finish'} className="btn btn-red inline-flex w-full items-center justify-center gap-2"><LockKeyhole size={17}/> Marcar pedido como finalizado</button>}
                <p className="mt-2 text-center text-xs text-zinc-500">Ninguna subida finaliza el pedido automáticamente.</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/10 p-6">
              <ShieldCheck className="text-emerald-300" />
              <h3 className="mt-3 text-xl font-black">Sincronización Core</h3>
              <p className="mt-2 text-sm text-zinc-400">Desde esta ficha puedes convertir el pedido en expediente, responder al distribuidor y entregar el archivo final.</p>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-1 truncate text-lg font-black">{value}</div>
    </div>
  )
}
