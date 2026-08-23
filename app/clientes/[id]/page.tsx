'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Car, FileText, Globe2, Mail, Pencil, Phone, ReceiptText, Wrench } from 'lucide-react'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import ClienteModal from '@/components/ClienteModal'
import { ClienteService } from '@/lib/services/clientes'
import type { Cliente, Expediente, Factura, Vehiculo } from '@/types/autokeys'

export default function ClienteFichaPage(){
  const params=useParams(); const router=useRouter(); const id=String(params.id)
  const [cliente,setCliente]=useState<Cliente|null>(null); const [vehiculos,setVehiculos]=useState<Vehiculo[]>([]); const [expedientes,setExpedientes]=useState<Expediente[]>([]); const [facturas,setFacturas]=useState<Factura[]>([]); const [loading,setLoading]=useState(true); const [modalOpen,setModalOpen]=useState(false); const [error,setError]=useState('')
  async function load(){setLoading(true);setError('');try{const c=await ClienteService.getById(id);if(!c){router.push('/clientes');return}setCliente(c);const related=await ClienteService.getRelated(id);setVehiculos(related.vehiculos as Vehiculo[]);setExpedientes(related.expedientes as Expediente[]);setFacturas(related.facturas as Factura[])}catch(e:any){setError(e?.message||'No se pudo cargar la ficha')}finally{setLoading(false)}}
  useEffect(()=>{load()},[id])
  if(loading)return <LabShell title="Cliente"><div className="py-20 text-center text-sm text-zinc-600">Cargando ficha...</div></LabShell>
  if(!cliente)return null
  const total=facturas.reduce((a,f)=>a+Number(f.total||0),0)

  return <LabShell title="Detalle del cliente" actions={<button onClick={()=>setModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-[#ef202d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#ff3945]"><Pencil size={14}/>Editar cliente</button>}>
    <div className="space-y-4">
      <Link href="/clientes" className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-white"><ArrowLeft size={14}/>Volver a clientes</Link>
      {error&&<div className="rounded-xl border border-[#ef202d]/25 bg-[#ef202d]/[0.06] p-3 text-xs text-red-300">{error}</div>}

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <LabPanel>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ef202d]">Ficha cliente</div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{cliente.nombre}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-500">
                {cliente.telefono&&<span className="flex items-center gap-1.5"><Phone size={13}/>{cliente.telefono}</span>}
                {cliente.email&&<span className="flex items-center gap-1.5"><Mail size={13}/>{cliente.email}</span>}
                {cliente.web&&<a className="flex items-center gap-1.5 hover:text-white" href={cliente.web.startsWith('http')?cliente.web:`https://${cliente.web}`} target="_blank" rel="noreferrer"><Globe2 size={13}/>{cliente.web}</a>}
              </div>
              <div className="mt-3 text-xs text-zinc-600">{[cliente.direccion,cliente.codigo_postal,cliente.poblacion,cliente.provincia].filter(Boolean).join(' · ')||'Sin dirección registrada'}</div>
              {!!cliente.herramientas?.length&&<div className="mt-4 flex flex-wrap items-center gap-2"><Wrench size={13} className="text-zinc-600"/>{cliente.herramientas.map(t=><LabBadge key={t} tone="blue">{t}</LabBadge>)}</div>}
            </div>
            {cliente.nif&&<LabBadge tone="zinc">NIF/CIF · {cliente.nif}</LabBadge>}
          </div>
        </LabPanel>

        <LabPanel title="Resumen">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric icon={<Car size={15}/>} label="Vehículos" value={String(vehiculos.length)}/><Metric icon={<FileText size={15}/>} label="Órdenes" value={String(expedientes.length)}/><Metric icon={<ReceiptText size={15}/>} label="Facturado" value={`${total.toFixed(0)} €`}/>
          </div>
          {cliente.notas&&<div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.018] p-3 text-xs leading-5 text-zinc-500">{cliente.notas}</div>}
        </LabPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <LabPanel title="Vehículos vinculados" padded={false}>
          <div>{vehiculos.map(v=><Link key={v.id} href={`/vehiculos/${v.id}`} className="grid grid-cols-[1fr_auto] items-center border-b border-white/[0.055] px-4 py-3 last:border-0 hover:bg-white/[0.02]"><div><div className="text-xs font-semibold text-zinc-200">{v.marca||'Vehículo'} {v.modelo||''}</div><div className="mt-0.5 text-[10px] text-zinc-600">{v.matricula||'Sin matrícula'} · {v.motor||'Sin motor'} · {v.ecu||'Sin ECU'}</div></div><span className="text-[10px] text-[#ef202d]">Ver ficha</span></Link>)}{vehiculos.length===0&&<Empty text="Sin vehículos asociados."/>}</div>
        </LabPanel>
        <LabPanel title="Expedientes recientes" padded={false}>
          <div>{expedientes.slice(0,8).map(e=><Link key={e.id} href={`/expedientes/${e.id}`} className="grid grid-cols-[1fr_auto] items-center border-b border-white/[0.055] px-4 py-3 last:border-0 hover:bg-white/[0.02]"><div><div className="text-xs font-semibold text-zinc-200">{e.numero_ot||'OT'} · {e.tipo_trabajo}</div><div className="mt-0.5 text-[10px] text-zinc-600">{e.tecnico||'Sin técnico'}</div></div><LabBadge status={e.estado}>{e.estado||'abierto'}</LabBadge></Link>)}{expedientes.length===0&&<Empty text="Sin expedientes."/>}</div>
        </LabPanel>
      </div>
    </div>
    <ClienteModal open={modalOpen} cliente={cliente} onClose={()=>setModalOpen(false)} onSave={async payload=>{await ClienteService.update(id,payload);await load()}}/>
  </LabShell>
}

function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-lg border border-white/[0.06] bg-white/[0.018] p-3"><div className="mx-auto mb-2 grid h-7 w-7 place-items-center rounded-md bg-[#ef202d]/10 text-[#ff5862]">{icon}</div><div className="text-sm font-bold text-white">{value}</div><div className="mt-0.5 text-[9px] text-zinc-600">{label}</div></div>}
function Empty({text}:{text:string}){return <div className="px-4 py-10 text-center text-xs text-zinc-600">{text}</div>}
