'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  UploadCloud,
} from 'lucide-react'
import { ArchivoService } from '@/lib/services/archivos'
import { ExpedienteService } from '@/lib/services/expedientes'
import { supabase } from '@/lib/supabase'
import type { Expediente, Vehiculo, Cliente } from '@/types/autokeys'

type Props = {
  onBack?: () => void
}

type ExpedienteMobile = Expediente & {
  cliente?: Cliente | null
  vehiculo?: Vehiculo | null
}

const categorias = [
  { value: 'foto_vehiculo', label: 'Vehículo' },
  { value: 'foto_matricula', label: 'Matrícula' },
  { value: 'foto_vin', label: 'VIN / Bastidor' },
  { value: 'foto_ecu', label: 'ECU' },
  { value: 'foto_etiqueta', label: 'Etiqueta ECU' },
  { value: 'foto_cuadro', label: 'Cuadro' },
  { value: 'foto_llave', label: 'Llave' },
  { value: 'foto_averia', label: 'Daño / Avería' },
  { value: 'foto_otro', label: 'Otro' },
]

function titleFor(item: ExpedienteMobile) {
  return item.numero_ot || item.tipo_trabajo || 'Expediente'
}

function subtitleFor(item: ExpedienteMobile) {
  const vehiculo = [item.vehiculo?.marca, item.vehiculo?.modelo, item.vehiculo?.matricula].filter(Boolean).join(' ')
  const cliente = item.cliente?.nombre || 'Sin cliente'
  return [vehiculo || 'Sin vehículo', cliente].join(' · ')
}

async function attachRelations(expedientes: Expediente[]): Promise<ExpedienteMobile[]> {
  if (!expedientes.length) return []

  const clienteIds = Array.from(new Set(expedientes.map((e) => e.cliente_id).filter(Boolean))) as string[]
  const vehiculoIds = Array.from(new Set(expedientes.map((e) => e.vehiculo_id).filter(Boolean))) as string[]

  const [clientesRes, vehiculosRes] = await Promise.all([
    clienteIds.length ? supabase.from('clientes').select('*').in('id', clienteIds) : Promise.resolve({ data: [], error: null } as any),
    vehiculoIds.length ? supabase.from('vehiculos').select('*').in('id', vehiculoIds) : Promise.resolve({ data: [], error: null } as any),
  ])

  const error = clientesRes.error || vehiculosRes.error
  if (error) throw error

  const clientes = new Map<string, Cliente>(((clientesRes.data || []) as Cliente[]).map((c) => [c.id, c]))
  const vehiculos = new Map<string, Vehiculo>(((vehiculosRes.data || []) as Vehiculo[]).map((v) => [v.id, v]))

  return expedientes.map((e) => ({
    ...e,
    cliente: e.cliente_id ? clientes.get(e.cliente_id) || null : null,
    vehiculo: e.vehiculo_id ? vehiculos.get(e.vehiculo_id) || null : null,
  }))
}

export default function MobileCameraCapture({ onBack }: Props) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  const [query, setQuery] = useState('')
  const [items, setItems] = useState<ExpedienteMobile[]>([])
  const [selected, setSelected] = useState<ExpedienteMobile | null>(null)
  const [categoria, setCategoria] = useState(categorias[0].value)
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadLatest()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) search(query)
      if (query.trim().length === 0) loadLatest()
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  async function loadLatest() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('expedientes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15)

      if (error) throw error
      setItems(await attachRelations((data || []) as Expediente[]))
    } catch (error: any) {
      toast.error(error?.message || 'No se pudieron cargar las OT')
    } finally {
      setLoading(false)
    }
  }

  async function search(value: string) {
    const q = value.trim()
    setLoading(true)

    try {
      const [expRes, vehRes, cliRes] = await Promise.all([
        supabase
          .from('expedientes')
          .select('*')
          .or(`numero_ot.ilike.%${q}%,tipo_trabajo.ilike.%${q}%,estado.ilike.%${q}%,descripcion.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('vehiculos')
          .select('id')
          .or(`matricula.ilike.%${q}%,bastidor.ilike.%${q}%,marca.ilike.%${q}%,modelo.ilike.%${q}%,ecu.ilike.%${q}%`)
          .limit(20),
        supabase
          .from('clientes')
          .select('id')
          .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%,email.ilike.%${q}%`)
          .limit(20),
      ])

      if (expRes.error) throw expRes.error
      if (vehRes.error) throw vehRes.error
      if (cliRes.error) throw cliRes.error

      const byId = new Map<string, Expediente>()
      ;((expRes.data || []) as Expediente[]).forEach((e) => byId.set(e.id, e))

      const vehiculoIds = ((vehRes.data || []) as { id: string }[]).map((v) => v.id)
      if (vehiculoIds.length) {
        const { data, error } = await supabase
          .from('expedientes')
          .select('*')
          .in('vehiculo_id', vehiculoIds)
          .limit(20)
        if (error) throw error
        ;((data || []) as Expediente[]).forEach((e) => byId.set(e.id, e))
      }

      const clienteIds = ((cliRes.data || []) as { id: string }[]).map((c) => c.id)
      if (clienteIds.length) {
        const { data, error } = await supabase
          .from('expedientes')
          .select('*')
          .in('cliente_id', clienteIds)
          .limit(20)
        if (error) throw error
        ;((data || []) as Expediente[]).forEach((e) => byId.set(e.id, e))
      }

      setItems(await attachRelations(Array.from(byId.values())))
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo buscar')
    } finally {
      setLoading(false)
    }
  }

  const selectedText = useMemo(() => {
    if (!selected) return 'Selecciona una OT para guardar la foto.'
    return `${titleFor(selected)} · ${subtitleFor(selected)}`
  }, [selected])

  async function handleFiles(files: FileList | null) {
    if (!selected) {
      toast.error('Selecciona primero una OT')
      return
    }

    if (!files?.length) return

    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        await ArchivoService.upload({
          expedienteId: selected.id,
          file,
          tipo: categoria,
          notas: notas || `Subida desde móvil: ${categorias.find((c) => c.value === categoria)?.label || categoria}`,
        })

        await ExpedienteService.addHistory(
          selected.id,
          'Foto añadida desde móvil',
          `${file.name} · ${categorias.find((c) => c.value === categoria)?.label || categoria}`
        )
      }

      toast.success(files.length === 1 ? 'Foto subida' : `${files.length} fotos subidas`)
      setNotas('')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo subir la foto')
    } finally {
      setUploading(false)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="rounded-2xl border border-white/10 p-3 text-white">
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Autokeys Core</p>
              <h1 className="text-2xl font-black">Cámara de OT</h1>
            </div>
          </div>
          <Camera className="text-red-400" />
        </div>
      </header>

      <section className="mx-auto max-w-xl space-y-5 p-4 pb-28">
        <div className="rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-red-600/20 to-white/[0.03] p-5">
          <p className="text-sm text-red-100/70">Fotos directas al expediente</p>
          <h2 className="mt-1 text-3xl font-black">Vehículo, matrícula, VIN, ECU, etiqueta, cuadro y llaves.</h2>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <label className="text-sm font-bold text-slate-300">Buscar OT, matrícula, cliente o ECU</label>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 focus-within:border-red-500">
            <Search size={18} className="text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-0 bg-transparent p-0 text-white outline-none placeholder:text-slate-600"
              placeholder="Ej: OT-2026, 1234ABC, BMW..."
            />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-black">Expediente seleccionado</p>
            {selected && <CheckCircle2 className="text-emerald-300" size={20} />}
          </div>
          <p className={selected ? 'text-sm text-white' : 'text-sm text-slate-500'}>{selectedText}</p>
          {selected && (
            <Link href={`/expedientes/${selected.id}`} className="mt-3 inline-block text-sm font-black text-red-300">
              Abrir expediente →
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-3xl border border-white/10 p-5 text-slate-400"><Loader2 className="mr-2 inline animate-spin" /> Cargando OT...</div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-white/10 p-5 text-center text-slate-500">No hay expedientes.</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`block w-full rounded-3xl border p-4 text-left transition ${selected?.id === item.id ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-white/[0.04]'}`}
              >
                <div className="text-xs font-black uppercase tracking-[0.2em] text-red-400">{item.numero_ot || 'OT'}</div>
                <div className="mt-1 text-xl font-black">{item.tipo_trabajo || 'Trabajo sin tipo'}</div>
                <div className="text-sm text-slate-400">{subtitleFor(item)}</div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <label className="mb-3 block">
            <span className="mb-2 block text-sm font-bold text-slate-300">Categoría</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-red-500"
            >
              {categorias.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-300">Notas</span>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: etiqueta ECU sulfatada, VIN ilegible, cuadro con fallo..."
              className="h-24 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-red-500"
            />
          </label>
        </div>

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/95 p-4 backdrop-blur">
          <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
            <button
              disabled={!selected || uploading}
              onClick={() => cameraInputRef.current?.click()}
              className="rounded-2xl bg-red-600 px-5 py-4 font-black text-white disabled:opacity-40"
            >
              {uploading ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Subiendo</span> : <span className="inline-flex items-center gap-2"><Camera size={18} /> Hacer foto</span>}
            </button>
            <button
              disabled={!selected || uploading}
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-2xl border border-white/10 px-5 py-4 font-black text-white disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-2"><ImageIcon size={18} /> Galería</span>
            </button>
          </div>
        </div>

        <button onClick={loadLatest} className="mx-auto flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300">
          <RefreshCw size={16} /> Recargar últimas OT
        </button>
      </section>
    </main>
  )
}
