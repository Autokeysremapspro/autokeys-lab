'use client'

import { useEffect, useMemo, useState } from 'react'
import { UserCog, Wrench, CheckCircle2, Gauge, Mail, Phone } from 'lucide-react'
import { LabShell, LabStatCard, LabPanel, LabBadge } from '@/components/lab'
import { UsuariosService, type UsuarioApp } from '@/lib/services/usuarios'
import { ExpedienteService } from '@/lib/services/expedientes'
import type { ExpedienteConRelaciones } from '@/types/autokeys'

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<UsuarioApp[]>([])
  const [expedientes, setExpedientes] = useState<ExpedienteConRelaciones[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [usuarios, exps] = await Promise.all([UsuariosService.getAll(), ExpedienteService.getAll()])
      const lab = usuarios.filter((u) => u.rol === 'laboratorio' || u.rol === 'admin')
      setTecnicos(lab)
      setExpedientes(exps)
      if (lab.length && !selectedId) setSelectedId(lab[0].id)
    } finally {
      setLoading(false)
    }
  }

  const cargaPorTecnico = useMemo(() => {
    const map = new Map<string, ExpedienteConRelaciones[]>()
    for (const e of expedientes) {
      const nombre = e.tecnico
      if (!nombre) continue
      const arr = map.get(nombre) || []
      arr.push(e)
      map.set(nombre, arr)
    }
    return map
  }, [expedientes])

  const selected = tecnicos.find((t) => t.id === selectedId) || null
  const trabajosSelected = selected ? (cargaPorTecnico.get(selected.nombre) || []) : []
  const abiertosSelected = trabajosSelected.filter((e) => !['entregado', 'cancelado'].includes(String(e.estado)))

  const totalActivos = tecnicos.filter((t) => t.activo !== false).length
  const enCurso = expedientes.filter((e) => e.tecnico && !['entregado', 'cancelado'].includes(String(e.estado))).length
  const monthStart = new Date(); monthStart.setDate(1)
  const completadosMes = expedientes.filter((e) => e.tecnico && ['entregado', 'terminado'].includes(String(e.estado)) && new Date(e.updated_at || e.created_at || 0) >= monthStart).length
  const cargaMedia = tecnicos.length ? Math.round(enCurso / tecnicos.length) : 0

  return (
    <LabShell title="Técnicos" subtitle="Equipo del laboratorio y carga de trabajo">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LabStatCard icon={<UserCog size={19} />} tone="red" label="Técnicos activos" value={totalActivos} />
          <LabStatCard icon={<Wrench size={19} />} tone="orange" label="Trabajos en curso" value={enCurso} />
          <LabStatCard icon={<CheckCircle2 size={19} />} tone="green" label="Completados este mes" value={completadosMes} />
          <LabStatCard icon={<Gauge size={19} />} tone="blue" label="Carga media" value={cargaMedia} subtitle="órdenes por técnico" />
        </div>

        <div className="grid gap-4 2xl:grid-cols-[1fr_360px]">
          <LabPanel padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-bold">Técnico</th>
                    <th className="px-3 py-3 font-bold">Email</th>
                    <th className="px-3 py-3 font-bold text-right">En curso</th>
                    <th className="px-3 py-3 font-bold text-right">Total asignadas</th>
                    <th className="px-3 py-3 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {tecnicos.map((t) => {
                    const trabajos = cargaPorTecnico.get(t.nombre) || []
                    const abiertos = trabajos.filter((e) => !['entregado', 'cancelado'].includes(String(e.estado)))
                    return (
                      <tr key={t.id} onClick={() => setSelectedId(t.id)} className={`cursor-pointer border-t border-white/[0.06] hover:bg-white/[0.03] ${selectedId === t.id ? 'bg-[#c81f2a]/[0.07]' : ''}`}>
                        <td className="px-5 py-3 font-bold text-white">{t.nombre}</td>
                        <td className="px-3 py-3 text-zinc-400">{t.email}</td>
                        <td className="px-3 py-3 text-right font-bold text-zinc-200">{abiertos.length}</td>
                        <td className="px-3 py-3 text-right text-zinc-400">{trabajos.length}</td>
                        <td className="px-3 py-3"><LabBadge tone={t.activo === false ? 'zinc' : 'green'}>{t.activo === false ? 'Inactivo' : 'Activo'}</LabBadge></td>
                      </tr>
                    )
                  })}
                  {!loading && tecnicos.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-600">Sin técnicos de laboratorio dados de alta.</td></tr>}
                </tbody>
              </table>
            </div>
          </LabPanel>

          <LabPanel title="Detalle del técnico">
            {!selected ? (
              <div className="py-10 text-center text-sm text-zinc-600">Selecciona un técnico de la lista.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#c81f2a]/15 text-sm font-bold text-[#ff5468]">
                    {selected.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-bold text-white">{selected.nombre}</div>
                    <div className="text-xs capitalize text-zinc-500">{selected.rol}</div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2"><Mail size={13} /> {selected.email}</div>
                  {selected.telefono && <div className="flex items-center gap-2"><Phone size={13} /> {selected.telefono}</div>}
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <div><div className="text-lg font-bold text-white">{abiertosSelected.length}</div><div className="text-[10px] text-zinc-600">En curso</div></div>
                  <div><div className="text-lg font-bold text-white">{trabajosSelected.length}</div><div className="text-[10px] text-zinc-600">Total asignadas</div></div>
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600">Órdenes activas</div>
                  <div className="space-y-1.5">
                    {abiertosSelected.slice(0, 6).map((e) => (
                      <div key={e.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
                        <span className="truncate text-zinc-300">{e.numero_ot} · {e.tipo_trabajo}</span>
                        <LabBadge status={e.estado}>{e.estado || 'recibido'}</LabBadge>
                      </div>
                    ))}
                    {abiertosSelected.length === 0 && <div className="text-xs text-zinc-600">Sin órdenes activas.</div>}
                  </div>
                </div>
              </div>
            )}
          </LabPanel>
        </div>
      </div>
    </LabShell>
  )
}
