'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArchivoService } from '@/lib/services/archivos'
import type { ArchivoExpediente } from '@/types/autokeys'
import { Download, FileArchive, FileCode2, FileText, Image as ImageIcon, Loader2, Plus, Trash2, UploadCloud } from 'lucide-react'

type Mode = 'archivos' | 'fotos'

type Props = {
  expedienteId: string
  mode: Mode
  title: string
  description: string
  icon?: React.ReactNode
  onEvent?: (evento: string, descripcion?: string) => Promise<void> | void
}

const fileTypes = [
  { value: 'original', label: 'Original / ORI' },
  { value: 'modificado', label: 'Modificado' },
  { value: 'flash', label: 'Flash' },
  { value: 'eeprom', label: 'EEPROM' },
  { value: 'full_backup', label: 'Full backup' },
  { value: 'dump', label: 'Dump' },
  { value: 'pdf', label: 'PDF / Documento' },
  { value: 'otro_archivo', label: 'Otro archivo' },
]

const photoTypes = [
  { value: 'foto_vehiculo', label: 'Foto vehículo' },
  { value: 'foto_matricula', label: 'Foto matrícula' },
  { value: 'foto_vin', label: 'Foto VIN' },
  { value: 'foto_ecu', label: 'Foto ECU' },
  { value: 'foto_etiqueta', label: 'Foto etiqueta' },
  { value: 'foto_cuadro', label: 'Foto cuadro' },
  { value: 'foto_llave', label: 'Foto llave' },
  { value: 'foto_averia', label: 'Foto avería' },
]

function humanSize(bytes?: number | null) {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-ES')
}

function iconFor(file: ArchivoExpediente) {
  if (file.tipo?.startsWith('foto_') || file.mime_type?.startsWith('image/')) return <ImageIcon className="text-emerald-300" />
  if (file.nombre_archivo?.toLowerCase().endsWith('.bin')) return <FileCode2 className="text-red-300" />
  if (file.nombre_archivo?.toLowerCase().endsWith('.zip') || file.nombre_archivo?.toLowerCase().endsWith('.rar')) return <FileArchive className="text-yellow-300" />
  return <FileText className="text-zinc-300" />
}

export default function ExpedienteFilesPanel({ expedienteId, mode, title, description, icon, onEvent }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const options = mode === 'fotos' ? photoTypes : fileTypes
  const [items, setItems] = useState<ArchivoExpediente[]>([])
  const [tipo, setTipo] = useState(options[0].value)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const accept = useMemo(() => mode === 'fotos' ? 'image/*' : '.bin,.ori,.mod,.frf,.sgo,.hex,.zip,.rar,.7z,.pdf,.txt,.csv,.xlsx,.jpg,.jpeg,.png,.webp,application/octet-stream', [mode])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await ArchivoService.list(expedienteId, mode)
      setItems(data)
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los archivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [expedienteId, mode])

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setError('')
    setOk('')
    try {
      for (const file of Array.from(files)) {
        await ArchivoService.upload({ expedienteId, file, tipo, notas })
        await onEvent?.(mode === 'fotos' ? 'Foto añadida' : 'Archivo añadido', `${file.name} · ${tipo}`)
      }
      setNotas('')
      setOk(files.length === 1 ? 'Archivo subido correctamente' : `${files.length} archivos subidos correctamente`)
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo subir el archivo')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove(file: ArchivoExpediente) {
    if (!confirm(`¿Eliminar ${file.nombre_archivo}?`)) return
    setUploading(true)
    setError('')
    setOk('')
    try {
      await ArchivoService.remove(file)
      await onEvent?.(mode === 'fotos' ? 'Foto eliminada' : 'Archivo eliminado', file.nombre_archivo)
      setOk('Eliminado correctamente')
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid xl:grid-cols-3 gap-5">
      <div className="card p-6 xl:col-span-1">
        <h3 className="text-2xl font-black mb-2 flex items-center gap-2">{icon || <UploadCloud className="text-red-300" />} {title}</h3>
        <p className="text-zinc-500 mb-5">{description}</p>

        <div className="space-y-4">
          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase text-zinc-400">Categoría</span>
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label className="space-y-2 block">
            <span className="text-xs font-black uppercase text-zinc-400">Notas</span>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej: lectura con Flex en bench, foto etiqueta ECU..." rows={4} />
          </label>

          <input ref={inputRef} type="file" multiple accept={accept} className="hidden" onChange={e => handleFiles(e.target.files)} />
          <button disabled={uploading} onClick={() => inputRef.current?.click()} className="btn btn-red w-full inline-flex items-center justify-center gap-2">
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {uploading ? 'Subiendo...' : mode === 'fotos' ? 'Añadir fotos' : 'Añadir archivos'}
          </button>
        </div>

        {(error || ok) && <div className={`mt-4 rounded-2xl border p-3 text-sm ${error ? 'border-red-500/30 text-red-300 bg-red-500/10' : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10'}`}>{error || ok}</div>}
      </div>

      <div className="card p-6 xl:col-span-2">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-2xl font-black">{mode === 'fotos' ? 'Galería' : 'Repositorio técnico'}</h3>
            <p className="text-zinc-500 text-sm">{items.length} elementos asociados a esta OT.</p>
          </div>
          <button onClick={load} className="btn btn-dark" disabled={loading || uploading}>Actualizar</button>
        </div>

        {loading ? <div className="text-zinc-500">Cargando...</div> : (
          <div className="grid md:grid-cols-2 gap-3">
            {items.map(file => (
              <div key={file.id} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4 hover:border-red-500/30 transition">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{iconFor(file)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black truncate" title={file.nombre_archivo}>{file.nombre_archivo}</p>
                    <p className="text-xs text-zinc-500 mt-1">{file.tipo || '-'} · {humanSize(file.size_bytes)} · {formatDate(file.created_at)}</p>
                    {file.notas && <p className="text-sm text-zinc-400 mt-2 line-clamp-2">{file.notas}</p>}
                  </div>
                </div>

                {mode === 'fotos' && file.url && (
                  <a href={file.url} target="_blank" className="block mt-4 rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.url} alt={file.nombre_archivo} className="w-full h-44 object-cover" />
                  </a>
                )}

                <div className="flex gap-2 mt-4">
                  {file.url && <a href={file.url} target="_blank" className="btn btn-dark flex-1 inline-flex items-center justify-center gap-2"><Download size={16} /> Abrir</a>}
                  <button onClick={() => remove(file)} disabled={uploading} className="btn btn-dark text-red-300 inline-flex items-center justify-center gap-2"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {!items.length && <div className="md:col-span-2 rounded-2xl border border-dashed border-white/10 bg-[#0B1220] p-8 text-center text-zinc-500">Todavía no hay elementos subidos en esta sección.</div>}
          </div>
        )}
      </div>
    </div>
  )
}
