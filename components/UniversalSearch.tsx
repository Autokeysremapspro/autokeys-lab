'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, User, Car, ClipboardList, FileText, Package, UploadCloud, BookOpen, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type SearchResult = { type: string; title: string; subtitle?: string; href: string; icon: any }

export default function UniversalSearch({ placeholder = 'Buscar cliente, matrícula, VIN, OT, ECU, factura...' }: { placeholder?: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const clean = query.trim()

  useEffect(() => {
    let alive = true
    const timer = setTimeout(async () => {
      if (clean.length < 2) { setResults([]); return }
      setLoading(true)
      const like = `%${clean}%`
      const out: SearchResult[] = []
      try {
        const [clientes, vehiculos, expedientes, facturas, stock, fileService, biblioteca] = await Promise.all([
          supabase.from('clientes').select('id,nombre,telefono,email,nif').or(`nombre.ilike.${like},telefono.ilike.${like},email.ilike.${like},nif.ilike.${like}`).limit(5),
          supabase.from('vehiculos').select('id,marca,modelo,matricula,bastidor,ecu').or(`marca.ilike.${like},modelo.ilike.${like},matricula.ilike.${like},bastidor.ilike.${like},ecu.ilike.${like}`).limit(5),
          supabase.from('expedientes').select('id,numero_ot,tipo_trabajo,estado').or(`numero_ot.ilike.${like},tipo_trabajo.ilike.${like},descripcion.ilike.${like},estado.ilike.${like}`).limit(5),
          supabase.from('facturas').select('id,numero_documento,tipo_documento,total,estado').or(`numero_documento.ilike.${like},tipo_documento.ilike.${like},estado.ilike.${like}`).limit(5),
          supabase.from('stock').select('id,tipo,referencia,descripcion,cantidad').or(`tipo.ilike.${like},referencia.ilike.${like},descripcion.ilike.${like},marca.ilike.${like},modelo.ilike.${like}`).limit(5),
          supabase.from('file_service').select('id,taller,marca,modelo,matricula,ecu,servicio,estado').or(`taller.ilike.${like},marca.ilike.${like},modelo.ilike.${like},matricula.ilike.${like},ecu.ilike.${like},servicio.ilike.${like},estado.ilike.${like}`).limit(5),
          supabase.from('biblioteca_tecnica').select('id,titulo,categoria,ecu,sintoma,solucion').or(`titulo.ilike.${like},categoria.ilike.${like},ecu.ilike.${like},sintoma.ilike.${like},solucion.ilike.${like}`).limit(5),
        ])
        ;(clientes.data || []).forEach((c: any) => out.push({ type: 'Cliente', title: c.nombre, subtitle: [c.telefono, c.email].filter(Boolean).join(' · '), href: `/clientes/${c.id}`, icon: User }))
        ;(vehiculos.data || []).forEach((v: any) => out.push({ type: 'Vehículo', title: `${v.marca || ''} ${v.modelo || ''}`.trim() || v.matricula || 'Vehículo', subtitle: [v.matricula, v.bastidor, v.ecu].filter(Boolean).join(' · '), href: `/vehiculos/${v.id}`, icon: Car }))
        ;(expedientes.data || []).forEach((e: any) => out.push({ type: 'Expediente', title: e.numero_ot || 'OT', subtitle: [e.tipo_trabajo, e.estado].filter(Boolean).join(' · '), href: `/expedientes/${e.id}`, icon: ClipboardList }))
        ;(facturas.data || []).forEach((f: any) => out.push({ type: 'Documento', title: f.numero_documento || f.tipo_documento || 'Documento', subtitle: [f.tipo_documento, f.estado, f.total ? `${Number(f.total).toFixed(2)} €` : null].filter(Boolean).join(' · '), href: '/facturas', icon: FileText }))
        ;(stock.data || []).forEach((s: any) => out.push({ type: 'Stock', title: s.descripcion || s.referencia || 'Stock', subtitle: [s.tipo, s.referencia, `Stock: ${s.cantidad ?? 0}`].filter(Boolean).join(' · '), href: '/stock', icon: Package }))
        ;(fileService.data || []).forEach((fs: any) => out.push({ type: 'File Service', title: fs.servicio || fs.ecu || 'Solicitud', subtitle: [fs.taller, fs.matricula, fs.estado].filter(Boolean).join(' · '), href: '/file-service', icon: UploadCloud }))
        ;(biblioteca.data || []).forEach((b: any) => out.push({ type: 'Caso técnico', title: b.titulo || b.ecu || 'Caso técnico', subtitle: [b.categoria, b.ecu, b.sintoma].filter(Boolean).join(' · '), href: `/biblioteca/${b.id}`, icon: BookOpen }))
      } catch (err) { console.error('Universal search error', err) }
      if (alive) { setResults(out.slice(0, 12)); setLoading(false) }
    }, 350)
    return () => { alive = false; clearTimeout(timer) }
  }, [clean])

  const open = clean.length >= 2
  return (
    <div className="relative w-full min-w-0">
      <div className="flex min-h-[46px] items-center gap-3 rounded-xl border border-white/[0.09] bg-[#0c0e12]/95 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,.02)] transition focus-within:border-[#ef202d]/35 focus-within:bg-[#0e1015]">
        <Search size={17} className="shrink-0 text-zinc-500" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className="min-h-0 w-full min-w-0 border-0 bg-transparent p-0 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:shadow-none" />
        {query && <button type="button" onClick={() => setQuery('')} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.04] hover:text-white"><X size={15} /></button>}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[54px] z-[120] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#0b0d11]/[0.985] shadow-[0_28px_80px_rgba(0,0,0,.62)] backdrop-blur-2xl sm:min-w-[440px] md:left-0 md:right-auto md:w-[min(620px,calc(100vw-3rem))]">
          <div className="flex min-h-[46px] items-center justify-between border-b border-white/[0.07] px-4 text-[11px] font-semibold text-zinc-500">
            <span>{loading ? 'Buscando…' : `${results.length} resultados`}</span><span className="text-[10px] uppercase tracking-[.12em] text-[#ef202d]">Búsqueda global</span>
          </div>
          <div className="max-h-[min(460px,65vh)] overflow-y-auto p-2">
            {!loading && results.length === 0 && <div className="p-5 text-[13px] text-zinc-500">Sin resultados para “{clean}”.</div>}
            {results.map((r, idx) => { const Icon = r.icon; return (
              <Link key={`${r.type}-${idx}`} href={r.href} onClick={() => setQuery('')} className="flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.045]">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#ef202d]/20 bg-[#ef202d]/[0.08] text-[#ff5964]"><Icon size={17} /></div>
                <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><span className="truncate text-[13px] font-semibold text-zinc-100">{r.title}</span><span className="shrink-0 rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-500">{r.type}</span></div>{r.subtitle && <div className="mt-1 truncate text-[11px] text-zinc-500">{r.subtitle}</div>}</div>
              </Link>
            )})}
          </div>
        </div>
      )}
    </div>
  )
}
