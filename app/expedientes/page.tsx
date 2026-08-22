'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Lock, Ticket, Hourglass, Car, Plus, Search, SlidersHorizontal, FileText, Trash2, Pencil, MoreHorizontal, Circle, PlusCircle } from 'lucide-react'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import { ExpedienteService } from '@/lib/services/expedientes'
import { ArchivoService } from '@/lib/services/archivos'
import { supabase } from '@/lib/supabase'
import ConfirmModal from '@/components/ConfirmModal'
import type { ExpedienteConRelaciones, ArchivoExpediente, ExpedienteHistorial } from '@/types/autokeys'
import { money } from '@/lib/status'

type Tab = 'resumen' | 'historial' | 'archivos' | 'notas'

function formatVehicle(item: ExpedienteConRelaciones) {
  const v = item.vehiculo
  if (!v) return 'Sin vehículo'
  return [v.marca, v.modelo].filter(Boolean).join(' ') || v.matricula || 'Vehículo sin datos'
}

function CompactStat({ icon: Icon, label, value, tone = 'red', note }: { icon: any; label: string; value: number; tone?: 'red'|'orange'|'green'|'zinc'; note: string }) {
  const tones = { red: 'text-[#ef202d] bg-[#ef202d]/10', orange: 'text-[#f59e0b] bg-[#f59e0b]/10', green: 'text-[#55c765] bg-[#55c765]/10', zinc: 'text-zinc-400 bg-white/[0.04]' }
  return <div className="flex min-w-[165px] items-center gap-3 border-l border-white/[0.06] px-4 first:border-l-0"><div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}><Icon size={17}/></div><div><div className="text-[9px] text-zinc-500">{label}</div><div className="mt-0.5 flex items-baseline gap-2"><span className="text-[20px] font-semibold leading-none text-white">{value}</span><span className="text-[8px] text-zinc-600">{note}</span></div></div></div>
}

function ExpedientesPageInner() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<ExpedienteConRelaciones[]>([])
  const [query, setQuery] = useState(searchParams.get('tipo') || '')
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('resumen')
  const [historial, setHistorial] = useState<ExpedienteHistorial[]>([])
  const [archivos, setArchivos] = useState<ArchivoExpediente[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ExpedienteConRelaciones | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])
  useEffect(() => { if (selectedId) loadDetail(selectedId) }, [selectedId])

  async function load() {
    setLoading(true)
    try {
      const data = await ExpedienteService.getAll()
      setItems(data)
      if (data.length && !selectedId) setSelectedId(data[0].id)
    } catch (err: any) { toast.error(err.message || 'No se pudieron cargar los expedientes') } finally { setLoading(false) }
  }

  async function loadDetail(id: string) {
    setDetailLoading(true)
    try {
      const [full, files] = await Promise.all([ExpedienteService.getById(id), ArchivoService.list(id).catch(() => [])])
      setHistorial(full?.historial || [])
      setArchivos(files)
    } finally { setDetailLoading(false) }
  }

  const openCount = items.filter((i) => !['terminado','entregado','cancelado'].includes(i.estado || '')).length
  const urgentCount = items.filter((i) => i.prioridad === 'urgente').length
  const enEsperaCount = items.filter((i) => ['pendiente_cliente','pendiente_material'].includes(i.estado || '')).length
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cerrados30 = items.filter((i) => ['terminado','entregado'].includes(i.estado || '') && new Date(i.updated_at || i.created_at || 0) >= thirtyDaysAgo).length

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return items
    return items.filter((e) => `${e.numero_ot || ''} ${e.tipo_trabajo || ''} ${e.estado || ''} ${e.cliente?.nombre || ''} ${e.vehiculo?.marca || ''} ${e.vehiculo?.modelo || ''} ${e.vehiculo?.matricula || ''}`.toLowerCase().includes(q))
  }, [items, query])
  const selected = items.find((i) => i.id === selectedId) || null

  async function confirmDelete() {
    if (!pendingDelete) return
    const item = pendingDelete
    setDeleting(true)
    try {
      await Promise.allSettled([
        supabase.from('expediente_ecu').delete().eq('expediente_id', item.id),
        supabase.from('expediente_llaves').delete().eq('expediente_id', item.id),
        supabase.from('expediente_historial').delete().eq('expediente_id', item.id),
        supabase.from('archivos_expediente').delete().eq('expediente_id', item.id),
        supabase.from('servicios_expediente').delete().eq('expediente_id', item.id),
        supabase.from('movimientos_stock').update({ expediente_id: null }).eq('expediente_id', item.id),
        supabase.from('facturas').update({ expediente_id: null }).eq('expediente_id', item.id),
      ])
      const { error } = await supabase.from('expedientes').delete().eq('id', item.id)
      if (error) throw error
      toast.success('Expediente eliminado'); setPendingDelete(null); if (selectedId === item.id) setSelectedId(null); await load()
    } catch (err: any) { toast.error(err?.message || 'No se pudo eliminar el expediente') } finally { setDeleting(false) }
  }

  return (
    <LabShell>
      <div className="space-y-3">
        <div className="flex flex-wrap items-stretch rounded-xl border border-white/[0.075] bg-[linear-gradient(180deg,rgba(16,19,23,.92),rgba(10,12,15,.94))]">
          <div className="flex min-w-[170px] items-center px-4"><h1 className="text-[20px] font-semibold tracking-[-0.02em] text-white">Expedientes</h1></div>
          <div className="flex flex-1 flex-wrap items-center"><CompactStat icon={Lock} label="Abiertos" value={openCount} tone="zinc" note="+12%"/><CompactStat icon={Ticket} label="Urgentes" value={urgentCount} tone="red" note="+2"/><CompactStat icon={Hourglass} label="En espera" value={enEsperaCount} tone="orange" note="-3"/><CompactStat icon={Car} label="Cerrados (30 días)" value={cerrados30} tone="green" note="+18%"/></div>
          <div className="flex min-w-[170px] flex-col justify-center gap-2 border-l border-white/[0.06] p-3"><Link href="/expedientes/nueva" className="flex items-center justify-center gap-1.5 rounded-md bg-[#b92028] px-3 py-2 text-[10px] font-semibold text-white"><Plus size={13}/>Nuevo expediente</Link><button className="flex items-center justify-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[9px] text-zinc-400"><SlidersHorizontal size={12}/>Filtros</button></div>
        </div>

        <div className="grid gap-3 2xl:grid-cols-[280px_minmax(0,1fr)]">
          <LabPanel padded={false}>
            <div className="flex h-[44px] items-center justify-between border-b border-white/[0.06] px-3"><span className="text-[10px] font-semibold text-zinc-300">Lista de expedientes</span><SlidersHorizontal size={12} className="text-zinc-600"/></div>
            <div className="p-2.5"><div className="flex items-center gap-2 rounded-md border border-white/[0.07] bg-[#0b0d10] px-2.5 py-2"><Search size={12} className="text-zinc-600"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar expedientes..." className="w-full border-0 bg-transparent p-0 text-[9px] outline-none"/></div></div>
            <div className="max-h-[625px] space-y-1.5 overflow-y-auto px-2.5 pb-2.5">{filtered.map((item)=><button key={item.id} onClick={()=>{setSelectedId(item.id);setTab('resumen')}} className={`block w-full rounded-lg border px-3 py-2.5 text-left ${selectedId===item.id?'border-[#ef202d] bg-[#6e1419]/55':'border-white/[0.06] bg-white/[0.012] hover:bg-white/[0.025]'}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-zinc-200">{item.numero_ot || 'EXP sin número'}</span><LabBadge tone={item.prioridad==='urgente'?'red':undefined} status={item.prioridad==='urgente'?'urgente':item.estado}>{item.prioridad==='urgente'?'Urgente':(item.estado||'Abierto')}</LabBadge></div><div className="mt-1 flex justify-between text-[9px] text-zinc-400"><span>{item.cliente?.nombre||'Sin cliente'}</span><span>{formatVehicle(item)}</span></div><div className="mt-1 flex justify-between text-[8px] text-zinc-600"><span className="truncate">{item.tipo_trabajo||'—'}</span><span>{item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES') : ''}</span></div></button>)}{!loading&&filtered.length===0&&<div className="py-10 text-center text-[9px] text-zinc-600">Sin expedientes.</div>}</div>
          </LabPanel>

          <LabPanel padded={false}>
            {!selected ? <div className="py-20 text-center text-[10px] text-zinc-600">Selecciona un expediente.</div> : <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3"><div className="flex items-center gap-2"><span className="text-[11px] text-zinc-500">Expediente</span><h2 className="text-[15px] font-semibold text-white">{selected.numero_ot}</h2>{selected.prioridad==='urgente'&&<LabBadge tone="red">Urgente</LabBadge>}</div><div className="flex gap-2"><Link href={`/expedientes/${selected.id}`} className="flex items-center gap-1 rounded-md border border-white/[0.08] px-3 py-1.5 text-[9px] text-zinc-300"><Pencil size={11}/>Editar</Link><button className="flex items-center gap-1 rounded-md border border-white/[0.08] px-3 py-1.5 text-[9px] text-zinc-300"><MoreHorizontal size={11}/>Más acciones⌄</button><button onClick={()=>setPendingDelete(selected)} className="rounded-md border border-white/[0.08] p-1.5 text-zinc-600 hover:text-red-400"><Trash2 size={12}/></button></div></div>
              <div className="flex gap-4 border-b border-white/[0.06] px-4 pt-2">{(['resumen','historial','archivos','notas'] as Tab[]).map((t)=><button key={t} onClick={()=>setTab(t)} className={`border-b-2 px-1 pb-2 text-[9px] capitalize ${tab===t?'border-[#ef202d] text-white':'border-transparent text-zinc-500'}`}>{t}</button>)}</div>

              {tab==='resumen' && <div className="p-3">
                <div className="grid gap-3 xl:grid-cols-[1fr_1fr_.86fr]">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-3 text-[9px] font-semibold text-zinc-300">Información general</div><dl className="space-y-2 text-[8px]">{[['Cliente',selected.cliente?.nombre||'—'],['Teléfono',selected.cliente?.telefono||'—'],['Email',selected.cliente?.email||'—'],['Vehículo',formatVehicle(selected)],['Matrícula',selected.vehiculo?.matricula||'—'],['VIN',selected.vehiculo?.bastidor||'—'],['Fecha apertura',selected.created_at?new Date(selected.created_at).toLocaleString('es-ES'):'—'],['Última actualización',selected.updated_at?new Date(selected.updated_at).toLocaleString('es-ES'):'—']].map(([k,v])=><div key={k} className="grid grid-cols-[92px_1fr] border-b border-white/[0.045] pb-1.5 last:border-0"><dt className="text-zinc-600">{k}</dt><dd className="truncate text-zinc-300">{v}</dd></div>)}</dl></div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-3 text-[9px] font-semibold text-zinc-300">Detalles del servicio</div><dl className="space-y-2 text-[8px]"><div className="grid grid-cols-[92px_1fr] border-b border-white/[0.045] pb-1.5"><dt className="text-zinc-600">Tipo de avería</dt><dd className="text-zinc-300">{selected.tipo_trabajo||'—'}</dd></div><div className="border-b border-white/[0.045] pb-2"><dt className="mb-1 text-zinc-600">Descripción</dt><dd className="leading-4 text-zinc-400">{selected.descripcion||'—'}</dd></div><div className="grid grid-cols-[92px_1fr] border-b border-white/[0.045] pb-1.5"><dt className="text-zinc-600">Prioridad</dt><dd><LabBadge tone={selected.prioridad==='urgente'?'red':'zinc'}>{selected.prioridad||'normal'}</LabBadge></dd></div><div className="grid grid-cols-[92px_1fr] border-b border-white/[0.045] pb-1.5"><dt className="text-zinc-600">Técnico asignado</dt><dd className="text-zinc-300">{selected.tecnico||'Sin asignar'}</dd></div><div className="grid grid-cols-[92px_1fr] border-b border-white/[0.045] pb-1.5"><dt className="text-zinc-600">Estado</dt><dd><LabBadge status={selected.estado}>{selected.estado||'abierto'}</LabBadge></dd></div><div className="grid grid-cols-[92px_1fr]"><dt className="text-zinc-600">Importe</dt><dd className="font-semibold text-zinc-200">{money(selected.precio_final||selected.precio_estimado)}</dd></div></dl></div>
                  <div className="space-y-3"><div className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-2 flex justify-between text-[9px]"><span className="font-semibold text-zinc-300">Fotos subidas</span><span className="text-zinc-600">Ver todas ({archivos.length})</span></div><div className="grid grid-cols-3 gap-1.5">{archivos.slice(0,6).map((f)=><div key={f.id} className="grid h-14 place-items-center rounded border border-white/[0.05] bg-white/[0.025]"><FileText size={17} className="text-zinc-600"/></div>)}{archivos.length===0&&Array.from({length:6}).map((_,i)=><div key={i} className="grid h-14 place-items-center rounded border border-dashed border-white/[0.05] bg-white/[0.012]"><FileText size={14} className="text-zinc-700"/></div>)}</div></div><div className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-2 flex justify-between text-[9px]"><span className="font-semibold text-zinc-300">Archivos adjuntos</span><button onClick={()=>setTab('archivos')} className="text-zinc-600">Ver todos ({archivos.length})</button></div><div className="space-y-2">{archivos.slice(0,3).map((f)=><div key={f.id} className="flex items-center gap-2 text-[8px]"><FileText size={11} className="text-zinc-600"/><span className="min-w-0 flex-1 truncate text-zinc-400">{f.nombre}</span><span className="text-zinc-700">{f.tipo||''}</span></div>)}{archivos.length===0&&<div className="text-[8px] text-zinc-600">Sin adjuntos.</div>}</div></div></div>
                </div>

                <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_.88fr_1fr]">
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-3 text-[9px] font-semibold text-zinc-300">Línea de tiempo</div><div className="space-y-3">{historial.slice(0,4).map((h)=><div key={h.id} className="flex gap-2 text-[8px]"><Circle size={7} className="mt-1 fill-zinc-500 text-zinc-500"/><div><div className="text-zinc-400">{h.created_at?new Date(h.created_at).toLocaleString('es-ES'):''} <span className="ml-2 text-zinc-300">{h.usuario||'Sistema'}</span></div><div className="mt-0.5 leading-4 text-zinc-500">{h.descripcion||h.evento}</div></div></div>)}{historial.length===0&&<div className="text-[8px] text-zinc-600">Sin eventos.</div>}</div><button onClick={()=>setTab('historial')} className="mt-3 w-full rounded border border-white/[0.06] py-1.5 text-[8px] text-zinc-500">Ver historial completo</button></div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-3 text-[9px] font-semibold text-zinc-300">Notas internas</div><div className="text-[8px] leading-4 text-zinc-500">{selected.notas||'Sin notas internas registradas.'}</div><button onClick={()=>setTab('notas')} className="mt-4 flex w-full items-center justify-center gap-1 rounded border border-white/[0.06] py-1.5 text-[8px] text-zinc-500"><PlusCircle size={10}/>Añadir nota</button></div>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3"><div className="mb-3 text-[9px] font-semibold text-zinc-300">Documentos relacionados</div><div className="flex gap-4 border-b border-white/[0.05] text-[8px]"><span className="border-b-2 border-[#ef202d] pb-2 text-zinc-300">Órdenes de trabajo</span><span className="pb-2 text-zinc-600">Facturas</span></div><div className="space-y-2 pt-3"><div className="rounded border border-white/[0.05] p-2 text-[8px]"><div className="flex justify-between"><span className="text-zinc-300">{selected.numero_ot}</span><LabBadge status={selected.estado}>{selected.estado||'abierto'}</LabBadge></div><div className="mt-1 text-zinc-600">{selected.tipo_trabajo||'Trabajo'}</div></div></div></div>
                </div>
              </div>}

              {tab==='historial' && <div className="space-y-3 p-4">{historial.map((h)=><div key={h.id} className="flex gap-3 border-l border-[#ef202d]/35 pl-3"><div className="flex-1"><div className="flex justify-between"><span className="text-[10px] font-semibold text-zinc-300">{h.evento}</span><span className="text-[8px] text-zinc-600">{h.created_at?new Date(h.created_at).toLocaleString('es-ES'):''}</span></div><div className="mt-1 text-[9px] text-zinc-500">{h.descripcion}</div></div></div>)}{!detailLoading&&historial.length===0&&<div className="py-10 text-center text-[9px] text-zinc-600">Sin eventos.</div>}</div>}
              {tab==='archivos' && <div className="grid gap-2 p-4 md:grid-cols-2 xl:grid-cols-3">{archivos.map((f)=><div key={f.id} className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-3"><div className="flex items-center gap-2"><FileText size={14} className="text-[#ef202d]"/><div className="min-w-0"><div className="truncate text-[9px] text-zinc-300">{f.nombre}</div><div className="text-[8px] text-zinc-600">{f.tipo||'Archivo'}</div></div></div></div>)}{!detailLoading&&archivos.length===0&&<div className="col-span-full py-10 text-center text-[9px] text-zinc-600">Sin archivos.</div>}</div>}
              {tab==='notas' && <div className="p-4"><div className="rounded-lg border border-white/[0.06] bg-white/[0.012] p-4 text-[9px] leading-5 text-zinc-500">{selected.notas||'No hay notas registradas en este expediente.'}</div></div>}
            </div>}
          </LabPanel>
        </div>
      </div>

      <ConfirmModal open={Boolean(pendingDelete)} title={`Eliminar ${pendingDelete?.numero_ot || 'este expediente'}`} description="Se eliminará el expediente y sus relaciones técnicas." confirmLabel="Sí, eliminar" danger loading={deleting} onConfirm={confirmDelete} onCancel={()=>setPendingDelete(null)}/>
    </LabShell>
  )
}

export default function ExpedientesPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#07080a]"/>}><ExpedientesPageInner/></Suspense>
}
