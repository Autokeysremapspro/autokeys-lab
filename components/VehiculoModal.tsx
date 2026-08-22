'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Cliente = { id: string; nombre: string; telefono?: string | null }
type VehiculoLike = {
  id?: string; cliente_id?: string | null; marca?: string | null; modelo?: string | null; motor?: string | null;
  anio?: number | null; matricula?: string | null; bastidor?: string | null; ecu?: string | null;
  hardware?: string | null; software?: string | null; notas?: string | null
}
type Props = {
  open: boolean; clientes?: Cliente[]; initialData?: VehiculoLike | null; vehiculo?: VehiculoLike | null;
  loading?: boolean; saving?: boolean; title?: string; onClose: () => void;
  onSubmit?: (payload: Partial<VehiculoLike>) => Promise<void>; onSave?: (payload: Partial<VehiculoLike>) => Promise<void>
}
const emptyForm: Partial<VehiculoLike> = { cliente_id:null, marca:'', modelo:'', motor:'', anio:null, matricula:'', bastidor:'', ecu:'', hardware:'', software:'', notas:'' }

export default function VehiculoModal({ open, clientes=[], initialData, vehiculo, loading=false, saving=false, title, onClose, onSubmit, onSave }: Props) {
  const activeData = initialData || vehiculo || null
  const [form,setForm]=useState<Partial<VehiculoLike>>(emptyForm)
  const [internalLoading,setInternalLoading]=useState(false)
  useEffect(()=>{if(open)setForm({...emptyForm,...(activeData||{})})},[open,activeData?.id])
  if(!open)return null
  const isSaving=loading||saving||internalLoading
  const heading=title||(activeData?'Editar vehículo':'Nuevo vehículo')
  function setField(key:keyof VehiculoLike,value:string){setForm((prev)=>({...prev,[key]:key==='anio'?(value?Number(value):null):value}))}
  async function submit(){
    if(!form.marca?.trim()&&!form.matricula?.trim()){alert('Introduce al menos marca o matrícula');return}
    const payload:Partial<VehiculoLike>={cliente_id:form.cliente_id||null,marca:form.marca?.trim()||null,modelo:form.modelo?.trim()||null,motor:form.motor?.trim()||null,anio:form.anio?Number(form.anio):null,matricula:form.matricula?.trim().toUpperCase()||null,bastidor:form.bastidor?.trim().toUpperCase()||null,ecu:form.ecu?.trim()||null,hardware:form.hardware?.trim()||null,software:form.software?.trim()||null,notas:form.notas?.trim()||null}
    const handler=onSubmit||onSave;if(!handler)return
    setInternalLoading(true);try{await handler(payload)}catch(error:any){alert(error?.message||'No se pudo guardar el vehículo')}finally{setInternalLoading(false)}
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md">
    <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-white/[0.09] bg-[#0b0d10] shadow-[0_35px_100px_rgba(0,0,0,.65)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><h2 className="text-[17px] font-semibold text-white">{heading}</h2><p className="mt-1 text-[10px] text-zinc-600">Ficha técnica del vehículo</p></div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md border border-white/[0.08] text-zinc-500 hover:bg-white/[0.04] hover:text-white"><X size={15}/></button></div>
      <div className="grid gap-3 p-5 md:grid-cols-3">
        <label className="md:col-span-3"><Label>Cliente</Label><select value={form.cliente_id||''} onChange={(e)=>setForm((p)=>({...p,cliente_id:e.target.value||null}))} className="w-full rounded-md border border-white/[0.08] bg-[#0e1014] px-3 py-2.5 text-[11px] text-zinc-200"><option value="">Sin asignar</option>{clientes.map((c)=><option key={c.id} value={c.id}>{c.nombre}{c.telefono?` · ${c.telefono}`:''}</option>)}</select></label>
        <Field label="Marca" value={form.marca||''} onChange={(v)=>setField('marca',v)}/><Field label="Modelo" value={form.modelo||''} onChange={(v)=>setField('modelo',v)}/><Field label="Motor" value={form.motor||''} onChange={(v)=>setField('motor',v)}/>
        <Field label="Matrícula" value={form.matricula||''} onChange={(v)=>setField('matricula',v.toUpperCase())}/><Field label="Bastidor / VIN" value={form.bastidor||''} onChange={(v)=>setField('bastidor',v.toUpperCase())}/><Field label="Año" value={form.anio?String(form.anio):''} onChange={(v)=>setField('anio',v)}/>
        <Field label="ECU" value={form.ecu||''} onChange={(v)=>setField('ecu',v)}/><Field label="Hardware" value={form.hardware||''} onChange={(v)=>setField('hardware',v)}/><Field label="Software" value={form.software||''} onChange={(v)=>setField('software',v)}/>
        <label className="md:col-span-3"><Label>Notas</Label><textarea value={form.notas||''} onChange={(e)=>setField('notas',e.target.value)} className="min-h-24 w-full rounded-md border border-white/[0.08] bg-[#0e1014] px-3 py-2.5 text-[11px] text-zinc-200 outline-none focus:border-[#ef202d]/60"/></label>
      </div>
      <div className="flex justify-end gap-2 border-t border-white/[0.07] px-5 py-4"><button onClick={onClose} className="rounded-md border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[10px] font-medium text-zinc-400 hover:bg-white/[0.04]">Cancelar</button><button onClick={submit} disabled={isSaving} className="rounded-md bg-[#b92028] px-5 py-2 text-[10px] font-semibold text-white hover:bg-[#d52933] disabled:opacity-50">{isSaving?'Guardando...':'Guardar vehículo'}</button></div>
    </div>
  </div>
}
function Label({children}:{children:React.ReactNode}){return <span className="mb-1.5 block text-[9px] font-medium text-zinc-500">{children}</span>}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><Label>{label}</Label><input value={value} onChange={(e)=>onChange(e.target.value)} className="w-full rounded-md border border-white/[0.08] bg-[#0e1014] px-3 py-2.5 text-[11px] text-zinc-200 outline-none focus:border-[#ef202d]/60"/></label>}
