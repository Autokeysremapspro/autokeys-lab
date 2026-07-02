'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Building2,
  FileText,
  Users,
  ShieldCheck,
  Mail,
  Database,
  Bell,
  Palette,
  Package,
  UploadCloud,
  Wrench,
  ClipboardList,
  Activity,
  LockKeyhole,
  HardDriveDownload,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import ConfigEmpresaForm from '@/components/ConfigEmpresaForm'
import { getAdminOverview, getAuditLogs, type AdminOverview, type AuditLog } from '@/lib/services/admin'

type TabKey = 'empresa' | 'documentos' | 'usuarios' | 'permisos' | 'email' | 'logs' | 'sistema'

const tabs: Array<{ key: TabKey; label: string; icon: any; description: string }> = [
  { key: 'empresa', label: 'Empresa', icon: Building2, description: 'Datos fiscales e imagen corporativa' },
  { key: 'documentos', label: 'Documentos', icon: FileText, description: 'Facturas, OT, albaranes y garantías' },
  { key: 'usuarios', label: 'Usuarios', icon: Users, description: 'Cuentas, estados y roles' },
  { key: 'permisos', label: 'Permisos', icon: ShieldCheck, description: 'Accesos por perfil de trabajo' },
  { key: 'email', label: 'Email', icon: Mail, description: 'Correos y notificaciones' },
  { key: 'logs', label: 'Logs', icon: Activity, description: 'Actividad y auditoría del sistema' },
  { key: 'sistema', label: 'Sistema', icon: Database, description: 'Backups, mantenimiento y estado' },
]

const roleMatrix = [
  { permiso: 'Dashboard', admin: true, laboratorio: true, administracion: true, distribuidor: false },
  { permiso: 'Clientes', admin: true, laboratorio: true, administracion: true, distribuidor: false },
  { permiso: 'Vehículos', admin: true, laboratorio: true, administracion: true, distribuidor: false },
  { permiso: 'Expedientes', admin: true, laboratorio: true, administracion: true, distribuidor: false },
  { permiso: 'BIN / EEPROM / ISN / PIN', admin: true, laboratorio: true, administracion: false, distribuidor: false },
  { permiso: 'Facturación', admin: true, laboratorio: false, administracion: true, distribuidor: false },
  { permiso: 'Stock', admin: true, laboratorio: true, administracion: false, distribuidor: false },
  { permiso: 'File Service', admin: true, laboratorio: true, administracion: false, distribuidor: true },
  { permiso: 'Usuarios', admin: true, laboratorio: false, administracion: false, distribuidor: false },
  { permiso: 'Configuración', admin: true, laboratorio: false, administracion: false, distribuidor: false },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl ${className}`}>{children}</div>
}

function MiniStat({ label, value, icon: Icon, danger = false }: { label: string; value: number | string; icon: any; danger?: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className={`mt-2 text-3xl font-black ${danger ? 'text-red-400' : 'text-white'}`}>{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${danger ? 'bg-red-500/15 text-red-300' : 'bg-white/5 text-slate-300'}`}>
          <Icon size={22} />
        </div>
      </div>
    </Card>
  )
}

function PermissionCell({ enabled }: { enabled: boolean }) {
  return (
    <td className="px-3 py-3 text-center">
      {enabled ? <CheckCircle2 className="mx-auto text-emerald-400" size={18} /> : <LockKeyhole className="mx-auto text-slate-600" size={18} />}
    </td>
  )
}

export default function AdminCenter() {
  const [active, setActive] = useState<TabKey>('empresa')
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    getAdminOverview().then(setOverview)
    getAuditLogs(20).then(setLogs)
  }, [])

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <Card>
          <h2 className="text-lg font-black text-white">Administración</h2>
          <p className="mt-1 text-sm text-slate-400">Centro de control del ERP Autokeys Core.</p>
        </Card>

        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = active === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isActive ? 'border-red-500/60 bg-red-600 text-white shadow-lg shadow-red-950/30' : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={20} className={isActive ? 'text-white' : 'text-red-400'} />
                  <div>
                    <p className="font-bold">{tab.label}</p>
                    <p className={`mt-1 text-xs ${isActive ? 'text-red-100' : 'text-slate-500'}`}>{tab.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Usuarios" value={overview?.usuarios ?? '—'} icon={Users} />
          <MiniStat label="Usuarios activos" value={overview?.usuariosActivos ?? '—'} icon={ShieldCheck} />
          <MiniStat label="Clientes" value={overview?.clientes ?? '—'} icon={Building2} />
          <MiniStat label="Stock bajo" value={overview?.stockBajo ?? '—'} icon={AlertTriangle} danger={(overview?.stockBajo || 0) > 0} />
        </div>

        {active === 'empresa' && <ConfigEmpresaForm />}

        {active === 'documentos' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-xl font-black text-white">Documentos</h2>
              <p className="mt-2 text-sm text-slate-400">Control de facturas, presupuestos, albaranes, tickets y órdenes de trabajo.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {['Facturas', 'Presupuestos', 'Albaranes', 'Tickets', 'OT'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <FileText className="text-red-400" size={22} />
                    <p className="mt-3 font-bold text-white">{item}</p>
                    <p className="mt-1 text-xs text-slate-500">Plantilla y numeración configurables.</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="font-black text-white">Pendiente de producción</h3>
              <p className="mt-2 text-sm text-slate-400">
                En los próximos sprints esta sección controlará diseño PDF, logos, textos legales, numeración avanzada y envío por email.
              </p>
            </Card>
          </div>
        )}

        {active === 'usuarios' && (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-xl font-black text-white">Usuarios y roles</h2>
                  <p className="mt-2 text-sm text-slate-400">Alta, bloqueo, edición, contraseña y rol de cada usuario.</p>
                </div>
                <Link href="/usuarios" className="rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-red-500">
                  Abrir gestión de usuarios
                </Link>
              </div>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {['admin', 'laboratorio', 'administracion', 'distribuidor'].map((role) => (
                <Card key={role}>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Rol</p>
                  <h3 className="mt-2 text-lg font-black capitalize text-white">{role}</h3>
                  <p className="mt-2 text-sm text-slate-500">Permisos base del perfil {role}.</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {active === 'permisos' && (
          <Card>
            <h2 className="text-xl font-black text-white">Matriz de permisos</h2>
            <p className="mt-2 text-sm text-slate-400">Base de permisos por rol. Más adelante se podrá personalizar usuario por usuario.</p>
            <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Permiso</th>
                    <th className="px-3 py-3 text-center">Admin</th>
                    <th className="px-3 py-3 text-center">Laboratorio</th>
                    <th className="px-3 py-3 text-center">Administración</th>
                    <th className="px-3 py-3 text-center">Distribuidor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {roleMatrix.map((row) => (
                    <tr key={row.permiso} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-semibold text-white">{row.permiso}</td>
                      <PermissionCell enabled={row.admin} />
                      <PermissionCell enabled={row.laboratorio} />
                      <PermissionCell enabled={row.administracion} />
                      <PermissionCell enabled={row.distribuidor} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {active === 'email' && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="text-xl font-black text-white">Email y notificaciones</h2>
              <p className="mt-2 text-sm text-slate-400">Preparado para SMTP, avisos de OT terminada, facturas y presupuestos.</p>
              <div className="mt-5 space-y-3">
                {['Enviar factura por email', 'Avisar OT terminada', 'Avisar stock bajo', 'Avisar File Service pendiente'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3">
                    <span className="font-semibold text-white">{item}</span>
                    <Bell size={18} className="text-red-400" />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-black text-white">Estado</h3>
              <p className="mt-2 text-sm text-slate-400">SMTP todavía no está conectado. Esta pantalla deja la estructura preparada para el sprint de emails.</p>
            </Card>
          </div>
        )}

        {active === 'logs' && (
          <Card>
            <h2 className="text-xl font-black text-white">Logs de actividad</h2>
            <p className="mt-2 text-sm text-slate-400">Registro inicial de auditoría. Se irá alimentando desde usuarios, facturas, OT, stock y archivos.</p>
            <div className="mt-5 space-y-3">
              {logs.length === 0 && <p className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-500">Aún no hay eventos registrados.</p>}
              {logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <div>
                      <p className="font-bold text-white">{log.accion}</p>
                      <p className="text-sm text-slate-400">{log.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div className="text-left text-xs text-slate-500 md:text-right">
                      <p>{log.modulo || 'Sistema'}</p>
                      <p>{new Date(log.created_at).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {active === 'sistema' && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <h2 className="text-xl font-black text-white">Sistema y mantenimiento</h2>
              <p className="mt-2 text-sm text-slate-400">Herramientas internas para mantener Autokeys Core limpio y controlado.</p>
              <div className="mt-5 grid gap-3">
                {[
                  ['Backup manual', HardDriveDownload],
                  ['Estado de base de datos', Database],
                  ['Mantenimiento de stock', Package],
                  ['File Service', UploadCloud],
                  ['Apariencia', Palette],
                  ['Procesos técnicos', Wrench],
                  ['Plantillas de OT', ClipboardList],
                ].map(([label, Icon]: any) => (
                  <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3">
                    <span className="font-semibold text-white">{label}</span>
                    <Icon size={18} className="text-red-400" />
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-black text-white">Resumen del sistema</h3>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">Expedientes</span><strong className="text-white">{overview?.expedientes ?? '—'}</strong></div>
                <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">Facturas</span><strong className="text-white">{overview?.facturas ?? '—'}</strong></div>
                <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">Vehículos</span><strong className="text-white">{overview?.vehiculos ?? '—'}</strong></div>
                <div className="flex justify-between"><span className="text-slate-400">File Service pendiente</span><strong className="text-white">{overview?.fileServicePendiente ?? '—'}</strong></div>
              </div>
            </Card>
          </div>
        )}
      </section>
    </div>
  )
}
