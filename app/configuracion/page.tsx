'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Building2,
  FileText,
  Palette,
  Users,
  Bell,
  MessageSquare,
  Receipt,
  ShieldCheck,
  Plug,
  ShieldCheck as SSLIcon,
  HardDrive,
  Cloud,
  Activity,
  Server,
  Download,
  ExternalLink,
} from 'lucide-react'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import FormModal from '@/components/FormModal'
import ConfigEmpresaForm from '@/components/ConfigEmpresaForm'
import { getConfiguracionEmpresa, type ConfiguracionEmpresa } from '@/lib/services/configuracion'
import { UsuariosService, type UsuarioApp } from '@/lib/services/usuarios'
import { getBackupRegistros, exportFullJson, BACKUP_TABLES } from '@/lib/services/backups'
import { getAuditLogs, getAdminOverview, type AuditLog, type AdminOverview } from '@/lib/services/admin'

type Tab = 'ajustes' | 'backups'

const CONFIG_NAV = [
  { key: 'empresa', label: 'Empresa', desc: 'Datos generales y preferencias', icon: Building2 },
  { key: 'fiscal', label: 'Datos fiscales', desc: 'Información fiscal y tributaria', icon: FileText },
  { key: 'branding', label: 'Branding', desc: 'Logo, colores y personalización', icon: Palette },
  { key: 'usuarios', label: 'Usuarios y roles', desc: 'Gestiona accesos y permisos', icon: Users },
  { key: 'notificaciones', label: 'Notificaciones', desc: 'Alertas, correos y preferencias', icon: Bell },
  { key: 'whatsapp', label: 'WhatsApp / Email', desc: 'Canales de comunicación', icon: MessageSquare },
  { key: 'facturacion', label: 'Facturación', desc: 'Opciones de facturación', icon: Receipt },
  { key: 'seguridad', label: 'Seguridad', desc: 'Contraseñas, 2FA y sesiones', icon: ShieldCheck },
  { key: 'api', label: 'API / Integraciones', desc: 'Canales servicios externos', icon: Plug },
]

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>('ajustes')
  const [section, setSection] = useState('empresa')
  const [empresa, setEmpresa] = useState<ConfiguracionEmpresa | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioApp[]>([])
  const [backups, setBackups] = useState<any[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [emp, usu, bk, lg, ov] = await Promise.all([
        getConfiguracionEmpresa().catch(() => null),
        UsuariosService.getAll().catch(() => []),
        getBackupRegistros().catch(() => []),
        getAuditLogs(6).catch(() => []),
        getAdminOverview().catch(() => null),
      ])
      setEmpresa(emp)
      setUsuarios(usu)
      setBackups(bk)
      setLogs(lg)
      setOverview(ov)
    } catch (err: any) {
      toast.error(err.message || 'Error cargando ajustes')
    }
  }

  function clickSection(key: string) {
    setSection(key)
    if (key === 'empresa' || key === 'fiscal') setEditOpen(true)
    else if (key === 'usuarios') window.location.href = '/usuarios'
    else if (key === 'notificaciones') window.location.href = '/notificaciones'
    else if (key === 'branding' || key === 'facturacion') window.location.href = '/configuracion/documentos'
    else toast('Esta sección todavía no está disponible.', { icon: 'ℹ️' })
  }

  const usuariosActivos = usuarios.filter((u) => u.activo !== false)
  const roles = new Set(usuarios.map((u) => u.rol))
  const ultimoAcceso = usuarios.reduce<string | null>((latest, u) => {
    if (!u.ultimo_acceso) return latest
    return !latest || u.ultimo_acceso > latest ? u.ultimo_acceso : latest
  }, null)
  const ultimoBackup = backups[0]

  async function backupCompleto() {
    setExporting(true)
    try {
      await exportFullJson(BACKUP_TABLES.map((t) => t.key))
      toast.success('Backup completo descargado')
      load()
    } catch (err: any) {
      toast.error(err.message || 'No se pudo generar el backup')
    } finally {
      setExporting(false)
    }
  }

  return (
    <LabShell title="Ajustes y Backups" subtitle="Configura tu empresa, gestiona usuarios, seguridad, integraciones y copias de seguridad.">
      <div className="space-y-4">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {(['ajustes', 'backups'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-5 py-2.5 text-sm font-bold capitalize transition ${tab === t ? 'bg-[#c81f2a] text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'ajustes' && (
          <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
            <LabPanel title="Configuración" padded={false}>
              <div className="space-y-1 p-2">
                {CONFIG_NAV.map((item) => {
                  const Icon = item.icon
                  const active = section === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => clickSection(item.key)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? 'bg-[#c81f2a]/15 text-white' : 'text-zinc-400 hover:bg-white/[0.04]'}`}
                    >
                      <Icon size={16} className={active ? 'text-[#ff5468]' : 'text-zinc-600'} />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold">{item.label}</div>
                        <div className="truncate text-[10px] text-zinc-600">{item.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </LabPanel>

            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <LabPanel title="Configuración general">
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Nombre de la empresa</dt><dd className="font-bold text-zinc-200">{empresa?.nombre_comercial || '—'}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">País / Región</dt><dd className="font-bold text-zinc-200">{empresa?.provincia ? `España — ${empresa.provincia}` : 'España'}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Moneda</dt><dd className="font-bold text-zinc-200">EUR (€)</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Idioma</dt><dd className="font-bold text-zinc-200">Español</dd></div>
                  <div className="flex justify-between pb-1"><dt className="text-zinc-600">Formato de fecha</dt><dd className="font-bold text-zinc-200">DD/MM/YYYY</dd></div>
                </dl>
                <button onClick={() => setEditOpen(true)} className="mt-4 w-full rounded-xl bg-white/[0.05] py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]">Editar configuración</button>
              </LabPanel>

              <LabPanel title="Datos fiscales">
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Razón social</dt><dd className="font-bold text-zinc-200">{empresa?.razon_social || '—'}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">NIF / CIF</dt><dd className="font-bold text-zinc-200">{empresa?.cif || '—'}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Dirección fiscal</dt><dd className="max-w-[60%] truncate text-right font-bold text-zinc-200">{[empresa?.direccion, empresa?.poblacion].filter(Boolean).join(', ') || '—'}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Email fiscal</dt><dd className="font-bold text-zinc-200">{empresa?.email || '—'}</dd></div>
                  <div className="flex justify-between pb-1"><dt className="text-zinc-600">IVA predeterminado</dt><dd className="font-bold text-zinc-200">{empresa?.iva_defecto ?? 21}%</dd></div>
                </dl>
                <button onClick={() => setEditOpen(true)} className="mt-4 w-full rounded-xl bg-white/[0.05] py-2.5 text-xs font-bold text-white hover:bg-white/[0.09]">Editar datos fiscales</button>
              </LabPanel>

              <LabPanel title="Branding">
                <div className="grid h-24 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
                  {empresa?.logo_url
                    ? <img src={empresa.logo_url} alt="Logo" className="max-h-16 max-w-[80%] object-contain" />
                    : <div className="text-lg font-black tracking-tight text-white">AK <span className="text-[#ff3b46]">LAB</span></div>}
                </div>
                <p className="mt-3 text-xs text-zinc-500">Logo, color y sello por tipo de documento (factura, presupuesto, albarán, ticket).</p>
                <Link href="/configuracion/documentos" className="mt-4 block w-full rounded-xl bg-white/[0.05] py-2.5 text-center text-xs font-bold text-white hover:bg-white/[0.09]">Personalizar marca</Link>
              </LabPanel>

              <LabPanel title="Usuarios y roles">
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Usuarios activos</dt><dd className="font-bold text-zinc-200">{usuariosActivos.length}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Roles definidos</dt><dd className="font-bold text-zinc-200">{roles.size}</dd></div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Último acceso</dt><dd className="font-bold text-zinc-200">{ultimoAcceso ? new Date(ultimoAcceso).toLocaleString('es-ES') : '—'}</dd></div>
                  <div className="flex justify-between pb-1"><dt className="text-zinc-600">Autenticación 2FA</dt><dd><LabBadge tone="zinc">No configurada</LabBadge></dd></div>
                </dl>
                <Link href="/usuarios" className="mt-4 block w-full rounded-xl bg-white/[0.05] py-2.5 text-center text-xs font-bold text-white hover:bg-white/[0.09]">Gestionar usuarios</Link>
              </LabPanel>

              <LabPanel title="Último backup">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#4ade95]/15 text-[#4ade95]"><Cloud size={20} /></div>
                  <div>
                    <div className="text-sm font-bold text-white">{ultimoBackup ? new Date(ultimoBackup.created_at).toLocaleString('es-ES') : 'Sin registros'}</div>
                    <div className="text-xs text-zinc-500">{ultimoBackup ? (ultimoBackup.descripcion || ultimoBackup.tipo) : 'Genera tu primer backup'}</div>
                  </div>
                </div>
              </LabPanel>

              <LabPanel title="Usuarios activos">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#6ea6ff]/15 text-[#6ea6ff]"><Users size={20} /></div>
                  <div>
                    <div className="text-lg font-bold text-white">{usuariosActivos.length}</div>
                    <div className="text-xs text-zinc-500">Usuarios conectados al ERP</div>
                  </div>
                </div>
              </LabPanel>

              <LabPanel title="Conexión SSL">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#4ade95]/15 text-[#4ade95]"><SSLIcon size={20} /></div>
                  <div>
                    <div className="text-sm font-bold text-[#4ade95]">Activa</div>
                    <div className="text-xs text-zinc-500">Certificado gestionado por el hosting</div>
                  </div>
                </div>
              </LabPanel>

              <LabPanel title="Espacio usado">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffab52]/15 text-[#ffab52]"><HardDrive size={20} /></div>
                  <div>
                    <div className="text-sm font-bold text-white">Sin medición conectada</div>
                    <div className="text-xs text-zinc-500">Ver almacenamiento del proveedor</div>
                  </div>
                </div>
              </LabPanel>
            </div>
          </div>
        )}

        {tab === 'backups' && (
          <div className="grid gap-4 xl:grid-cols-3">
            <LabPanel title="Copias de seguridad">
              <p className="text-xs text-zinc-500">Genera una copia completa de todas las tablas en formato JSON, o exporta una tabla concreta en CSV desde el registro de puntos de restauración.</p>
              <button onClick={backupCompleto} disabled={exporting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c81f2a] py-2.5 text-xs font-bold text-white hover:bg-[#e2242f] disabled:opacity-50">
                <Download size={14} /> {exporting ? 'Generando...' : 'Backup completo (JSON)'}
              </button>
            </LabPanel>

            <LabPanel title="Puntos de restauración">
              <div className="space-y-2">
                {backups.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs">
                    <div>
                      <div className="font-bold text-zinc-200">{new Date(b.created_at).toLocaleString('es-ES')}</div>
                      <div className="text-zinc-600">{b.descripcion || b.tipo}</div>
                    </div>
                    <LabBadge tone="green">Completa</LabBadge>
                  </div>
                ))}
                {backups.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin puntos de restauración todavía.</div>}
              </div>
            </LabPanel>

            <LabPanel title="Almacenamiento en la nube">
              <div className="space-y-2">
                {['Google Drive', 'Dropbox', 'Amazon S3'].map((provider) => (
                  <div key={provider} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs">
                    <span className="font-semibold text-zinc-300">{provider}</span>
                    <LabBadge tone="zinc">No conectado</LabBadge>
                  </div>
                ))}
              </div>
            </LabPanel>

            <LabPanel title="Registro de actividad" action={<Link href="/auditoria" className="flex items-center gap-1 text-xs font-bold text-[#ff5468] hover:text-[#ff7a86]">Ver completo <ExternalLink size={12} /></Link>}>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs">
                    <div className="min-w-0">
                      <div className="truncate font-bold text-zinc-200">{log.accion}</div>
                      <div className="truncate text-zinc-600">{log.modulo || 'Sistema'}</div>
                    </div>
                    <span className="shrink-0 text-[10px] text-zinc-600">{new Date(log.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                ))}
                {logs.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin eventos registrados.</div>}
              </div>
            </LabPanel>

            <LabPanel title="Estado del servidor">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#4ade95]/15 text-[#4ade95]"><Server size={20} /></div>
                <div>
                  <div className="text-sm font-bold text-[#4ade95]">Base de datos operativa</div>
                  <div className="text-xs text-zinc-500">Todas las consultas responden con normalidad</div>
                </div>
              </div>
              <dl className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Expedientes</dt><dd className="font-bold text-zinc-200">{overview?.expedientes ?? '—'}</dd></div>
                <div className="flex justify-between border-b border-white/[0.06] pb-2"><dt className="text-zinc-600">Facturas</dt><dd className="font-bold text-zinc-200">{overview?.facturas ?? '—'}</dd></div>
                <div className="flex justify-between pb-1"><dt className="text-zinc-600">Vehículos</dt><dd className="font-bold text-zinc-200">{overview?.vehiculos ?? '—'}</dd></div>
              </dl>
            </LabPanel>
          </div>
        )}
      </div>

      <FormModal open={editOpen} onClose={() => setEditOpen(false)} title="Configuración de la empresa">
        <ConfigEmpresaForm />
      </FormModal>
    </LabShell>
  )
}
