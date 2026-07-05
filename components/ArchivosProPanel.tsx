'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, FileArchive, FileText, Loader2, Search, Trash2, UploadCloud } from 'lucide-react'
import {
  eliminarArchivoPro,
  formatBytes,
  listarArchivosPro,
  subirArchivoPro,
} from '@/lib/services/archivosPro'
import type { ArchivoProCategoria, ExpedienteArchivoPro } from '@/types/archivosPro'
import { ARCHIVO_PRO_CATEGORIAS } from '@/types/archivosPro'

type Props = {
  expedienteId: string
}

export default function ArchivosProPanel({ expedienteId }: Props) {
  const [archivos, setArchivos] = useState<ExpedienteArchivoPro[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState<ArchivoProCategoria>('ORI')
  const [descripcion, setDescripcion] = useState('')
  const [notas, setNotas] = useState('')
  const [ecu, setEcu] = useState('')
  const [hw, setHw] = useState('')
  const [sw, setSw] = useState('')
  const [vin, setVin] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    load()
  }, [expedienteId])

  async function load() {
    setLoading(true)
    try {
      setArchivos(await listarArchivosPro(expedienteId))
    } catch (err: any) {
      toast.error(err?.message || 'No se pudieron cargar los archivos')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return archivos
    return archivos.filter((a) =>
      [a.nombre, a.categoria, a.ecu, a.hw, a.sw, a.vin, a.descripcion, a.notas]
        .some((value) => (value || '').toLowerCase().includes(q))
    )
  }, [archivos, query])

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        await subirArchivoPro(file, {
          expediente_id: expedienteId,
          categoria,
          descripcion,
          notas,
          ecu,
          hw,
          sw,
          vin,
        })
      }
      toast.success('Archivo(s) subido(s)')
      setDescripcion('')
      setNotas('')
      if (fileRef.current) fileRef.current.value = ''
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  async function remove(file: ExpedienteArchivoPro) {
    if (!confirm(`¿Eliminar ${file.nombre}?`)) return
    try {
      await eliminarArchivoPro(file)
      toast.success('Archivo eliminado')
      await load()
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo eliminar el archivo')
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-red-400">
              <FileArchive size={14} /> Archivos Pro
            </div>
            <h3 className="mt-2 text-2xl font-black">Gestor técnico de archivos</h3>
            <p className="mt-1 text-sm text-zinc-500">ORI, MOD, FLASH, EEPROM, MICRO, OTP, PDF, fotos y notas técnicas.</p>
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-red inline-flex items-center gap-2 disabled:opacity-50">
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
            Subir / arrastrar
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFiles(e.dataTransfer.files)
          }}
          className="mt-5 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-zinc-400 hover:border-red-500/40"
        >
          Arrastra aquí BIN, EEPROM, FLASH, PDF o fotos del expediente.
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">Categoría</span>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value as ArchivoProCategoria)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              {ARCHIVO_PRO_CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </label>
          <Input label="ECU" value={ecu} onChange={setEcu} placeholder="MD1CS003" />
          <Input label="HW" value={hw} onChange={setHw} placeholder="0281..." />
          <Input label="SW" value={sw} onChange={setSw} placeholder="1037..." />
          <Input label="VIN" value={vin} onChange={(v) => setVin(v.toUpperCase())} placeholder="VF1..." />
          <Input label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Original leído con Flex" className="md:col-span-2" />
          <Input label="Notas" value={notas} onChange={setNotas} placeholder="Checksum OK, backup completo..." />
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <Search size={18} className="text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, ECU, HW, SW, VIN, categoría..." className="w-full border-0 bg-transparent p-0" />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500"><Loader2 className="animate-spin" size={18} /> Cargando archivos...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-zinc-500">Todavía no hay archivos técnicos.</div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((file) => (
              <div key={file.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">{file.categoria}</span>
                      <span className="text-xs text-zinc-500">{formatBytes(file.tamano_bytes)}</span>
                    </div>
                    <h4 className="mt-2 truncate text-lg font-black">{file.nombre}</h4>
                    <p className="mt-1 text-sm text-zinc-500">{file.descripcion || file.notas || 'Sin descripción'}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {[file.ecu, file.hw, file.sw, file.vin].filter(Boolean).join(' · ') || 'Sin metadatos técnicos'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {file.url_publica && (
                      <a href={file.url_publica} target="_blank" rel="noreferrer" className="btn btn-dark inline-flex items-center gap-2 text-sm">
                        <Download size={15} /> Descargar
                      </a>
                    )}
                    <button onClick={() => remove(file)} className="btn btn-dark inline-flex items-center gap-2 text-sm text-red-300">
                      <Trash2 size={15} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, className = '' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3" />
    </label>
  )
}
