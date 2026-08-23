'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ClipboardList, CheckCircle2, Plus, SlidersHorizontal, AlertTriangle, ChevronDown, Users, Clock3, Package, Car, CheckSquare } from 'lucide-react'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import { ExpedienteService } from '@/lib/services/expedientes'
import { ChecklistService } from '@/lib/services/checklist'
import type { ExpedienteConRelaciones, ChecklistItem } from '@/types/autokeys'

type ColumnKey = 'pendiente' | 'en_proceso' | 'material' | 'listo' | 'finalizado'
const COLUMNS: { key: ColumnKey; label: string; dot: string; border: string; estados: string[]; progressBase: number }[] = [
  { key: 'pendiente', label: 'Pendiente', dot: 'bg-[#ef202d]', border: 'border-l-[#ef202d]', estados: ['recibido'], progressBase: 5 },
  { key: 'en_proceso', label: 'En proceso', dot: 'bg-[#f59e0b]', border: 'border-l-[#f59e0b]', estados: ['en_proceso','diagnostico'], progressBase: 50 },
  { key: 'material', label: 'Esperando material', dot: 'bg-[#eab308]', border: 'border-l-[#eab308]', estados: ['pendiente_material','pendiente_cliente'], progressBase: 25 },
  { key: 'listo', label: 'Listo para entrega', dot: 'bg-[#55c765]', border: 'border-l-[#55c765]', estados: ['terminado'], progressBase: 95 },
  { key: 'finalizado', label: 'Finalizado', dot: 'bg-[#2f7bf6]', border: 'border-l-[#2f7bf6]', estados: ['entregado'], progressBase: 100 },
]
function columnFor(estado?: string | null): ColumnKey { return COLUMNS.find((c)=>c.estados.includes(String(estado||'recibido')))?.key || 'pendiente' }
function hashJitter(id: string, spread: number) { let h=0; for(let i=0;i<id.length;i++) h=(h*31+id.charCodeAt(i))%997; return h%spread }
function prioridadBadge(prioridad?: string | null) { const p=String(prioridad||'media').toLowerCase(); if(p==='urgente'||p==='alta') return {label:'Alta',tone:'red' as const}; if(p==='baja') return {label:'Baja',tone:'green' as const}; return {label:'Media',tone:'amber' as const} }

function Metric({ icon: Icon, label, value, tone, note }: { icon:any; label:string; value:number; tone:string; note:string }) {
  return <div className="rounded-xl border border-white/[0.075] bg-[linear-gradient(180deg,rgba(18,21,25,.94),rgba(10,12,15,.94))] p-3"><div className="flex items-center gap-2"><div className={`grid h-8 w-8 place-items-center rounded-full ${tone}`}><Icon size={14}/></div><div><div className="text-[9px] text-zinc-500">{label}</div><div className="mt-0.5 flex items-baseline gap-2"><span className="text-[20px] font-semibold leading-none text-white">{value}</span><span className="text-[8px] text-zinc-600">{note}</span></div></div></div></div>
}

export default function OrdenesTrabajoPage() {
  const [items,setItems]=useState<ExpedienteConRelaciones[]>([])
  const [loading,setLoading]=useState(true)
  const [checklistExp,setChecklistExp]=useState<ExpedienteConRelaciones|null>(null)
  const [checklist,setChecklist]=useState<ChecklistItem[]>([])
  useEffect(()=>{load()},[])
  async function load(){setLoading(true);try{const data=await ExpedienteService.getAll();setItems(data);const focus=data.find((i)=>!['entregado','cancelado'].includes(String(i.estado)));if(focus){setChecklistExp(focus);ChecklistService.getByExpediente(focus.id).then(setChecklist).catch(()=>setChecklist([]))}}catch(err:any){toast.error(err.message||'No se pudieron cargar las órdenes')}finally{setLoading(false)}}
  const activos=items.filter((i)=>i.estado!=='cancelado')
  const byColumn=useMemo(()=>{const map=new Map<ColumnKey,ExpedienteConRelaciones[]>(COLUMNS.map((c)=>[c.key,[]]));for(const item of activos) map.get(columnFor(item.estado))!.push(item);return map},[activos])
  const cargaTecnicos=useMemo(()=>{const map=new Map<string,number>();for(const i of activos){if(!['entregado'].includes(String(i.estado))){const tec=i.tecnico||'Sin asignar';map.set(tec,(map.get(tec)||0)+1)}}return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5)},[activos])
  const vencidas=useMemo(()=>{const now=new Date();return items.filter((i)=>i.fecha_entrega&&new Date(i.fecha_entrega)<now&&!['entregado','cancelado'].includes(String(i.estado))).sort((a,b)=>new Date(a.fecha_entrega||0).getTime()-new Date(b.fecha_entrega||0).getTime()).slice(0,4)},[items])
  async function toggleChecklist(item:ChecklistItem){try{await ChecklistService.toggle(item.id,!item.completado);setChecklist((prev)=>prev.map((c)=>(c.id===item.id?{...c,completado:!c.completado}:c)))}catch(err:any){toast.error(err.message||'No se pudo actualizar el checklist')}}

  return <LabShell title="Órdenes de trabajo" subtitle="Gestiona y da seguimiento a todas las órdenes del taller" actions={<><button className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[10px] text-zinc-300"><SlidersHorizontal size={13}/>Filtros<ChevronDown size={11}/></button><button className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0c0e12] px-3 py-2 text-[10px] text-zinc-300">Vista: Kanban<ChevronDown size={11}/></button><Link href="/expedientes/nueva" className="flex items-center gap-2 rounded-lg bg-[#b92028] px-4 py-2 text-[10px] font-semibold text-white"><Plus size={13}/>Nueva orden de trabajo</Link></>}>
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-6"><Metric icon={ClipboardList} label="Total órdenes" value={activos.length} tone="bg-[#ef202d]/12 text-[#ef202d]" note="+18%"/><Metric icon={Clock3} label="Pendientes" value={byColumn.get('pendiente')?.length||0} tone="bg-[#f59e0b]/12 text-[#f59e0b]" note="+5"/><Metric icon={Users} label="En proceso" value={byColumn.get('en_proceso')?.length||0} tone="bg-[#38bdf8]/12 text-[#38bdf8]" note="+8"/><Metric icon={Package} label="Esperando material" value={byColumn.get('material')?.length||0} tone="bg-[#eab308]/12 text-[#eab308]" note="-3"/><Metric icon={Car} label="Listo para entrega" value={byColumn.get('listo')?.length||0} tone="bg-[#55c765]/12 text-[#55c765]" note="+2"/><Metric icon={CheckSquare} label="Finalizadas" value={byColumn.get('finalizado')?.length||0} tone="bg-[#2f7bf6]/12 text-[#2f7bf6]" note="+20%"/></div>

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1fr)_270px]">
        <div className="overflow-x-auto"><div className="grid min-w-[1050px] grid-cols-5 gap-2.5">{COLUMNS.map((col)=>{const list=byColumn.get(col.key)||[];const visible=list.slice(0,3);const rest=list.length-visible.length;return <div key={col.key} className="rounded-xl border border-white/[0.075] bg-[#0a0c0f]/80 p-2.5"><div className="mb-2 flex items-center gap-2 px-1"><span className={`h-2 w-2 rounded ${col.dot}`}/><span className="text-[10px] font-semibold text-zinc-300">{col.label}</span><span className="ml-auto text-[9px] text-zinc-500">{list.length}</span></div><div className="space-y-2">{visible.map((item)=>{const progress=Math.min(100,col.progressBase+hashJitter(item.id,12));const pr=prioridadBadge(item.prioridad);return <Link key={item.id} href={`/expedientes/${item.id}`} className={`block rounded-lg border border-white/[0.07] border-l-2 ${col.border} bg-[linear-gradient(180deg,rgba(18,21,25,.92),rgba(10,12,15,.94))] p-2.5 text-[8px] hover:bg-white/[0.04]`}><div className="text-[11px] font-semibold text-zinc-200">{item.numero_ot}</div><div className="mt-1.5 space-y-1 text-zinc-500"><div><span className="text-zinc-600">Cliente:</span> {item.cliente?.nombre||'—'}</div><div><span className="text-zinc-600">Vehículo:</span> {[item.vehiculo?.marca,item.vehiculo?.modelo].filter(Boolean).join(' ')||'—'}</div><div><span className="text-zinc-600">Servicio:</span> {item.tipo_trabajo||'—'}</div><div><span className="text-zinc-600">Técnico:</span> {item.tecnico||'—'}</div><div><span className="text-zinc-600">Fecha:</span> {item.created_at?new Date(item.created_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—'}</div></div><div className="mt-2 flex items-center justify-between"><LabBadge tone={pr.tone}>{pr.label}</LabBadge><span className="text-[8px] text-zinc-400">{progress}%</span></div><div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className={`h-full ${col.dot}`} style={{width:`${progress}%`}}/></div></Link>})}{list.length===0&&<div className="py-8 text-center text-[8px] text-zinc-700">Sin órdenes.</div>}{rest>0&&<button className="w-full py-1.5 text-[8px] text-zinc-600">+ {rest} órdenes más</button>}</div></div>})}</div></div>

        <div className="space-y-3">
          <LabPanel title="Carga de trabajo por técnico"><div className="space-y-2.5">{cargaTecnicos.map(([tecnico,count],i)=><div key={tecnico} className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-full bg-zinc-700/50 text-[8px] font-semibold text-zinc-300">{tecnico.split(' ').map((n)=>n[0]).slice(0,2).join('')}</div><div className="min-w-0 flex-1"><div className="flex justify-between text-[8px]"><span className="truncate text-zinc-300">{tecnico}</span><span className="text-zinc-500">{count}/10</span></div><div className="mt-1 h-1 rounded-full bg-white/[0.06]"><div className={`h-full rounded-full ${i<2?'bg-[#eab308]':'bg-[#55c765]'}`} style={{width:`${Math.min(100,count*10)}%`}}/></div></div></div>)}{cargaTecnicos.length===0&&<div className="text-[8px] text-zinc-600">Sin técnicos asignados.</div>}</div></LabPanel>

          <LabPanel title="Tareas vencidas" action={<LabBadge tone="red">{vencidas.length}</LabBadge>}><div className="space-y-2">{vencidas.map((item)=><Link key={item.id} href={`/expedientes/${item.id}`} className="flex items-start gap-2 text-[8px]"><AlertTriangle size={11} className="mt-0.5 text-[#ef202d]"/><div className="min-w-0 flex-1"><div className="truncate text-zinc-300">{item.numero_ot} · {item.cliente?.nombre||'—'}</div><div className="text-zinc-600">Vencida: {item.fecha_entrega?new Date(item.fecha_entrega).toLocaleDateString('es-ES'):'—'}</div></div><LabBadge tone={prioridadBadge(item.prioridad).tone}>{prioridadBadge(item.prioridad).label}</LabBadge></Link>)}{vencidas.length===0&&<div className="py-3 text-center text-[8px] text-zinc-600">Sin tareas vencidas.</div>}</div>{vencidas.length>0&&<Link href="/expedientes" className="mt-3 block rounded border border-white/[0.06] py-1.5 text-center text-[8px] text-zinc-500">Ver todas las vencidas</Link>}</LabPanel>

          <LabPanel title="Checklist rápido" action={<span className="text-[8px] text-zinc-600">Ver todo</span>}><div className="space-y-1.5">{checklist.slice(0,6).map((c)=><button key={c.id} onClick={()=>toggleChecklist(c)} className="flex w-full items-center gap-2 text-left text-[8px]"><span className={`grid h-3.5 w-3.5 place-items-center rounded border ${c.completado?'border-[#55c765] bg-[#55c765]/20 text-[#55c765]':'border-white/20 text-transparent'}`}><CheckCircle2 size={9}/></span><span className={c.completado?'text-zinc-600 line-through':'text-zinc-400'}>{c.titulo}</span></button>)}{checklist.length===0&&<div className="py-3 text-center text-[8px] text-zinc-600">{checklistExp?'Sin checklist.':'Sin órdenes abiertas.'}</div>}</div></LabPanel>
        </div>
      </div>
    </div>
  </LabShell>
}
