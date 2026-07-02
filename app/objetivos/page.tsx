'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import KpiProgress from '@/components/KpiProgress'
import { getKpiResumenActual, getObjetivoActual, guardarObjetivoActual, type KpiResumen, type ObjetivoKpi } from '@/lib/services/objetivos'
import { BarChart3, Loader2, Save, Target, TrendingDown, TrendingUp } from 'lucide-react'

function money(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

export default function ObjetivosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [objetivo, setObjetivo] = useState<Partial<ObjetivoKpi>>({})
  const [resumen, setResumen] = useState<KpiResumen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [obj, kpis] = await Promise.all([getObjetivoActual(), getKpiResumenActual()])
      setObjetivo(obj || {
        objetivo_facturacion: 0,
        objetivo_beneficio: 0,
        objetivo_file_service: 0,
        objetivo_ot_terminadas: 0,
      })
      setResumen(kpis)
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los objetivos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const saved = await guardarObjetivoActual(objetivo)
      setObjetivo(saved)
      setSuccess('Objetivos guardados correctamente')
    } catch (err: any) {
      setError(err?.message || 'No se pudieron guardar los objetivos')
    } finally {
      setSaving(false)
    }
  }

  function setField(key: keyof ObjetivoKpi, value: string) {
    setObjetivo((current) => ({ ...current, [key]: value === '' ? 0 : Number(value) }))
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-red-400 font-black uppercase tracking-wider text-xs">
              <Target size={18} /> Autokeys Core v3.1
            </div>
            <h1 className="text-4xl font-black mt-2">Objetivos / KPIs</h1>
            <p className="text-zinc-500 mt-2">Controla objetivos mensuales, avance de facturación, beneficio, File Service y OT terminadas.</p>
          </div>
          <button onClick={save} disabled={saving} className="btn btn-red flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Guardar objetivos
          </button>
        </div>

        {error && <div className="card p-4 border border-red-500/30 text-red-300">{error}</div>}
        {success && <div className="card p-4 border border-emerald-500/30 text-emerald-300">{success}</div>}

        {loading ? (
          <div className="card p-8 text-zinc-500 flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Cargando KPIs...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-5">
                <div className="flex items-center justify-between text-zinc-400"><span className="text-sm font-bold uppercase tracking-wider">Ingresos mes</span><TrendingUp size={20} /></div>
                <div className="text-3xl font-black mt-3">{money(resumen?.ingresosMes || 0)}</div>
                <p className="text-zinc-500 text-sm mt-1">Facturación no cancelada</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between text-zinc-400"><span className="text-sm font-bold uppercase tracking-wider">Gastos mes</span><TrendingDown size={20} /></div>
                <div className="text-3xl font-black mt-3">{money(resumen?.gastosMes || 0)}</div>
                <p className="text-zinc-500 text-sm mt-1">Gastos no cancelados</p>
              </div>
              <div className="card p-5 border border-emerald-500/20">
                <div className="flex items-center justify-between text-emerald-400"><span className="text-sm font-bold uppercase tracking-wider">Beneficio</span><BarChart3 size={20} /></div>
                <div className="text-3xl font-black mt-3">{money(resumen?.beneficioMes || 0)}</div>
                <p className="text-zinc-500 text-sm mt-1">Ingresos - gastos</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between text-zinc-400"><span className="text-sm font-bold uppercase tracking-wider">Margen</span><Target size={20} /></div>
                <div className="text-3xl font-black mt-3">{Math.round(resumen?.margenMes || 0)}%</div>
                <p className="text-zinc-500 text-sm mt-1">Margen bruto mensual</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <section className="xl:col-span-2 card p-6">
                <h2 className="text-2xl font-black mb-1">Progreso mensual</h2>
                <p className="text-zinc-500 mb-6">Comparativa entre datos reales y objetivos configurados.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <KpiProgress label="Facturación" value={resumen?.ingresosMes || 0} target={Number(objetivo.objetivo_facturacion || 0)} money />
                  <KpiProgress label="Beneficio" value={resumen?.beneficioMes || 0} target={Number(objetivo.objetivo_beneficio || 0)} money />
                  <KpiProgress label="File Service" value={resumen?.fileServiceMes || 0} target={Number(objetivo.objetivo_file_service || 0)} />
                  <KpiProgress label="OT terminadas" value={resumen?.otTerminadasMes || 0} target={Number(objetivo.objetivo_ot_terminadas || 0)} />
                </div>
              </section>

              <section className="card p-6">
                <h2 className="text-2xl font-black mb-1">Configurar objetivos</h2>
                <p className="text-zinc-500 mb-5">Objetivos del mes actual.</p>
                <div className="space-y-4">
                  <label className="block"><span className="text-sm font-bold text-zinc-400">Facturación objetivo (€)</span><input type="number" className="input mt-1" value={objetivo.objetivo_facturacion || ''} onChange={(e) => setField('objetivo_facturacion', e.target.value)} /></label>
                  <label className="block"><span className="text-sm font-bold text-zinc-400">Beneficio objetivo (€)</span><input type="number" className="input mt-1" value={objetivo.objetivo_beneficio || ''} onChange={(e) => setField('objetivo_beneficio', e.target.value)} /></label>
                  <label className="block"><span className="text-sm font-bold text-zinc-400">File Service objetivo</span><input type="number" className="input mt-1" value={objetivo.objetivo_file_service || ''} onChange={(e) => setField('objetivo_file_service', e.target.value)} /></label>
                  <label className="block"><span className="text-sm font-bold text-zinc-400">OT terminadas objetivo</span><input type="number" className="input mt-1" value={objetivo.objetivo_ot_terminadas || ''} onChange={(e) => setField('objetivo_ot_terminadas', e.target.value)} /></label>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
