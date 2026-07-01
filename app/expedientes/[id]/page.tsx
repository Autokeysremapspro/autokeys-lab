'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'
import { money, statusClass } from '@/lib/status'
import toast from 'react-hot-toast'

const tabs = ['resumen','ecu','llaves','historial'] as const
const ecuFields = ['marca_ecu','modelo_ecu','hw','sw','vin_original','vin_nuevo','cvn','password','pin','cs','mac','isn','estado_immo','stage','dpf','egr','adblue','checksum','lectura','herramienta']
const llaveFields = ['llaves_originales','llaves_programadas','tipo_llave','frecuencia','transponder','mando','plataforma','pin','cs','mac','isn','estado']

function Label({children}:{children:React.ReactNode}){ return <label className="text-xs uppercase tracking-wide text-zinc-500 font-bold">{children}</label> }
function Input({label,value,onChange,type='text'}:{label:string,value:any,onChange:(v:any)=>void,type?:string}){ return <div className="space-y-1"><Label>{label.replaceAll('_',' ')}</Label><input type={type} value={value||''} onChange={e=>onChange(type==='number'?Number(e.target.value):e.target.value)} /></div> }

export default function ExpedienteDetalle(){
  const params = useParams<{id:string}>()
  const id = params.id
  const [active,setActive] = useState<typeof tabs[number]>('resumen')
  const [ot,setOt] = useState<any>(null)
  const [ecu,setEcu] = useState<any>({})
  const [llaves,setLlaves] = useState<any>({})
  const [historial,setHistorial] = useState<any[]>([])
  const [evento,setEvento] = useState('')

  useEffect(()=>{ if(id) load() },[id])

  async function load(){
    const [{data:o},{data:e},{data:l},{data:h}] = await Promise.all([
      supabase.from('expedientes').select('*,clientes(*),vehiculos(*)').eq('id',id).single(),
      supabase.from('expediente_ecu').select('*').eq('expediente_id',id).maybeSingle(),
      supabase.from('expediente_llaves').select('*').eq('expediente_id',id).maybeSingle(),
      supabase.from('expediente_historial').select('*').eq('expediente_id',id).order('created_at',{ascending:false})
    ])
    setOt(o); setEcu(e||{expediente_id:id}); setLlaves(l||{expediente_id:id}); setHistorial(h||[])
  }

  async function saveEcu(){
    const {error}=await supabase.from('expediente_ecu').upsert({...ecu,expediente_id:id},{onConflict:'expediente_id'})
    if(error) toast.error(error.message); else {toast.success('Ficha ECU guardada'); load()}
  }
  async function saveLlaves(){
    const {error}=await supabase.from('expediente_llaves').upsert({...llaves,expediente_id:id},{onConflict:'expediente_id'})
    if(error) toast.error(error.message); else {toast.success('Ficha llaves guardada'); load()}
  }
  async function addEvento(e:any){
    e.preventDefault()
    if(!evento.trim()) return
    const {error}=await supabase.from('expediente_historial').insert({expediente_id:id,evento,usuario:'Autokeys Lab'})
    if(error) toast.error(error.message); else {setEvento(''); toast.success('Evento añadido'); load()}
  }

  if(!ot) return <AppShell><p>Cargando expediente...</p></AppShell>

  return <AppShell>
    <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <Link href="/expedientes" className="text-zinc-500 hover:text-white text-sm">← Volver a expedientes</Link>
        <h2 className="text-3xl font-black mt-2">{ot.numero_ot} · {ot.tipo_trabajo}</h2>
        <p className="text-zinc-500">{ot.clientes?.nombre || 'Sin cliente'} · {ot.vehiculos?.marca} {ot.vehiculos?.modelo} {ot.vehiculos?.matricula}</p>
      </div>
      <div className="flex items-center gap-3"><span className={`badge ${statusClass(ot.estado)}`}>{ot.estado}</span><span className="text-2xl font-black">{money(ot.precio_final || ot.precio_estimado)}</span></div>
    </div>

    <div className="card p-2 mb-6 flex flex-wrap gap-2">
      {tabs.map(t=><button key={t} onClick={()=>setActive(t)} className={`btn ${active===t?'btn-red':'btn-dark'} capitalize`}>{t}</button>)}
    </div>

    {active==='resumen' && <div className="grid lg:grid-cols-3 gap-4">
      <div className="card p-5"><h3 className="font-black text-xl mb-4">Cliente</h3><p className="font-bold">{ot.clientes?.nombre}</p><p className="text-zinc-400">{ot.clientes?.telefono}</p><p className="text-zinc-400">{ot.clientes?.email}</p><p className="text-zinc-400">{ot.clientes?.nif}</p></div>
      <div className="card p-5"><h3 className="font-black text-xl mb-4">Vehículo</h3><p className="font-bold">{ot.vehiculos?.marca} {ot.vehiculos?.modelo}</p><p className="text-zinc-400">Matrícula: {ot.vehiculos?.matricula}</p><p className="text-zinc-400">VIN: {ot.vehiculos?.bastidor}</p><p className="text-zinc-400">ECU: {ot.vehiculos?.ecu}</p></div>
      <div className="card p-5"><h3 className="font-black text-xl mb-4">Trabajo</h3><p className="text-zinc-300">{ot.descripcion}</p><p className="text-zinc-500 mt-4 whitespace-pre-wrap">{ot.notas_internas}</p></div>
    </div>}

    {active==='ecu' && <div className="card p-5">
      <h3 className="font-black text-xl mb-4">Ficha técnica ECU / IMMO / Remap</h3>
      <div className="grid md:grid-cols-3 gap-3">{ecuFields.map(k=><Input key={k} label={k} value={ecu[k]} onChange={v=>setEcu({...ecu,[k]:v})}/>)}</div>
      <div className="mt-3"><Label>Notas ECU</Label><textarea className="w-full min-h-28" value={ecu.notas||''} onChange={e=>setEcu({...ecu,notas:e.target.value})}/></div>
      <button onClick={saveEcu} className="btn btn-red mt-4">Guardar ficha ECU</button>
    </div>}

    {active==='llaves' && <div className="card p-5">
      <h3 className="font-black text-xl mb-4">Ficha técnica llaves</h3>
      <div className="grid md:grid-cols-3 gap-3">{llaveFields.map(k=><Input key={k} label={k} type={k.includes('llaves_')?'number':'text'} value={llaves[k]} onChange={v=>setLlaves({...llaves,[k]:v})}/>)}</div>
      <div className="mt-3"><Label>Notas llaves</Label><textarea className="w-full min-h-28" value={llaves.notas||''} onChange={e=>setLlaves({...llaves,notas:e.target.value})}/></div>
      <button onClick={saveLlaves} className="btn btn-red mt-4">Guardar ficha llaves</button>
    </div>}

    {active==='historial' && <div className="grid lg:grid-cols-3 gap-4">
      <form onSubmit={addEvento} className="card p-5 lg:col-span-1"><h3 className="font-black text-xl mb-4">Añadir evento</h3><textarea className="w-full min-h-28" placeholder="Ej: Leída ECU por bench, backup guardado, pendiente prueba..." value={evento} onChange={e=>setEvento(e.target.value)}/><button className="btn btn-red mt-3 w-full">Añadir</button></form>
      <div className="card p-5 lg:col-span-2"><h3 className="font-black text-xl mb-4">Timeline</h3><div className="space-y-3">{historial.map(h=><div key={h.id} className="border border-zinc-800 rounded-2xl p-4"><p className="font-bold">{h.evento}</p><p className="text-zinc-500 text-sm">{new Date(h.created_at).toLocaleString()}</p></div>)}{historial.length===0 && <p className="text-zinc-500">Sin eventos todavía.</p>}</div></div>
    </div>}
  </AppShell>
}
