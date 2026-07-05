'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Download, FileArchive, FileText, FolderSearch, RefreshCw, Search, Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { ARCHIVO_CATEGORIAS, type ArchivoGlobal } from '@/types/archivosGlobal'
import { eliminarArchivoGlobal, filtrarArchivos, formatBytes, getArchivosGlobales } from '@/lib/services/archivosGlobal'

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

export default function ArchivosPage() {
  const [archivos, setArchivos] = useState<ArchivoGlobal[]>([])
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('TODAS')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await getArchivosGlobales()
        setArchivos(data as ArchivoGlobal[])
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar los archivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => filtrarArchivos(archivos, query, categoria), [archivos, query, categoria])

  const stats = useMemo(() => {
    const totalBytes = archivos.reduce((acc, item) => acc + Number(item.tamano_bytes || 0), 0)
    const ori = archivos.filter((item) => item.categoria === 'ORI').length
    const mod = archivos.filter((item) => item.categoria === 'MOD').length
    const eeprom = archivos.filter((item) => item.categoria === 'EEPROM').length
    return { totalBytes, ori, mod, eeprom }
  }, [archivos])

  async function deleteFile(archivo: ArchivoGlobal) {
    if (!confirm(`¿Eliminar definitivamente el archivo ${archivo.nombre}?`)) return
    setDeleting(archivo.id)
    try {
      await eliminarArchivoGlobal(archivo)
      toast.success('Archivo eliminado')
      await load()
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo eliminar el archivo')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-red-400">
            <FolderSearch size={14} /> Biblioteca de archivos
          </div>
          <h2 className="text-3xl font-black tracking-tight">Archivos técnicos</h2>
          <p className="mt-1 text-zinc-500">Busca ORI, MOD, EEPROM, FLASH, fotos y documentos en todos los expedientes.</p>
        </div>
        <button onClick={load} className="btn btn-dark inline-flex items-center justify-center gap-2">
          <RefreshCw size={18} /> Actualizar
        </button>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_220px_180px_180px_180px]">
        <div className="card flex items-center gap-3 p-4">
          <Search className="text-zinc-500" size={20} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por archivo, matrícula, VIN, ECU, HW, SW, cliente u OT..."
            className="w-full border-0 bg-transparent p-0"
          />
        </div>

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="card border-0 p-4 font-bold text-white">
          {ARCHIVO_CATEGORIAS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Archivos</p><p className="mt-1 text-2xl font-black">{archivos.length}</p></div>
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Resultados</p><p className="mt-1 text-2xl font-black">{filtered.length}</p></div>
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tamaño</p><p className="mt-1 text-2xl font-black">{formatBytes(stats.totalBytes)}</p></div>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">ORI</p><p className="mt-1 text-2xl font-black text-emerald-300">{stats.ori}</p></div>
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">MOD</p><p className="mt-1 text-2xl font-black text-red-300">{stats.mod}</p></div>
        <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-zinc-500">EEPROM</p><p className="mt-1 text-2xl font-black text-blue-300">{stats.eeprom}</p></div>
      </div>

      {loading ? (
        <div className="card p-8 text-zinc-500">Cargando biblioteca de archivos...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-zinc-500">No hay archivos que coincidan con la búsqueda.</div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((archivo) => (
            <div key={archivo.id} className="card p-5 transition hover:-translate-y-0.5 hover:border-red-500/35">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-red-400">
                    <FileArchive size={14} /> {archivo.categoria || 'OTRO'} · {formatBytes(archivo.tamano_bytes)}
                  </div>
                  <h3 className="mt-2 line-clamp-1 text-xl font-black">{archivo.nombre}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{formatDate(archivo.created_at)}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600/15 text-red-400"><FileText size={24} /></div>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-2xl bg-black/20 p-3">
                  <div className="text-zinc-500">Expediente</div>
                  <div className="mt-1 font-bold text-zinc-200">{archivo.expediente?.numero_ot || 'OT —'} · {archivo.expediente?.tipo_trabajo || 'Trabajo —'}</div>
                </div>
                <div className="rounded-2xl bg-black/20 p-3">
                  <div className="text-zinc-500">Vehículo / cliente</div>
                  <div className="mt-1 font-bold text-zinc-200">
                    {[archivo.vehiculo?.marca, archivo.vehiculo?.modelo, archivo.vehiculo?.matricula].filter(Boolean).join(' ') || 'Vehículo —'} · {archivo.cliente?.nombre || 'Cliente —'}
                  </div>
                </div>
                <div className="rounded-2xl bg-black/20 p-3">
                  <div className="text-zinc-500">ECU / HW / SW / VIN</div>
                  <div className="mt-1 truncate font-bold text-zinc-200">{archivo.ecu || 'ECU —'} · {archivo.hw || 'HW —'} · {archivo.sw || 'SW —'} · {archivo.vin || 'VIN —'}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {archivo.expediente_id && (
                  <Link href={`/expedientes/${archivo.expediente_id}/archivos`} className="btn btn-red inline-flex items-center gap-2 text-sm">
                    Abrir OT
                  </Link>
                )}
                {archivo.url_publica && (
                  <a href={archivo.url_publica} target="_blank" rel="noreferrer" className="btn btn-dark inline-flex items-center gap-2 text-sm">
                    <Download size={15} /> Descargar
                  </a>
                )}
                <button disabled={deleting === archivo.id} onClick={() => deleteFile(archivo)} className="btn btn-dark inline-flex items-center gap-2 text-sm text-red-300 disabled:opacity-50">
                  <Trash2 size={15} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
