'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogOut, Tag, LifeBuoy, Mail, Phone, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LabLogoMark, LabBadge } from '@/components/lab'
import { getTarifaDistribuidor, CATEGORIA_LABELS, type ServicioConPrecio } from '@/lib/services/precios'

function groupByCategoria(items: ServicioConPrecio[]) {
  const groups = new Map<string, ServicioConPrecio[]>()
  for (const item of items) {
    const arr = groups.get(item.categoria) || []
    arr.push(item)
    groups.set(item.categoria, arr)
  }
  return Array.from(groups.entries())
}

const NIVEL_TONE: Record<string, 'purple' | 'amber' | 'zinc' | 'blue'> = { Platinum: 'purple', Gold: 'amber', Silver: 'blue', Bronze: 'zinc' }

type Distribuidor = {
  id: string
  empresa: string
  nombre_contacto: string | null
  email: string
  telefono: string | null
  ciudad: string | null
  pais: string | null
  nivel: string
  estado: string
}

type Ticket = { id: string; numero: string | null; asunto: string; estado: string; created_at: string }

export default function MiCuentaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [distribuidor, setDistribuidor] = useState<Distribuidor | null>(null)
  const [tarifa, setTarifa] = useState<ServicioConPrecio[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) { router.replace('/login'); return }

      const { data: dist, error } = await supabase
        .from('akcloud_distribuidores')
        .select('id,empresa,nombre_contacto,email,telefono,ciudad,pais,nivel,estado')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      if (error) throw error

      if (!dist) {
        toast.error('No encontramos una cuenta de distribuidor activa')
        router.replace('/login')
        return
      }

      setDistribuidor(dist as Distribuidor)

      const [servicios, ticketsRes] = await Promise.all([
        getTarifaDistribuidor(supabase, dist.id),
        supabase.from('distribuidor_tickets').select('id,numero,asunto,estado,created_at').eq('distribuidor_id', dist.id).order('created_at', { ascending: false }).limit(5),
      ])
      setTarifa(servicios)
      setTickets((ticketsRes.data || []) as Ticket[])
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cargar tu cuenta')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07080b] text-zinc-100">
        <div className="text-sm text-zinc-500">Cargando tu cuenta...</div>
      </main>
    )
  }

  if (!distribuidor) return null

  return (
    <main className="min-h-screen bg-[#07080b] text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#08090c]/95 px-5 py-3.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <LabLogoMark size={38} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">Autokeys Lab</div>
            <div className="truncate text-[11px] text-zinc-500">Portal de distribuidor</div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.06]">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-4 p-5 sm:p-8">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.012] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white sm:text-2xl">{distribuidor.empresa}</h1>
                <LabBadge tone={NIVEL_TONE[distribuidor.nivel] || 'zinc'}>{distribuidor.nivel}</LabBadge>
              </div>
              <div className="mt-2 space-y-1 text-xs text-zinc-500">
                {distribuidor.nombre_contacto && <div>{distribuidor.nombre_contacto}</div>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1.5"><Mail size={12} /> {distribuidor.email}</span>
                  {distribuidor.telefono && <span className="flex items-center gap-1.5"><Phone size={12} /> {distribuidor.telefono}</span>}
                  {distribuidor.ciudad && <span className="flex items-center gap-1.5"><MapPin size={12} /> {[distribuidor.ciudad, distribuidor.pais].filter(Boolean).join(', ')}</span>}
                </div>
              </div>
            </div>
            <LabBadge tone="green">Cuenta activa</LabBadge>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.012] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Tag size={16} className="text-[#ff5468]" />
            <h2 className="text-[15px] font-bold text-white">Mis precios por servicio</h2>
          </div>
          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
            {groupByCategoria(tarifa).map(([categoria, servicios]) => (
              <div key={categoria}>
                <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-600">{CATEGORIA_LABELS[categoria] || categoria}</div>
                <div className="space-y-2">
                  {servicios.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <span className="text-sm font-semibold text-zinc-300">{s.nombre}</span>
                      <div className="flex items-center gap-2">
                        {s.personalizado && <LabBadge tone="purple">Precio especial</LabBadge>}
                        <span className="text-sm font-bold text-white">{s.precioEfectivo.toFixed(2)} €</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {tarifa.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin servicios activos.</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.012] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <LifeBuoy size={16} className="text-[#6ea6ff]" />
            <h2 className="text-[15px] font-bold text-white">Tickets de soporte</h2>
          </div>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs">
                <span className="truncate text-zinc-300">{t.numero ? `#${t.numero} · ` : ''}{t.asunto}</span>
                <LabBadge tone={t.estado === 'cerrado' ? 'zinc' : t.estado === 'en_curso' ? 'blue' : 'amber'}>{t.estado.replace('_', ' ')}</LabBadge>
              </div>
            ))}
            {tickets.length === 0 && <div className="py-6 text-center text-xs text-zinc-600">Sin tickets registrados.</div>}
          </div>
        </section>
      </div>
    </main>
  )
}
