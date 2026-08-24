'use client'

import { useEffect, useMemo, useState } from 'react'
import { Gift, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { LabShell, LabPanel, LabBadge } from '@/components/lab'
import DistributorPricingPreset from '@/components/distribuidores/DistributorPricingPreset'

type Distribuidor = {
  id: string
  empresa: string
  email: string
  ciudad: string | null
  estado: string
  nivel: string
}

export default function ReglasPrecioDistribuidoresPage() {
  const [rows, setRows] = useState<Distribuidor[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/distribuidores')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los distribuidores')
        const distribuidores = (data.distribuidores || []) as Distribuidor[]
        setRows(distribuidores)
        if (distribuidores.length) setSelectedId(distribuidores[0].id)
      } catch (err: any) {
        toast.error(err.message || 'No se pudieron cargar los distribuidores')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((d) => [d.empresa, d.email, d.ciudad].some((v) => String(v || '').toLowerCase().includes(q)))
  }, [rows, query])

  const selected = rows.find((d) => d.id === selectedId) || null

  return (
    <LabShell
      title="Reglas de precios"
      subtitle="Plantillas comerciales activables por distribuidor con un solo clic"
    >
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <LabPanel padded={false}>
          <div className="border-b border-white/[0.07] p-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <Search size={15} className="text-zinc-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar distribuidor..." className="w-full border-0 bg-transparent p-0 text-sm" />
            </div>
          </div>
          <div className="max-h-[68vh] overflow-y-auto p-2">
            {filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition ${selectedId === d.id ? 'border-[#c81f2a]/35 bg-[#c81f2a]/10' : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">{d.empresa}</div>
                    <div className="mt-0.5 truncate text-[11px] text-zinc-500">{d.email}</div>
                  </div>
                  <LabBadge tone={d.estado === 'activo' ? 'green' : 'zinc'}>{d.estado}</LabBadge>
                </div>
              </button>
            ))}
            {!loading && filtered.length === 0 && <div className="p-6 text-center text-xs text-zinc-600">No hay distribuidores que coincidan.</div>}
          </div>
        </LabPanel>

        <div className="space-y-4">
          <LabPanel>
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#c81f2a]/15 text-[#ff5468]"><Gift size={20} /></div>
              <div>
                <div className="text-base font-bold text-white">Plantillas comerciales</div>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-500">Configuras la plantilla una sola vez. Después solo eliges un distribuidor y activas o desactivas el interruptor. AK Cloud calcula el precio condicionado tanto en pantalla como en el servidor.</p>
              </div>
            </div>
          </LabPanel>

          {selected ? (
            <LabPanel title={`Tarifas especiales · ${selected.empresa}`}>
              <DistributorPricingPreset distribuidorId={selected.id} distribuidorNombre={selected.empresa} />
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-start gap-2 text-xs text-zinc-500">
                  <Users size={15} className="mt-0.5 shrink-0" />
                  <p>El interruptor solo afecta al distribuidor seleccionado. El botón <b className="text-zinc-300">Configurar plantilla</b> cambia la definición global y actualiza automáticamente a todos los distribuidores que la tengan activada.</p>
                </div>
              </div>
            </LabPanel>
          ) : (
            <LabPanel><div className="py-12 text-center text-sm text-zinc-600">Selecciona un distribuidor.</div></LabPanel>
          )}
        </div>
      </div>
    </LabShell>
  )
}
