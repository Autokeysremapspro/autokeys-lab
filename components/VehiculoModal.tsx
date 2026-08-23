'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Cliente = { id: string; nombre: string; telefono?: string | null }
type VehiculoLike = { id?: string; cliente_id?: string | null; marca?: string | null; modelo?: string | null; motor?: string | null; anio?: number | null; matricula?: string | null; bastidor?: string | null; ecu?: string | null; hardware?: string | null; software?: string | null; notas?: string | null }
type Props = { open: boolean; clientes?: Cliente[]; initialData?: VehiculoLike | null; vehiculo?: VehiculoLike | null; loading?: boolean; saving?: boolean; title?: string; onClose: () => void; onSubmit?: (payload: Partial<VehiculoLike>) => Promise<void>; onSave?: (payload: Partial<VehiculoLike>) => Promise<void> }
const emptyForm: Partial<VehiculoLike> = { cliente_id:null, marca:'', modelo:'', motor:'', anio:null, matricula:'', bastidor:'', ecu:'', hardware:'', software:'', notas:'' }
const control='w-full rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition focus:border-[#ef202d]/55 focus:bg-white/[0.04] focus:ring-4 focus:ring-[#ef202d]/[0.07]'

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
  return <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md sm:p-5" onMouseDown={onClose}>
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0d12] shadow-[0_32px_100px_rgba(0,0,0,.68)]" onMouseDown={(e)=>e.stopPropagation()}>
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 sm:px-6 sm:py-5"><div><div className="text-[11px] font-bold uppercase tracking-[.18em] text-[#ef202d]">Vehículos</div><h2 className="mt-1 text-[22px] font-semibold text-white sm:text-[24px]">{heading}</h2><p className="mt-1 text-[13px] text-zinc-500">Ficha técnica del vehículo</p></div><button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-zinc-500 hover:bg-white/[0.05] hover:text-white"><X size={18}/></button></div>
      <div className="grid gap-4 overflow-y-auto p-5 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
        <label className="md:col-span-2 xl:col-span-3"><Label>Cliente</Label><select value={form.cliente_id||''} onChange={(e)=>setForm((p)=>({...p,cliente_id:e.target.value||null}))} className={control}><option value="">Sin asignar</option>{clientes.map((c)=><option key={c.id} value={c.id}>{c.nombre}{c.telefono?` · ${c.telefono}`:''}</option>)}</select></label>
        <Field label="Marca" value={form.marca||''} onChange={(v)=>setField('marca',v)}/><Field label="Modelo" value={form.modelo||''} onChange={(v)=>setField('modelo',v)}/><Field label="Motor" value={form.motor||''} onChange={(v)=>setField('motor',v)}/>
        <Field label="Matrícula" value={form.matricula||''} onChange={(v)=>setField('matricula',v.toUpperCase())}/><Field label="Bastidor / VIN" value={form.bastidor||''} onChange={(v)=>setField('bastidor',v.toUpperCase())}/><Field label="Año" value={form.anio?String(form.anio):''} onChange={(v)=>setField('anio',v)}/>
        <Field label="ECU" value={form.ecu||''} onChange={(v)=>setField('ecu',v)}/><Field label="Hardware" value={form.hardware||''} onChange={(v)=>setField('hardware',v)}/><Field label="Software" value={form.software||''} onChange={(v)=>setField('software',v)}/>
        <label className="md:col-span-2 xl:col-span-3"><Label>Notas</Label><textarea value={form.notas||''} onChange={(e)=>setField('notas',e.target.value)} rows={4} className={control}/></label>
      </div>
      <div className="flex flex-col-reverse gap-2.5 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button onClick={onClose} className="min-h-[44px] rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-2.5 text-[13px] font-semibold text-zinc-300 hover:bg-white/[0.04]">Cancelar</button><button onClick={submit} disabled={isSaving} className="min-h-[44px] rounded-xl bg-[#b92028] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#d52933] disabled:opacity-50">{isSaving?'Guardando...':'Guardar vehículo'}</button></div>
    </div>
  </div>
}
function Label({children}:{children:React.ReactNode}){return <span className="mb-2 block text-[12px] font-semibold text-zinc-400">{children}</span>}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><Label>{label}</Label><input value={value} onChange={(e)=>onChange(e.target.value)} className={control}/></label>}
