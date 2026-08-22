'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Cpu, FileText, Pencil, ReceiptText, UserRound } from 'lucide-react'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import VehiculoModal from '@/components/VehiculoModal'
import { VehiculoService } from '@/lib/services/vehiculos'
import type { Expediente, Factura, VehiculoConCliente } from '@/types/autokeys'

export default function VehiculoFichaPage(){
  const params=useParams(); const router=useRouter(); const id=String(params.id)
  const [vehiculo,setVehiculo]=useState<VehiculoConCliente|null>(null); const [expedientes,setExpedientes]=useState<Expediente[]>([]); const [facturas,setFacturas]=useState<Factura[]>([]); const [loading,setLoading]=useState(true); const [modalOpen,setModalOpen]=useState(false); const [error,setError]=useState('')
  async function load(){setLoading(true);setError('');try{const v=await VehiculoService.getById(id);if(!v){router.push('/vehiculos');return}setVehiculo(v);const related=await VehiculoService.getRelated(id);const exps=related.expedientes as Expediente[];setExpedientes(exps);const ids=new Set(exps.map(e=>e.id));setFacturas((related.facturas as Factura[]).filter(f=>!f.expediente_id||ids.has(f.expediente_id)))}catch(e:any){setError(e?.message||'No se pudo cargar la ficha')}finally{setLoading(false)}}
  useEffect(()=>{load()},[id])
  if(loading)return <LabShell title="Vehículo"><div className="py-20 text-center text-sm text-zinc-600">Cargando ficha...</div></LabShell>
  if(!vehiculo)return null

  return <LabShell title="Detalle del vehículo" actions={<button onClick={()=>setModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-[#ef202d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#ff3945]"><Pencil size={14}/>Editar vehículo</button>}>
    <div className="space-y-4">
      <Link href="/vehiculos" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white"><ArrowLeft size={14}/>Volver a vehículos</Link>
      {error&&<div className="rounded-xl border border-[#ef202d]/25 bg-[#ef202d]/[0.06] p-3 text-xs text-red-300">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <LabPanel>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ef202d]">Ficha vehículo</div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{vehiculo.marca||'Vehículo'} {vehiculo.modelo||''}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                {vehiculo.matricula&&<LabBadge tone="red">{vehiculo.matricula}</LabBadge>}
                {vehiculo.anio&&<LabBadge tone="zinc">Año {vehiculo.anio}</LabBadge>}
                {vehiculo.motor&&<LabBadge tone="blue">{vehiculo.motor}</LabBadge>}
              </div>
              <div className="mt-4 text-xs text-zinc-600">VIN · {vehiculo.bastidor||'Sin registrar'}</div>
              {vehiculo.cliente&&<Link href={`/clientes/${vehiculo.cliente.id}`} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04]"><UserRound size={13}/>{vehiculo.cliente.nombre}</Link>}
            </div>
          </div>
        </LabPanel>

        <LabPanel title="Resumen técnico">
          <div className="grid grid-cols-3 gap-2 text-center"><Metric icon={<Cpu size={15}/>} label="ECU" value={vehiculo.ecu||'—'}/><Metric icon={<FileText size={15}/>} label="Órdenes" value={String(expedientes.length)}/><Metric icon={<ReceiptText size={15}/>} label="Facturas" value={String(facturas.length)}/></div>
        </LabPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <LabPanel title="Datos técnicos">
          <div className="grid gap-2 sm:grid-cols-3"><Info label="ECU" value={vehiculo.ecu}/><Info label="Hardware" value={vehiculo.hardware}/><Info label="Software" value={vehiculo.software}/></div>
          {vehiculo.notas&&<div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.018] p-3 text-xs leading-5 text-zinc-500">{vehiculo.notas}</div>}
        </LabPanel>
        <LabPanel title="Historial de servicios" padded={false}>
          <div>{expedientes.slice(0,10).map(e=><Link key={e.id} href={`/expedientes/${e.id}`} className="grid grid-cols-[1fr_auto] items-center border-b border-white/[0.055] px-4 py-3 last:border-0 hover:bg-white/[0.02]"><div><div className="text-xs font-semibold text-zinc-200">{e.numero_ot||'OT'} · {e.tipo_trabajo}</div><div className="mt-0.5 text-[10px] text-zinc-600">{e.tecnico||'Sin técnico'} {e.fecha_entrada?`· ${new Date(e.fecha_entrada).toLocaleDateString('es-ES')}`:''}</div></div><LabBadge status={e.estado}>{e.estado||'abierto'}</LabBadge></Link>)}{expedientes.length===0&&<div className="px-4 py-10 text-center text-xs text-zinc-600">Sin expedientes.</div>}</div>
        </LabPanel>
      </div>
    </div>
    <VehiculoModal open={modalOpen} vehiculo={vehiculo} onClose={()=>setModalOpen(false)} onSave={async payload=>{await VehiculoService.update(id,payload);await load()}}/>
  </LabShell>
}

function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-lg border border-white/[0.06] bg-white/[0.018] p-3"><div className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-md bg-[#ef202d]/10 text-[#ff5862]">{icon}</div><div className="truncate text-sm font-bold text-white">{value}</div><div className="mt-0.5 text-[9px] text-zinc-600">{label}</div></div>}
function Info({label,value}:{label:string;value?:string|null}){return <div className="rounded-lg border border-white/[0.06] bg-white/[0.018] p-3"><div className="text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-600">{label}</div><div className="mt-1 text-xs font-semibold text-zinc-200">{value||'Sin datos'}</div></div>}
