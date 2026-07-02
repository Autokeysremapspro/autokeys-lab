'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getConfiguracionEmpresa, saveConfiguracionEmpresa, type ConfiguracionEmpresa } from '@/lib/services/configuracion'

type FormState = Partial<ConfiguracionEmpresa>

const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-red-500'
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400'

export default function ConfigEmpresaForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({})

  useEffect(() => {
    getConfiguracionEmpresa()
      .then((data) => {
        if (data) setForm(data)
      })
      .catch((error) => toast.error(error.message || 'Error cargando configuración'))
      .finally(() => setLoading(false))
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      setSaving(true)
      const saved = await saveConfiguracionEmpresa(form)
      setForm(saved)
      toast.success('Configuración guardada')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-slate-400">Cargando configuración...</div>
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Datos de empresa</h2>
            <p className="text-sm text-slate-400">Estos datos se usarán en facturas, presupuestos, albaranes y garantías.</p>
          </div>
          <button type="submit" disabled={saving} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>Nombre comercial</label>
            <input className={inputClass} value={form.nombre_comercial || ''} onChange={(e) => update('nombre_comercial', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Razón social</label>
            <input className={inputClass} value={form.razon_social || ''} onChange={(e) => update('razon_social', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>CIF / NIF</label>
            <input className={inputClass} value={form.cif || ''} onChange={(e) => update('cif', e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <label className={labelClass}>Dirección</label>
            <input className={inputClass} value={form.direccion || ''} onChange={(e) => update('direccion', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Código postal</label>
            <input className={inputClass} value={form.codigo_postal || ''} onChange={(e) => update('codigo_postal', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Población</label>
            <input className={inputClass} value={form.poblacion || ''} onChange={(e) => update('poblacion', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Provincia</label>
            <input className={inputClass} value={form.provincia || ''} onChange={(e) => update('provincia', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input className={inputClass} value={form.telefono || ''} onChange={(e) => update('telefono', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Web</label>
            <input className={inputClass} value={form.web || ''} onChange={(e) => update('web', e.target.value)} />
          </div>
          <div className="lg:col-span-2">
            <label className={labelClass}>Logo URL</label>
            <input className={inputClass} value={form.logo_url || ''} onChange={(e) => update('logo_url', e.target.value)} placeholder="https://..." />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
        <h2 className="mb-5 text-lg font-bold text-white">Documentos y numeración</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className={labelClass}>IVA defecto</label>
            <input type="number" step="0.01" className={inputClass} value={form.iva_defecto ?? 21} onChange={(e) => update('iva_defecto', Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Prefijo OT</label>
            <input className={inputClass} value={form.prefijo_ot || ''} onChange={(e) => update('prefijo_ot', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Factura</label>
            <input className={inputClass} value={form.prefijo_factura || ''} onChange={(e) => update('prefijo_factura', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Presupuesto</label>
            <input className={inputClass} value={form.prefijo_presupuesto || ''} onChange={(e) => update('prefijo_presupuesto', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Albarán</label>
            <input className={inputClass} value={form.prefijo_albaran || ''} onChange={(e) => update('prefijo_albaran', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Ticket</label>
            <input className={inputClass} value={form.prefijo_ticket || ''} onChange={(e) => update('prefijo_ticket', e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
        <h2 className="mb-5 text-lg font-bold text-white">Textos legales</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className={labelClass}>Pie de factura</label>
            <textarea rows={6} className={inputClass} value={form.texto_pie_factura || ''} onChange={(e) => update('texto_pie_factura', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Texto de garantía</label>
            <textarea rows={6} className={inputClass} value={form.texto_garantia || ''} onChange={(e) => update('texto_garantia', e.target.value)} />
          </div>
        </div>
      </section>
    </form>
  )
}
