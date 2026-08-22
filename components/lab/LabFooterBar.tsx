'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, HardDrive, Users, BadgeCheck, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type FooterStats = {
  lastBackup: string | null
  activeUsers: number | null
}

function formatDate(value: string | null) {
  if (!value) return 'Sin registros'
  const d = new Date(value)
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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
      setStats({
        lastBackup: backupRes.data?.created_at || null,
        activeUsers: usersRes.count ?? null,
      })
    }
    load().catch(() => {})
    return () => { alive = false }
  }, [])

  const items = [
    {
      icon: ShieldCheck,
      tone: 'text-[#4ade95]',
      label: 'Respaldo automático',
      value: `Última: ${formatDate(stats.lastBackup)}`,
    },
    {
      icon: HardDrive,
      tone: 'text-zinc-400',
      label: 'Almacenamiento',
      value: '1.2 TB / 2.8 TB',
    },
    {
      icon: Users,
      tone: 'text-[#6ea6ff]',
      label: 'Usuarios activos',
      value: stats.activeUsers !== null ? `${stats.activeUsers} técnicos conectados` : '—',
    },
    {
      icon: BadgeCheck,
      tone: 'text-[#ffab52]',
      label: 'Licencia',
      value: 'Profesional Plus',
    },
    {
      icon: Tag,
      tone: 'text-zinc-400',
      label: 'Versión',
      value: 'v2.5.1 (2024)',
    },
  ]

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3.5">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.label} className="flex items-center gap-2.5 text-xs">
            <Icon size={16} className={item.tone} />
            <div>
              <div className="font-bold text-zinc-300">{item.label}</div>
              <div className="text-zinc-600">{item.value}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
