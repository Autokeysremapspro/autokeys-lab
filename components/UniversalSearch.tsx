'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, User, Car, ClipboardList, FileText, Package, UploadCloud, BookOpen, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type SearchResult = {
  type: string
  title: string
  subtitle?: string
  href: string
  icon: any
}

export default function UniversalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const clean = query.trim()

  useEffect(() => {
    let alive = true
    const timer = setTimeout(async () => {
      if (clean.length < 2) {
        setResults([])
        return
      }
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
        ;(facturas.data || []).forEach((f: any) => out.push({ type: 'Documento', title: f.numero_documento || f.tipo_documento || 'Documento', subtitle: [f.tipo_documento, f.estado, f.total ? `${Number(f.total).toFixed(2)} €` : null].filter(Boolean).join(' · '), href: `/facturas`, icon: FileText }))
        ;(stock.data || []).forEach((s: any) => out.push({ type: 'Stock', title: s.descripcion || s.referencia || 'Stock', subtitle: [s.tipo, s.referencia, `Stock: ${s.cantidad ?? 0}`].filter(Boolean).join(' · '), href: `/stock`, icon: Package }))
        ;(fileService.data || []).forEach((fs: any) => out.push({ type: 'File Service', title: fs.servicio || fs.ecu || 'Solicitud', subtitle: [fs.taller, fs.matricula, fs.estado].filter(Boolean).join(' · '), href: `/file-service`, icon: UploadCloud }))
        ;(biblioteca.data || []).forEach((b: any) => out.push({ type: 'Caso técnico', title: b.titulo || b.ecu || 'Caso técnico', subtitle: [b.categoria, b.ecu, b.sintoma].filter(Boolean).join(' · '), href: `/biblioteca/${b.id}`, icon: BookOpen }))
      } catch (err) {
        console.error('Universal search error', err)
      }

      if (alive) {
        setResults(out.slice(0, 12))
        setLoading(false)
      }
    }, 350)

    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [clean])

  const open = clean.length >= 2

  return (
    <div className="relative w-full xl:w-[560px]">
      <div className="flex items-center gap-2 bg-[#0B1220] border border-white/10 rounded-2xl px-4 py-3 shadow-xl shadow-black/10">
        <Search size={18} className="text-zinc-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar cliente, matrícula, VIN, OT, ECU, factura..."
          className="bg-transparent border-0 p-0 w-full outline-none text-sm"
        />
        {query && <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white"><X size={16} /></button>}
      </div>

      {open && (
        <div className="absolute right-0 left-0 top-[56px] z-50 bg-[#0B1220] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 text-xs text-zinc-500 font-bold uppercase tracking-[0.18em]">
            {loading ? 'Buscando...' : `${results.length} resultados`}
          </div>
          <div className="max-h-[460px] overflow-auto p-2">
            {!loading && results.length === 0 && <div className="p-5 text-zinc-500 text-sm">Sin resultados para “{clean}”.</div>}
            {results.map((r, idx) => {
              const Icon = r.icon
              return (
                <Link key={`${r.type}-${idx}`} href={r.href} onClick={() => setQuery('')} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition">
                  <div className="h-10 w-10 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center"><Icon size={18} /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="font-bold truncate">{r.title}</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">{r.type}</span></div>
                    {r.subtitle && <div className="text-xs text-zinc-500 truncate mt-1">{r.subtitle}</div>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
