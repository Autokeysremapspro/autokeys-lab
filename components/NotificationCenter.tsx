'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ClipboardList, FileText, Package, UploadCloud } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type NotificationItem = { title: string; subtitle: string; href: string; icon: any; tone: string }

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    let alive = true
    async function load() {
      const out: NotificationItem[] = []
      try {
        const [urgentes, file, stock, facturas] = await Promise.all([
          supabase.from('expedientes').select('id,numero_ot,tipo_trabajo,prioridad,estado').in('prioridad', ['alta', 'urgente']).neq('estado', 'entregado').limit(5),
          supabase.from('file_service').select('id,taller,servicio,estado').in('estado', ['pendiente', 'revision']).limit(5),
          supabase.from('stock').select('id,descripcion,cantidad,cantidad_minima').lte('cantidad', 2).limit(5),
          supabase.from('facturas').select('id,numero_documento,total,estado').eq('estado', 'pendiente').limit(5),
        ])
        ;(urgentes.data || []).forEach((e: any) => out.push({ title: e.numero_ot || 'OT urgente', subtitle: `${e.tipo_trabajo || 'Trabajo'} · ${e.estado || ''}`, href: `/expedientes/${e.id}`, icon: ClipboardList, tone: 'text-red-400 bg-red-500/10' }))
        ;(file.data || []).forEach((f: any) => out.push({ title: 'File Service pendiente', subtitle: [f.taller, f.servicio, f.estado].filter(Boolean).join(' · '), href: '/file-service', icon: UploadCloud, tone: 'text-blue-400 bg-blue-500/10' }))
        ;(stock.data || []).forEach((s: any) => out.push({ title: 'Stock bajo', subtitle: `${s.descripcion || 'Producto'} · quedan ${s.cantidad ?? 0}`, href: '/stock', icon: Package, tone: 'text-orange-400 bg-orange-500/10' }))
        ;(facturas.data || []).forEach((f: any) => out.push({ title: 'Factura pendiente', subtitle: `${f.numero_documento || 'Documento'} · ${Number(f.total || 0).toFixed(2)} €`, href: '/facturas', icon: FileText, tone: 'text-emerald-400 bg-emerald-500/10' }))
      } catch (err) {
        console.error('Notifications error', err)
      }
      if (alive) setItems(out.slice(0, 10))
    }
    load()
    return () => { alive = false }
  }, [])

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative h-12 w-12 rounded-2xl bg-[#0B1220] border border-white/10 flex items-center justify-center hover:bg-white/5 transition">
        <Bell size={18} />
        {items.length > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-600 text-[10px] font-black flex items-center justify-center">{items.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-[56px] z-50 w-[360px] bg-[#0B1220] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="font-black">Notificaciones</div>
            <div className="text-xs text-zinc-500 mt-1">Urgencias, cobros, file service y stock.</div>
          </div>
          <div className="p-2 max-h-[440px] overflow-auto">
            {items.length === 0 && <div className="p-5 text-sm text-zinc-500">No hay avisos pendientes.</div>}
            {items.map((item, idx) => {
              const Icon = item.icon
              return (
                <Link key={idx} href={item.href} onClick={() => setOpen(false)} className="flex gap-3 p-3 rounded-2xl hover:bg-white/5 transition">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${item.tone}`}><Icon size={18} /></div>
                  <div>
                    <div className="font-bold text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500 mt-1">{item.subtitle}</div>
                  </div>
                </Link>
              )
            })}
          </div>
          <Link href="/notificaciones" onClick={() => setOpen(false)} className="block p-4 border-t border-white/10 text-center text-sm font-bold text-red-400 hover:bg-white/5">Ver centro de avisos</Link>
        </div>
      )}
    </div>
  )
}
