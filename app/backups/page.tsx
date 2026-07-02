'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import {
  BACKUP_TABLES,
  QUICK_EXPORTS,
  exportFullJson,
  exportTable,
  getBackupRegistros,
} from '@/lib/services/backups'
import type { BackupRegistro, BackupTableName } from '@/types/backups'
import {
  Archive,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  HardDriveDownload,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default function BackupsPage() {
  const [registros, setRegistros] = useState<BackupRegistro[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState<string | null>(null)
  const [selected, setSelected] = useState<BackupTableName[]>(BACKUP_TABLES.map(t => t.name))
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setRegistros(await getBackupRegistros())
    } catch (err: any) {
      setError(err?.message || 'No se pudo cargar el historial de copias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const lastBackup = registros[0]
  const totalRows = useMemo(() => registros.reduce((acc, item) => acc + Number(item.total_registros || 0), 0), [registros])

  async function runQuickExport(table: BackupTableName, format: 'csv' | 'json', label: string) {
    setWorking(`${table}-${format}`)
    setError(null)
    setSuccess(null)
    try {
      const file = await exportTable(table, format)
      downloadFile(file.filename, file.content, file.mimeType)
      setSuccess(`${label} exportado correctamente (${file.total} registros).`)
      await load()
    } catch (err: any) {
      setError(err?.message || `No se pudo exportar ${label}`)
    } finally {
      setWorking(null)
    }
  }

  async function runFullExport() {
    setWorking('full-json')
    setError(null)
    setSuccess(null)
    try {
      const file = await exportFullJson(selected)
      downloadFile(file.filename, file.content, file.mimeType)
      setSuccess(`Copia completa descargada (${file.total} registros, ${file.tablas.length} tablas).`)
      await load()
    } catch (err: any) {
      setError(err?.message || 'No se pudo generar la copia completa')
    } finally {
      setWorking(null)
    }
  }

  function toggleTable(table: BackupTableName) {
    setSelected((current) =>
      current.includes(table) ? current.filter(t => t !== table) : [...current, table]
    )
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-sm font-bold uppercase tracking-wider">Última copia</span>
              <Archive size={20} />
            </div>
            <div className="text-2xl font-black mt-3">{lastBackup ? formatDate(lastBackup.created_at) : 'Sin copias'}</div>
            <p className="text-zinc-500 text-sm mt-1">Historial de exportaciones</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-sm font-bold uppercase tracking-wider">Copias</span>
              <Database size={20} />
            </div>
            <div className="text-3xl font-black mt-3">{registros.length}</div>
            <p className="text-zinc-500 text-sm mt-1">Registros guardados</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-sm font-bold uppercase tracking-wider">Registros</span>
              <FileJson size={20} />
            </div>
            <div className="text-3xl font-black mt-3">{totalRows}</div>
            <p className="text-zinc-500 text-sm mt-1">Total exportado</p>
          </div>

          <div className="card p-5 border border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-sm font-bold uppercase tracking-wider">Recomendación</span>
              <ShieldCheck size={20} />
            </div>
            <div className="text-xl font-black mt-3">Copia semanal</div>
            <p className="text-zinc-500 text-sm mt-1">Descarga JSON completo y CSV de tablas clave.</p>
          </div>
        </div>

        {error && <div className="card p-4 border border-red-500/30 text-red-300">{error}</div>}
        {success && <div className="card p-4 border border-emerald-500/30 text-emerald-300">{success}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 card p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black">Exportaciones rápidas</h2>
                <p className="text-zinc-500 mt-1">Descarga CSV de las tablas principales para revisar en Excel o guardar copia externa.</p>
              </div>
              <button onClick={load} className="btn btn-dark flex items-center gap-2">
                <RefreshCw size={18} /> Actualizar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {QUICK_EXPORTS.map((item) => (
                <div key={item.key} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-red-400 font-black uppercase tracking-wider text-xs">
                        <FileSpreadsheet size={16} /> CSV
                      </div>
                      <h3 className="text-xl font-black mt-2">{item.label}</h3>
                      <p className="text-zinc-500 text-sm mt-1">Exportación directa de la tabla {item.table}.</p>
                    </div>
                    <button
                      onClick={() => runQuickExport(item.table, item.format, item.label)}
                      disabled={!!working}
                      className="btn btn-red flex items-center gap-2 disabled:opacity-50"
                    >
                      {working === `${item.table}-${item.format}` ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDriveDownload className="text-red-400" />
              <div>
                <h2 className="text-2xl font-black">Copia completa JSON</h2>
                <p className="text-zinc-500 text-sm">Selecciona las tablas que quieres incluir.</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[430px] overflow-auto pr-1">
              {BACKUP_TABLES.map((table) => (
                <label key={table.name} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 cursor-pointer hover:bg-white/[0.06]">
                  <span>
                    <span className="font-bold block">{table.label}</span>
                    <span className="text-xs text-zinc-500">{table.name}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={selected.includes(table.name)}
                    onChange={() => toggleTable(table.name)}
                    className="h-5 w-5 accent-red-600"
                  />
                </label>
              ))}
            </div>

            <button
              onClick={runFullExport}
              disabled={!!working || selected.length === 0}
              className="btn btn-red w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {working === 'full-json' ? <Loader2 className="animate-spin" size={18} /> : <FileJson size={18} />}
              Descargar copia completa
            </button>
          </section>
        </div>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black">Historial de copias</h2>
              <p className="text-zinc-500 mt-1">Registro de exportaciones realizadas desde Autokeys Core.</p>
            </div>
          </div>

          {loading ? (
            <div className="text-zinc-500 flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Cargando historial...</div>
          ) : registros.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">Todavía no hay copias registradas.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-white/10">
                  <tr>
                    <th className="py-3 pr-4">Fecha</th>
                    <th className="py-3 pr-4">Tipo</th>
                    <th className="py-3 pr-4">Formato</th>
                    <th className="py-3 pr-4">Tablas</th>
                    <th className="py-3 pr-4">Registros</th>
                    <th className="py-3 pr-4">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {registros.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.03]">
                      <td className="py-4 pr-4 whitespace-nowrap">{formatDate(item.created_at)}</td>
                      <td className="py-4 pr-4 font-bold">{item.tipo}</td>
                      <td className="py-4 pr-4 uppercase text-red-300 font-bold">{item.formato}</td>
                      <td className="py-4 pr-4 text-zinc-400 max-w-[420px] truncate">{(item.tablas || []).join(', ') || '—'}</td>
                      <td className="py-4 pr-4">{item.total_registros || 0}</td>
                      <td className="py-4 pr-4 text-zinc-400">{item.creado_por || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
