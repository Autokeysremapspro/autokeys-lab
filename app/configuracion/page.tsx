'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Building2, FileText, Palette, Users, Bell, MessageSquare, Receipt, ShieldCheck, Plug, HardDrive, Cloud, Activity, Server, Download, CheckCircle2, Database, Clock3 } from 'lucide-react'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import FormModal from '@/components/FormModal'
import ConfigEmpresaForm from '@/components/ConfigEmpresaForm'
import { getConfiguracionEmpresa, type ConfiguracionEmpresa } from '@/lib/services/configuracion'
import { UsuariosService, type UsuarioApp } from '@/lib/services/usuarios'
import { getBackupRegistros, exportFullJson, BACKUP_TABLES } from '@/lib/services/backups'
import { getAuditLogs, getAdminOverview, type AuditLog, type AdminOverview } from '@/lib/services/admin'

const CONFIG_NAV = [
  { key:'empresa',label:'Empresa',desc:'Datos generales y preferencias',icon:Building2 },
  { key:'fiscal',label:'Datos fiscales',desc:'Información fiscal y tributaria',icon:FileText },
  { key:'branding',label:'Branding',desc:'Logo, colores y personalización',icon:Palette },
  { key:'usuarios',label:'Usuarios y roles',desc:'Gestiona accesos y permisos',icon:Users },
  { key:'notificaciones',label:'Notificaciones',desc:'Alertas, correos y preferencias',icon:Bell },
  { key:'whatsapp',label:'WhatsApp / Email',desc:'Canales de comunicación',icon:MessageSquare },
  { key:'facturacion',label:'Facturación',desc:'Opciones de facturación',icon:Receipt },
  { key:'seguridad',label:'Seguridad',desc:'Contraseñas, 2FA y sesiones',icon:ShieldCheck },
  { key:'api',label:'API / Integraciones',desc:'Canales servicios externos',icon:Plug },
]

function MiniKV({label,value,good=false}:{label:string;value:React.ReactNode;good?:boolean}){return <div className="flex items-center justify-between border-b border-white/[0.05] py-1.5 last:border-0"><span className="text-[8px] text-zinc-600">{label}</span><span className={`max-w-[62%] truncate text-right text-[8px] ${good?'text-[#55c765]':'text-zinc-300'}`}>{value}</span></div>}
function StatusCard({title,icon:Icon,tone='green',value,sub}:{title:string;icon:any;tone?:'green'|'orange'|'zinc';value:string;sub:string}){const colors={green:'bg-[#55c765]/12 text-[#55c765]',orange:'bg-[#f59e0b]/12 text-[#f59e0b]',zinc:'bg-white/[0.04] text-zinc-500'};return <LabPanel title={title}><div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-full ${colors[tone]}`}><Icon size={21}/></div><div><div className="text-[14px] font-semibold text-white">{value}</div><div className="mt-1 text-[8px] text-zinc-600">{sub}</div></div></div></LabPanel>}

export default function ConfiguracionPage(){
  const [empresa,setEmpresa]=useState<ConfiguracionEmpresa|null>(null)
  const [usuarios,setUsuarios]=useState<UsuarioApp[]>([])
  const [backups,setBackups]=useState<any[]>([])
  const [logs,setLogs]=useState<AuditLog[]>([])
  const [overview,setOverview]=useState<AdminOverview|null>(null)
  const [editOpen,setEditOpen]=useState(false)
  const [section,setSection]=useState('empresa')
  const [exporting,setExporting]=useState(false)
  useEffect(()=>{load()},[])
  async function load(){const [emp,usu,bk,lg,ov]=await Promise.all([getConfiguracionEmpresa().catch(()=>null),UsuariosService.getAll().catch(()=>[]),getBackupRegistros().catch(()=>[]),getAuditLogs(8).catch(()=>[]),getAdminOverview().catch(()=>null)]);setEmpresa(emp);setUsuarios(usu);setBackups(bk);setLogs(lg);setOverview(ov)}
  const usuariosActivos=usuarios.filter((u)=>u.activo!==false)
  const roles=new Set(usuarios.map((u)=>u.rol))
  const ultimoAcceso=usuarios.reduce<string|null>((latest,u)=>!u.ultimo_acceso?latest:!latest||u.ultimo_acceso>latest?u.ultimo_acceso:latest,null)
  const ultimoBackup=backups[0]
  async function backupCompleto(){setExporting(true);try{await exportFullJson(BACKUP_TABLES.map((t)=>t.key));toast.success('Backup completo descargado');load()}catch(err:any){toast.error(err.message||'No se pudo generar el backup')}finally{setExporting(false)}}
  function clickSection(key:string){setSection(key);if(key==='empresa'||key==='fiscal')setEditOpen(true);else if(key==='usuarios')window.location.href='/usuarios';else if(key==='notificaciones')window.location.href='/notificaciones';else toast('Esta sección se está integrando en el nuevo panel.',{icon:'ℹ️'})}

  return <LabShell title="Ajustes y Backups" subtitle="Configura tu empresa, gestiona usuarios, seguridad, integraciones y copias de seguridad.">
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg border border-white/[0.07] bg-[#0a0c0f] p-1"><button className="min-w-[110px] rounded-md bg-[#8f171f] px-5 py-2 text-[9px] font-semibold text-white">Ajustes</button><button onClick={()=>document.getElementById('backups-section')?.scrollIntoView({behavior:'smooth'})} className="min-w-[110px] rounded-md px-5 py-2 text-[9px] text-zinc-500 hover:text-zinc-300">Backups</button></div>

      <div className="grid gap-3 xl:grid-cols-[230px_minmax(0,1fr)]">
        <LabPanel title="Configuración" padded={false}>
          <div>{CONFIG_NAV.map((item)=>{const Icon=item.icon;const active=section===item.key;return <button key={item.key} onClick={()=>clickSection(item.key)} className={`flex w-full items-center gap-2.5 border-b border-white/[0.045] px-3 py-2 text-left last:border-0 ${active?'bg-white/[0.035]':'hover:bg-white/[0.02]'}`}><Icon size={14} className={active?'text-[#ef202d]':'text-[#ef202d]/75'}/><div className="min-w-0"><div className="text-[9px] font-medium text-zinc-300">{item.label}</div><div className="truncate text-[7px] text-zinc-600">{item.desc}</div></div></button>})}</div>
        </LabPanel>

        <div className="space-y-3">
          <div className="grid gap-3 xl:grid-cols-4">
            <LabPanel title="Configuración general"><MiniKV label="Nombre de la empresa" value={empresa?.nombre_comercial||'Autokeys Lab'}/><MiniKV label="País / Región" value="España"/><MiniKV label="Zona horaria" value="(UTC+01:00) Madrid"/><MiniKV label="Moneda" value="EUR (€)"/><MiniKV label="Idioma" value="Español"/><MiniKV label="Formato de fecha" value="DD/MM/YYYY"/><MiniKV label="Formato de hora" value="24 horas"/><button onClick={()=>setEditOpen(true)} className="mt-2 w-full rounded-md border border-white/[0.07] bg-white/[0.025] py-2 text-[8px] text-zinc-400">Editar configuración</button></LabPanel>
            <LabPanel title="Datos fiscales"><MiniKV label="Razón social" value={empresa?.razon_social||'—'}/><MiniKV label="NIF / CIF" value={empresa?.cif||'—'}/><MiniKV label="Dirección fiscal" value={[empresa?.direccion,empresa?.poblacion].filter(Boolean).join(', ')||'—'}/><MiniKV label="Régimen fiscal" value="General"/><MiniKV label="IVA predeterminado" value={`${empresa?.iva_defecto??21}%`}/><MiniKV label="Email fiscal" value={empresa?.email||'—'}/><MiniKV label="Teléfono" value={empresa?.telefono||'—'}/><button onClick={()=>setEditOpen(true)} className="mt-2 w-full rounded-md border border-white/[0.07] bg-white/[0.025] py-2 text-[8px] text-zinc-400">Editar datos fiscales</button></LabPanel>
            <LabPanel title="Branding"><div className="grid h-[70px] place-items-center rounded-md border border-white/[0.07] bg-[#07080a]"><div className="text-center"><div className="text-[28px] font-black italic tracking-[-.14em] text-[#ef202d]">AK</div><div className="text-[7px] font-semibold tracking-[.12em] text-zinc-400">AUTOKEYS LAB</div></div></div><div className="mt-2"><MiniKV label="Color primario" value={<span className="flex items-center justify-end gap-1"><span className="h-3 w-3 rounded-full bg-[#ef202d]"/>#EF1E1E</span>}/><MiniKV label="Color secundario" value="#0A0A0A"/><MiniKV label="Color de acento" value="#2B2B2B"/></div><button className="mt-2 w-full rounded-md border border-white/[0.07] bg-white/[0.025] py-2 text-[8px] text-zinc-400">Personalizar marca</button></LabPanel>
            <LabPanel title="Usuarios y roles"><MiniKV label="Usuarios activos" value={usuariosActivos.length}/><MiniKV label="Roles definidos" value={roles.size}/><MiniKV label="Último acceso" value={ultimoAcceso?new Date(ultimoAcceso).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'—'}/><MiniKV label="Política de contraseñas" value="Activada" good/><MiniKV label="Autenticación 2FA" value="Obligatoria" good/><Link href="/usuarios" className="mt-4 block w-full rounded-md border border-white/[0.07] bg-white/[0.025] py-2 text-center text-[8px] text-zinc-400">Gestionar usuarios</Link></LabPanel>
          </div>

          <div className="grid gap-3 xl:grid-cols-4"><StatusCard title="Último backup" icon={Cloud} value={ultimoBackup?new Date(ultimoBackup.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'Sin registros'} sub={ultimoBackup?.descripcion||'Copia completa'} /><StatusCard title="Usuarios activos" icon={Users} tone="orange" value={String(usuariosActivos.length)} sub="Usuarios conectados"/><StatusCard title="Conexión SSL" icon={ShieldCheck} value="Activa" sub="Certificado válido"/><StatusCard title="Espacio usado" icon={Database} tone="zinc" value="256.8 GB / 1 TB" sub="25% utilizado"/></div>
        </div>
      </div>

      <div id="backups-section" className="rounded-xl border border-white/[0.075] bg-[#090b0e] p-3">
        <div className="mb-3 text-[11px] font-semibold text-zinc-300">BACKUPS</div>
        <div className="grid gap-3 xl:grid-cols-5">
          <LabPanel title="Programación"><MiniKV label="Copia automática" value={<LabBadge tone="green">Activada</LabBadge>}/><MiniKV label="Frecuencia" value="Diaria ›"/><MiniKV label="Hora" value="03:00 ›"/><MiniKV label="Retención" value="30 días ›"/><MiniKV label="Notificar por email" value={<LabBadge tone="green">Activado</LabBadge>}/><button onClick={backupCompleto} disabled={exporting} className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-white/[0.07] py-2 text-[8px] text-zinc-400"><Download size={10}/>{exporting?'Generando...':'Editar programación'}</button></LabPanel>
          <LabPanel title="Puntos de restauración"><div className="space-y-1.5">{backups.slice(0,5).map((b)=><div key={b.id} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 border-b border-white/[0.04] pb-1.5 text-[7px]"><CheckCircle2 size={9} className="text-[#55c765]"/><span className="text-zinc-400">{new Date(b.created_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span><span className="text-zinc-600">{b.descripcion||b.tipo||'Copia completa'}</span></div>)}{backups.length===0&&<div className="py-8 text-center text-[8px] text-zinc-600">Sin puntos todavía.</div>}</div><Link href="/backups" className="mt-3 block rounded-md border border-white/[0.07] py-2 text-center text-[8px] text-zinc-500">Ver todos los puntos</Link></LabPanel>
          <LabPanel title="Almacenamiento en la nube"><div className="space-y-2 text-[8px]"><div className="flex justify-between"><span className="text-zinc-400">Google Drive</span><span className="text-[#55c765]">Conectado · 125 GB</span></div><div className="flex justify-between"><span className="text-zinc-400">Dropbox</span><span className="text-[#55c765]">Conectado · 75 GB</span></div><div className="flex justify-between"><span className="text-zinc-400">Amazon S3</span><span className="text-[#ef202d]">No conectado</span></div></div><button className="mt-5 w-full rounded-md border border-white/[0.07] py-2 text-[8px] text-zinc-500">Configurar almacenamiento</button></LabPanel>
          <LabPanel title="Registro de actividad"><div className="space-y-1.5">{logs.slice(0,5).map((l:any)=><div key={l.id} className="grid grid-cols-[10px_1fr_auto] items-center gap-2 border-b border-white/[0.04] pb-1.5 text-[7px]"><CheckCircle2 size={9} className="text-[#55c765]"/><span className="truncate text-zinc-400">{l.accion||l.evento||'Actividad'}</span><span className="text-zinc-600">{l.created_at?new Date(l.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):''}</span></div>)}</div><Link href="/auditoria" className="mt-3 block rounded-md border border-white/[0.07] py-2 text-center text-[8px] text-zinc-500">Ver registro completo</Link></LabPanel>
          <LabPanel title="Estado del servidor"><MiniKV label="Estado" value="Operativo" good/><MiniKV label="CPU" value="23%"/><MiniKV label="Memoria" value="48%"/><MiniKV label="Disco" value="25%"/><MiniKV label="Base de datos" value="Saludable" good/><MiniKV label="Uptime" value="15 días, 7h 42m"/><button className="mt-3 w-full rounded-md border border-white/[0.07] py-2 text-[8px] text-zinc-500">Ver detalles del sistema</button></LabPanel>
        </div>
      </div>
    </div>

    <FormModal open={editOpen} onClose={()=>setEditOpen(false)} title="Configuración de empresa"><ConfigEmpresaForm initial={empresa} onSaved={()=>{setEditOpen(false);load()}}/></FormModal>
  </LabShell>
}
