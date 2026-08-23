'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RefreshCw, Search } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

 type PedidoDtc = {
  id: string
  numero?: string | null
  cliente_nombre?: string | null
  cliente_email?: string | null
  marca?: string | null
  modelo?: string | null
  motor?: string | null
  ecu?: string | null
  servicios?: string[] | null
  dtc_codes?: string[] | null
  observaciones?: string | null
  estado?: string | null
  created_at?: string | null
}

export default function AkCloudDtcOffPage() {
  const [rows, setRows] = useState<PedidoDtc[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  async function load() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('file_service_pedidos')
        .select('id,numero,cliente_nombre,cliente_email,marca,modelo,motor,ecu,servicios,dtc_codes,observaciones,estado,created_at')
        .not('dtc_codes', 'is', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      setRows((data || []).filter((r: any) => Array.isArray(r.dtc_codes) && r.dtc_codes.length > 0))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => [r.numero, r.cliente_nombre, r.cliente_email, r.marca, r.modelo, r.motor, r.ecu, ...(r.dtc_codes || [])].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [rows, query])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link href="/ak-cloud" className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"><ArrowLeft size={16}/> Volver a AK Cloud</Link>
            <div className="flex items-center gap-3"><AlertTriangle className="text-amber-300"/><h1 className="text-4xl font-bold">DTC OFF</h1></div>
            <p className="mt-2 text-zinc-500">Códigos DTC estructurados recibidos desde AK Cloud, separados de las observaciones generales.</p>
          </div>
          <button onClick={load} className="btn btn-dark inline-flex items-center gap-2"><RefreshCw size={17}/> Actualizar</button>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0B1220] p-5">
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <Search size={17} className="text-zinc-500"/>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar pedido, cliente, ECU o código DTC..." className="w-full bg-transparent outline-none"/>
          </div>

          {loading ? <div className="p-8 text-center text-zinc-500">Cargando DTC...</div> : filtered.length === 0 ? <div className="p-8 text-center text-zinc-500">No hay pedidos con DTC estructurados.</div> : (
            <div className="grid gap-4">
              {filtered.map((r) => (
                <article key={r.id} className="rounded-3xl border border-white/10 bg-[#111827] p-5">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold text-[#ff5468]">{r.numero || 'FS-SIN-NUM'}</div>
                      <h2 className="mt-2 text-2xl font-bold">{[r.marca,r.modelo,r.motor].filter(Boolean).join(' · ') || 'Pedido AK Cloud'}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{r.cliente_nombre || r.cliente_email || 'Distribuidor sin identificar'} · {r.ecu || 'ECU —'}</p>
                    </div>
                    <Link href={`/ak-cloud/${r.id}`} className="btn btn-red text-sm">Abrir pedido</Link>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(r.dtc_codes || []).map((code) => <span key={code} className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 font-mono text-sm font-black text-amber-200">{code}</span>)}
                  </div>
                  {r.observaciones && <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm text-zinc-400"><span className="font-bold text-zinc-300">Observaciones:</span> {r.observaciones}</div>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
