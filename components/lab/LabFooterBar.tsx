'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, HardDrive, Users, BadgeCheck, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type FooterStats = { lastBackup: string | null; activeUsers: number | null }

function formatDate(value: string | null) {
  if (!value) return 'Sin registros'
  const d = new Date(value)
  return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
}

export default function LabFooterBar() {
  const [stats, setStats] = useState<FooterStats>({ lastBackup: null, activeUsers: null })

  useEffect(() => {
    let alive = true
    async function load() {
      const [backupRes, usersRes] = await Promise.all([
        supabase.from('backups').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('usuarios_app').select('id', { count: 'exact', head: true }).eq('activo', true),
      ])
      if (!alive) return
      setStats({ lastBackup: backupRes.data?.created_at || null, activeUsers: usersRes.count ?? null })
    }
    load().catch(() => {})
    return () => { alive = false }
  }, [])

  const items = [
    { icon: ShieldCheck, label: 'Respaldo automático', value: `Última: ${formatDate(stats.lastBackup)}` },
    { icon: HardDrive, label: 'Almacenamiento', value: '1.2 TB / 2.8 TB' },
    { icon: Users, label: 'Usuarios activos', value: stats.activeUsers !== null ? `${stats.activeUsers} técnicos conectados` : '—' },
    { icon: BadgeCheck, label: 'Licencia', value: 'Profesional Plus' },
    { icon: Tag, label: 'Versión', value: 'v2.5.1 (2024)' },
  ]

  return (
    <div className="mt-4 hidden shrink-0 grid-cols-5 border-t border-white/[0.075] bg-[#08090c]/88 lg:grid">
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={item.label} className={`flex min-h-[52px] items-center gap-2.5 px-3 py-2 2xl:min-h-[58px] 2xl:gap-3 2xl:px-4 2xl:py-2.5 ${index > 0 ? 'border-l border-white/[0.055]' : ''}`}>
            <Icon size={17} strokeWidth={1.8} className="shrink-0 text-[#ef202d] 2xl:h-[18px] 2xl:w-[18px]" />
            <div className="min-w-0">
              <div className="truncate text-[10px] font-medium text-zinc-300 2xl:text-[11px]">{item.label}</div>
              <div className="truncate text-[8px] text-zinc-500 2xl:text-[9px]">{item.value}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
