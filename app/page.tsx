'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import DataTable from '@/components/DataTable'
import { supabase } from '@/lib/supabase'
import { statusClass, money } from '@/lib/status'

export default function Dashboard(){
 const [stats,setStats]=useState<any>({}); const [ots,setOts]=useState<any[]>([])
 useEffect(()=>{load()},[])
 async function load(){
  const [{count:ot},{count:clientes},{count:stock},{data:latest},{data:facturas}] = await Promise.all([
   supabase.from('expedientes').select('*',{count:'exact',head:true}).neq('estado','entregado'),
   supabase.from('clientes').select('*',{count:'exact',head:true}),
   supabase.from('stock').select('*',{count:'exact',head:true}),
   supabase.from('expedientes').select('numero_ot,tipo_trabajo,estado,precio_final,created_at, clientes(nombre), vehiculos(marca,modelo,matricula)').order('created_at',{ascending:false}).limit(8),
   supabase.from('facturas').select('total').gte('fecha', new Date().toISOString().slice(0,10))
  ])
  setStats({ot,clientes,stock,facturacion:(facturas||[]).reduce((a:any,b:any)=>a+Number(b.total||0),0)})
  setOts(latest||[])
 }
 return <AppShell><div className="grid md:grid-cols-4 gap-4 mb-8">
  {[['OT abiertas',stats.ot],['Clientes',stats.clientes],['Stock refs',stats.stock],['Facturación hoy',money(stats.facturacion)]].map(([k,v])=><div className="card p-5" key={k}><p className="text-zinc-500 text-sm">{k}</p><p className="text-3xl font-black mt-2">{v||0}</p></div>)}
 </div>
 <h2 className="text-xl font-black mb-4">Últimos expedientes</h2>
 <DataTable columns={['OT','Cliente','Vehículo','Trabajo','Estado','Importe']} rows={ots.map((o:any)=>[
  <b>{o.numero_ot}</b>, o.clientes?.nombre||'-', `${o.vehiculos?.marca||''} ${o.vehiculos?.modelo||''} ${o.vehiculos?.matricula||''}`, o.tipo_trabajo, <span className={`badge ${statusClass(o.estado)}`}>{o.estado}</span>, money(o.precio_final)
 ])}/></AppShell>
}
