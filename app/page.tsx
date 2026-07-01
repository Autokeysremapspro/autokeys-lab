'use client'
import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/components/AppShell'
import StatCard from '@/components/StatCard'
import QuickAction from '@/components/QuickAction'
import DataTable from '@/components/DataTable'
import { supabase } from '@/lib/supabase'
import { statusClass, money } from '@/lib/status'
import { AlertTriangle, Car, ClipboardList, Euro, FileText, Package, PlusCircle, UploadCloud, Users } from 'lucide-react'

type DashboardStats = {
  abiertas: number
  terminadasHoy: number
  urgentes: number
  pendientesCobro: number
  clientes: number
  stockBajo: number
  fileService: number
  facturacionHoy: number
  facturacionMes: number
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function monthStartISO() {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    abiertas: 0,
    terminadasHoy: 0,
    urgentes: 0,
    pendientesCobro: 0,
    clientes: 0,
    stockBajo: 0,
    fileService: 0,
    facturacionHoy: 0,
    facturacionMes: 0,
  })
  const [ots, setOts] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [stockBajo, setStockBajo] = useState<any[]>([])

  useEffect(() => { load() }, [])

  async function load() {
    const today = todayISO()
    const month = monthStartISO()

    const [
      abiertas,
      terminadasHoy,
      urgentes,
      pendientesCobro,
      clientesCount,
      fsCount,
      latestOts,
      latestClientes,
      stockRows,
      factHoy,
      factMes,
    ] = await Promise.all([
      supabase.from('expedientes').select('*', { count: 'exact', head: true }).not('estado', 'in', '(entregado,cancelado)'),
      supabase.from('expedientes').select('*', { count: 'exact', head: true }).eq('estado', 'terminado').gte('updated_at', `${today}T00:00:00`),
      supabase.from('expedientes').select('*', { count: 'exact', head: true }).eq('prioridad', 'urgente').not('estado', 'in', '(entregado,cancelado)'),
      supabase.from('facturas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      supabase.from('file_service').select('*', { count: 'exact', head: true }).not('estado', 'in', '(finalizado,cancelado)'),
      supabase.from('expedientes').select('id,numero_ot,tipo_trabajo,estado,prioridad,precio_final,precio_estimado,created_at,clientes(nombre,telefono),vehiculos(marca,modelo,matricula,ecu)').order('created_at', { ascending: false }).limit(8),
      supabase.from('clientes').select('id,nombre,telefono,email,created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('stock').select('id,tipo,referencia,descripcion,cantidad,cantidad_minima,ubicacion').order('cantidad', { ascending: true }).limit(8),
      supabase.from('facturas').select('total').gte('fecha', today),
      supabase.from('facturas').select('total').gte('fecha', month),
    ])

    const lowStock = (stockRows.data || []).filter((s: any) => Number(s.cantidad || 0) <= Number(s.cantidad_minima || 0))

    setStats({
      abiertas: abiertas.count || 0,
      terminadasHoy: terminadasHoy.count || 0,
      urgentes: urgentes.count || 0,
      pendientesCobro: pendientesCobro.count || 0,
      clientes: clientesCount.count || 0,
      stockBajo: lowStock.length,
      fileService: fsCount.count || 0,
      facturacionHoy: (factHoy.data || []).reduce((a: number, b: any) => a + Number(b.total || 0), 0),
      facturacionMes: (factMes.data || []).reduce((a: number, b: any) => a + Number(b.total || 0), 0),
    })
    setOts(latestOts.data || [])
    setClientes(latestClientes.data || [])
    setStockBajo(lowStock)
  }

  const activityBars = useMemo(() => [35, 52, 28, 70, 62, 85, 48, 76, 54, 90, 66, 72], [])

  return (
    <AppShell>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="OT abiertas" value={stats.abiertas} subtitle="Trabajos activos" icon={<ClipboardList size={20} />} tone="red" />
        <StatCard title="Terminadas hoy" value={stats.terminadasHoy} subtitle="Listas para entrega" icon={<Car size={20} />} tone="green" />
        <StatCard title="Facturación hoy" value={money(stats.facturacionHoy)} subtitle={`Mes: ${money(stats.facturacionMes)}`} icon={<Euro size={20} />} tone="blue" />
        <StatCard title="File Service" value={stats.fileService} subtitle="Archivos activos" icon={<UploadCloud size={20} />} tone="amber" />
        <StatCard title="Urgentes" value={stats.urgentes} subtitle="Prioridad alta" icon={<AlertTriangle size={20} />} tone="red" />
        <StatCard title="Pendientes cobro" value={stats.pendientesCobro} subtitle="Facturas pendientes" icon={<FileText size={20} />} tone="amber" />
        <StatCard title="Clientes" value={stats.clientes} subtitle="Base de datos" icon={<Users size={20} />} tone="zinc" />
        <StatCard title="Stock bajo" value={stats.stockBajo} subtitle="Revisar material" icon={<Package size={20} />} tone="red" />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-black">Últimos expedientes</h2>
              <p className="text-sm text-zinc-500">Actividad reciente del laboratorio</p>
            </div>
          </div>
          <DataTable columns={['OT', 'Cliente', 'Vehículo', 'Trabajo', 'Estado', 'Importe']} rows={ots.map((o: any) => [
            <a href={`/expedientes/${o.id}`} className="font-black hover:text-red-400">{o.numero_ot}</a>,
            o.clientes?.nombre || '-',
            `${o.vehiculos?.marca || ''} ${o.vehiculos?.modelo || ''} ${o.vehiculos?.matricula || ''}`,
            o.tipo_trabajo,
            <span className={`badge ${statusClass(o.estado)}`}>{o.estado}</span>,
            money(o.precio_final || o.precio_estimado),
          ])} />
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-xl font-black">Acciones rápidas</h2>
            <p className="text-sm text-zinc-500 mb-4">Crear trabajo, cliente o material</p>
            <div className="space-y-3">
              <QuickAction href="/expedientes/nueva" icon={<PlusCircle size={19} />} title="Nueva OT" description="Crear expediente de trabajo" />
              <QuickAction href="/clientes" icon={<Users size={19} />} title="Nuevo cliente" description="Alta rápida de cliente" />
              <QuickAction href="/stock" icon={<Package size={19} />} title="Nueva referencia" description="Añadir ECU, llave o módulo" />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-xl font-black mb-4">Actividad</h2>
            <div className="h-40 flex items-end gap-2">
              {activityBars.map((h, i) => <div key={i} className="flex-1 rounded-t-xl bg-gradient-to-t from-red-900 to-red-500/80" style={{ height: `${h}%` }} />)}
            </div>
            <p className="text-xs text-zinc-500 mt-3">Vista de actividad semanal. En próximos sprints irá conectada a datos reales.</p>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-xl font-black mb-4">Últimos clientes</h2>
          <div className="space-y-3">
            {clientes.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between border border-white/10 rounded-2xl p-4 bg-white/[0.02]">
                <div>
                  <p className="font-black">{c.nombre}</p>
                  <p className="text-sm text-zinc-500">{c.telefono || c.email || 'Sin contacto'}</p>
                </div>
                <span className="badge bg-zinc-800 border border-zinc-700 text-zinc-300">Cliente</span>
              </div>
            ))}
            {clientes.length === 0 && <p className="text-zinc-500">Todavía no hay clientes.</p>}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xl font-black mb-4">Avisos de stock bajo</h2>
          <div className="space-y-3">
            {stockBajo.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between border border-red-900/40 rounded-2xl p-4 bg-red-950/10">
                <div>
                  <p className="font-black">{s.referencia || s.descripcion}</p>
                  <p className="text-sm text-zinc-500">{s.tipo} · {s.ubicacion || 'Sin ubicación'}</p>
                </div>
                <span className="text-red-300 font-black">{s.cantidad}</span>
              </div>
            ))}
            {stockBajo.length === 0 && <p className="text-zinc-500">Stock correcto.</p>}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
