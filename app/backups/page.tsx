'use client'

import { useEffect, useState } from 'react'
import { Archive, Database, Download, HardDrive, RefreshCw, ShieldCheck } from 'lucide-react'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import { BACKUP_TABLES, exportFullJson, exportTable, getBackupRegistros } from '@/lib/services/backups'

type BackupRegistro = { id:string; tipo?:string|null; descripcion?:string|null; formato?:string|null; tablas?:string[]|null; total_registros?:number|null; creado_por?:string|null; created_at?:string|null }

function fmt(v?:string|null){ return v ? new Date(v).toLocaleString('es-ES') : '—' }

export default function BackupsPage(){
  const [rows,setRows]=useState<BackupRegistro[]>([])
  const [loading,setLoading]=useState(true)
  const [working,setWorking]=useState(false)
  const load=async()=>{setLoading(true);try{setRows((await getBackupRegistros()) as BackupRegistro[])}finally{setLoading(false)}}
  useEffect(()=>{load()},[])
  const latest=rows[0]

  async function full(){setWorking(true);try{await exportFullJson(BACKUP_TABLES.map(t=>t.key));await load()}finally{setWorking(false)}}

  return <LabShell title="Backups" subtitle="Copias de seguridad, restauración y exportación de datos">
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Mini icon={<ShieldCheck size={17}/>} label="Último backup" value={fmt(latest?.created_at)} tone="green"/>
        <Mini icon={<Database size={17}/>} label="Copias registradas" value={String(rows.length)} tone="blue"/>
        <Mini icon={<HardDrive size={17}/>} label="Tablas disponibles" value={String(BACKUP_TABLES.length)} tone="purple"/>
        <Mini icon={<Archive size={17}/>} label="Estado" value={loading?'Sincronizando':'Operativo'} tone="red"/>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <LabPanel title="Programación y exportación">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.018] p-4">
            <div className="text-sm font-semibold text-white">Copia completa</div>
            <p className="mt-1 text-xs leading-5 text-zinc-500">Exporta el conjunto de tablas del ERP en un único paquete JSON para conservación externa.</p>
            <button onClick={full} disabled={working} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#ef202d]/35 bg-gradient-to-b from-[#ef202d] to-[#c91823] px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_28px_rgba(239,32,45,.18)] disabled:opacity-50"><Download size={14}/>{working?'Generando...':'Generar backup completo'}</button>
          </div>
          <button onClick={load} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.05]"><RefreshCw size={14}/>Actualizar historial</button>
        </LabPanel>

        <LabPanel title="Puntos de restauración" padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[10px] uppercase tracking-[.12em] text-zinc-600"><th className="px-5 py-3">Fecha</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Descripción</th><th className="px-3 py-3">Registros</th><th className="px-3 py-3">Formato</th></tr></thead>
              <tbody>{rows.slice(0,12).map(r=><tr key={r.id} className="border-t border-white/[0.055] hover:bg-white/[0.02]"><td className="px-5 py-3 text-zinc-400">{fmt(r.created_at)}</td><td className="px-3 py-3"><LabBadge tone="green">{r.tipo||'backup'}</LabBadge></td><td className="px-3 py-3 text-zinc-300">{r.descripcion||'Copia de seguridad'}</td><td className="px-3 py-3 text-zinc-400">{r.total_registros??'—'}</td><td className="px-3 py-3 text-zinc-500">{r.formato||'JSON'}</td></tr>)}{!loading&&rows.length===0&&<tr><td colSpan={5} className="px-5 py-12 text-center text-zinc-600">Todavía no hay puntos registrados.</td></tr>}</tbody>
            </table>
          </div>
        </LabPanel>
      </div>

      <LabPanel title="Exportación por tabla">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BACKUP_TABLES.map(t=><button key={t.key} onClick={()=>exportTable(t.key)} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-left hover:border-white/[0.14] hover:bg-white/[0.04]"><span className="text-xs font-semibold text-zinc-300">{t.label}</span><Download size={13} className="text-zinc-600"/></button>)}
        </div>
      </LabPanel>
    </div>
  </LabShell>
}

function Mini({icon,label,value,tone}:{icon:React.ReactNode;label:string;value:string;tone:'green'|'blue'|'purple'|'red'}){
  const c={green:'text-[#4ade95] bg-[#4ade95]/10',blue:'text-[#52b8ff] bg-[#52b8ff]/10',purple:'text-[#a970ff] bg-[#a970ff]/10',red:'text-[#ff5862] bg-[#ef202d]/10'}[tone]
  return <div className="rounded-xl border border-white/[0.075] bg-[#0b0e13] p-4"><div className={`grid h-9 w-9 place-items-center rounded-lg ${c}`}>{icon}</div><div className="mt-3 text-[10px] font-semibold text-zinc-600">{label}</div><div className="mt-1 truncate text-sm font-bold text-white">{value}</div></div>
}
