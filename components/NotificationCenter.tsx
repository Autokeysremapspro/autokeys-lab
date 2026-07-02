'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, ClipboardList, FileText, Info, Package, UploadCloud, AlertTriangle, ShieldAlert } from 'lucide-react'
import { crearAvisosAutomaticosBasicos, getNotificacionesNoLeidas, marcarNotificacionLeida, marcarTodasLeidas } from '@/lib/services/notificaciones'
import type { Notificacion } from '@/types/notificaciones'

type Item = Notificacion & { virtual?: boolean }

const iconByModule: Record<string, any> = {
  Expedientes: ClipboardList,
  'File Service': UploadCloud,
  Stock: Package,
  Facturación: FileText,
}

const toneByType: Record<string, string> = {
  info: 'text-sky-400 bg-sky-500/10',
  success: 'text-emerald-400 bg-emerald-500/10',
  warning: 'text-orange-400 bg-orange-500/10',
  danger: 'text-red-400 bg-red-500/10',
}

function iconFor(item: Item) {
  if (item.tipo === 'danger') return ShieldAlert
  if (item.tipo === 'warning') return AlertTriangle
  return iconByModule[item.modulo || ''] || Info
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [persisted, setPersisted] = useState<Notificacion[]>([])
  const [virtuals, setVirtuals] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [saved, generated] = await Promise.all([
        getNotificacionesNoLeidas(12),
        crearAvisosAutomaticosBasicos(),
      ])
      setPersisted(saved)
      setVirtuals(generated.map((item, index) => ({
        id: `virtual-${index}`,
        leida: false,
        created_at: new Date().toISOString(),
        virtual: true,
        ...item,
      } as Item)))
    } catch (err) {
      console.error('Notifications error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [])

  const items = useMemo(() => {
    const out: Item[] = [...persisted, ...virtuals]
    const seen = new Set<string>()
    return out.filter((item) => {
      const key = `${item.titulo}-${item.mensaje}-${item.href}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 12)
  }, [persisted, virtuals])

  async function markOne(item: Item) {
    if (!item.virtual) {
      await marcarNotificacionLeida(item.id)
      await load()
    }
    setOpen(false)
  }

  async function markAll() {
    await marcarTodasLeidas()
    await load()
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative h-12 w-12 rounded-2xl bg-[#0B1220] border border-white/10 flex items-center justify-center hover:bg-white/5 transition">
        <Bell size={18} />
        {items.length > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-600 text-[10px] font-black flex items-center justify-center">{items.length}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-[56px] z-50 w-[390px] bg-[#0B1220] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3">
            <div>
              <div className="font-black">Centro de avisos</div>
              <div className="text-xs text-zinc-500 mt-1">Urgencias, cobros, file service y stock.</div>
            </div>
            <button onClick={markAll} className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1">
              <CheckCheck size={14} /> Leer todo
            </button>
          </div>

          <div className="p-2 max-h-[460px] overflow-auto">
            {loading && items.length === 0 && <div className="p-5 text-sm text-zinc-500">Cargando avisos...</div>}
            {!loading && items.length === 0 && <div className="p-5 text-sm text-zinc-500">No hay avisos pendientes.</div>}

            {items.map((item) => {
              const Icon = iconFor(item)
              return (
                <Link
                  key={item.id}
                  href={item.href || '/notificaciones'}
                  onClick={() => markOne(item)}
                  className="flex gap-3 p-3 rounded-2xl hover:bg-white/5 transition"
                >
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center ${toneByType[item.tipo] || toneByType.info}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate">{item.titulo}</div>
                    {item.mensaje && <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.mensaje}</div>}
                    <div className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider font-black">
                      {item.modulo || 'Sistema'} · {item.prioridad || 'normal'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          <Link href="/notificaciones" onClick={() => setOpen(false)} className="block p-4 border-t border-white/10 text-center text-sm font-bold text-red-400 hover:bg-white/5">
            Ver centro de avisos
          </Link>
        </div>
      )}
    </div>
  )
}
