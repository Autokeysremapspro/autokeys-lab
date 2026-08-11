'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Search, Wrench } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type PedidoLectura = {
  id: string
  numero?: string | null
  cliente_nombre?: string | null
  cliente_email?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  ecu?: string | null
  herramienta_lectura?: string | null
  metodo_lectura?: string | null
  archivo_origen?: string | null
  modificaciones_hardware?: string | null
  estado?: string | null
  created_at?: string | null
}

export default function AkCloudLecturaPage() {
  const [rows, setRows] = useState<PedidoLectura[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('file_service_pedidos')
        .select('id,numero,cliente_nombre,cliente_email,marca,modelo,motor,ecu,herramienta_lectura,metodo_lectura,archivo_origen,modificaciones_hardware,estado,created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRows((data || []) as PedidoLectura[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => [r.numero, r.cliente_nombre, r.cliente_email, r.marca, r.modelo, r.motor, r.ecu, r.herramienta_lectura, r.metodo_lectura, r.archivo_origen, r.modificaciones_hardware].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [rows, query])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link href="/ak-cloud" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"><ArrowLeft size={16}/> Volver a AK Cloud</Link>
            <div className="flex items-center gap-3"><Wrench className="text-[#ffb870]"/><h1 className="text-4xl font-bold">Lectura y hardware</h1></div>
            <p className="mt-2 text-zinc-500">Herramienta, método de lectura, origen del archivo y modificaciones de hardware recibidas desde AK Cloud.</p>
          </div>
          <button onClick={load} className="btn btn-dark inline-flex items-center gap-2"><RefreshCw size={17}/> Actualizar</button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-5">
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Search size={17} className="text-zinc-500"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pedido, ECU, herramienta o método..." className="w-full bg-transparent outline-none"/>
          </div>

          {loading ? <div className="p-8 text-center text-zinc-500">Cargando datos...</div> : filtered.length === 0 ? <div className="p-8 text-center text-zinc-500">No hay pedidos con esos filtros.</div> : (
            <div className="grid gap-4">
              {filtered.map((r) => (
                <article key={r.id} className="rounded-3xl border border-white/10 bg-[#111827] p-5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold text-[#ffb870]">{r.numero || 'FS-SIN-NUM'}</div>
                      <h2 className="mt-2 text-2xl font-bold">{[r.marca,r.modelo,r.motor].filter(Boolean).join(' · ') || 'Pedido AK Cloud'}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{r.cliente_nombre || r.cliente_email || 'Distribuidor sin identificar'} · {r.ecu || 'ECU —'}</p>
                    </div>
                    <Link href={`/ak-cloud/${r.id}`} className="btn btn-red text-sm">Abrir pedido</Link>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Meta label="Herramienta" value={r.herramienta_lectura || '—'} />
                    <Meta label="Método" value={r.metodo_lectura || '—'} />
                    <Meta label="Archivo" value={r.archivo_origen || '—'} />
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-400"><span className="font-bold text-zinc-300">Hardware:</span> {r.modificaciones_hardware || 'Sin modificaciones indicadas'}</div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/5 bg-black/20 p-3"><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div><div className="mt-1 font-bold">{value}</div></div>
}
