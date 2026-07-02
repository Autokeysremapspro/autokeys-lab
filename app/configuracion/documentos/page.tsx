'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import {
  getPlantillasDocumentos,
  nombreTipoDocumento,
  updatePlantillaDocumento,
  type PlantillaDocumento,
} from '@/lib/services/plantillasDocumentos'
import { FileText, Loader2, Palette, Save, ShieldCheck } from 'lucide-react'

const empty: PlantillaDocumento = {
  tipo_documento: 'factura',
  nombre: '',
  color_principal: '#DC2626',
  mostrar_logo: true,
  mostrar_sello: false,
  texto_cabecera: '',
  texto_pie: '',
  condiciones_legales: '',
  garantia: '',
  observaciones_defecto: '',
  formato: 'a4',
  activo: true,
}

export default function PlantillasDocumentosPage() {
  const [plantillas, setPlantillas] = useState<PlantillaDocumento[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<PlantillaDocumento>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getPlantillasDocumentos()
      setPlantillas(data)
      if (data.length) {
        setSelectedId(data[0].id || null)
        setForm({ ...empty, ...data[0] })
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las plantillas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function selectPlantilla(item: PlantillaDocumento) {
    setSelectedId(item.id || null)
    setForm({ ...empty, ...item })
    setError(null)
    setSuccess(null)
  }

  function setField<K extends keyof PlantillaDocumento>(key: K, value: PlantillaDocumento[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save() {
    if (!selectedId) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await updatePlantillaDocumento(selectedId, {
        nombre: form.nombre,
        color_principal: form.color_principal,
        mostrar_logo: form.mostrar_logo,
        mostrar_sello: form.mostrar_sello,
        texto_cabecera: form.texto_cabecera,
        texto_pie: form.texto_pie,
        condiciones_legales: form.condiciones_legales,
        garantia: form.garantia,
        observaciones_defecto: form.observaciones_defecto,
        formato: form.formato,
        activo: form.activo,
      })

      setPlantillas((items) => items.map((item) => (item.id === selectedId ? updated : item)))
      setForm({ ...empty, ...updated })
      setSuccess('Plantilla guardada correctamente.')
    } catch (err: any) {
      setError(err?.message || 'No se pudo guardar la plantilla')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-widest text-red-400 font-black">Configuración</div>
            <h1 className="text-4xl font-black mt-2">Plantillas de documentos</h1>
            <p className="text-zinc-500 mt-2 max-w-3xl">
              Personaliza cómo salen facturas, presupuestos, albaranes y tickets: logo, colores, textos legales, garantía y observaciones por defecto.
            </p>
          </div>
          <button onClick={save} disabled={saving || !selectedId} className="btn btn-red flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Guardar plantilla
          </button>
        </div>

        {error && <div className="card p-4 border border-red-500/30 text-red-300">{error}</div>}
        {success && <div className="card p-4 border border-emerald-500/30 text-emerald-300">{success}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <aside className="card p-4 xl:col-span-1">
            <div className="font-black text-lg mb-4 flex items-center gap-2"><FileText className="text-red-400" /> Documentos</div>
            {loading ? (
              <div className="text-zinc-500 flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Cargando...</div>
            ) : (
              <div className="space-y-2">
                {plantillas.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectPlantilla(item)}
                    className={`w-full text-left rounded-2xl px-4 py-3 border transition ${selectedId === item.id ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
                  >
                    <div className="font-black">{nombreTipoDocumento(item.tipo_documento)}</div>
                    <div className="text-xs text-zinc-500 mt-1">{item.nombre}</div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="xl:col-span-2 card p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-sm text-zinc-400 font-bold">Nombre de plantilla</span>
                <input className="input" value={form.nombre || ''} onChange={(e) => setField('nombre', e.target.value)} />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-zinc-400 font-bold">Formato</span>
                <select className="input" value={form.formato || 'a4'} onChange={(e) => setField('formato', e.target.value)}>
                  <option value="a4">A4</option>
                  <option value="ticket_80">Ticket 80 mm</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="space-y-2">
                <span className="text-sm text-zinc-400 font-bold flex items-center gap-2"><Palette size={16} /> Color principal</span>
                <input className="input h-12" type="color" value={form.color_principal || '#DC2626'} onChange={(e) => setField('color_principal', e.target.value)} />
              </label>

              <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-3">
                <span className="font-bold">Mostrar logo</span>
                <input type="checkbox" checked={!!form.mostrar_logo} onChange={(e) => setField('mostrar_logo', e.target.checked)} className="h-5 w-5 accent-red-600" />
              </label>

              <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between gap-3">
                <span className="font-bold">Mostrar sello</span>
                <input type="checkbox" checked={!!form.mostrar_sello} onChange={(e) => setField('mostrar_sello', e.target.checked)} className="h-5 w-5 accent-red-600" />
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm text-zinc-400 font-bold">Texto de cabecera</span>
              <textarea className="input min-h-[90px]" value={form.texto_cabecera || ''} onChange={(e) => setField('texto_cabecera', e.target.value)} />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm text-zinc-400 font-bold">Pie del documento</span>
              <textarea className="input min-h-[100px]" value={form.texto_pie || ''} onChange={(e) => setField('texto_pie', e.target.value)} />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm text-zinc-400 font-bold">Condiciones legales</span>
              <textarea className="input min-h-[130px]" value={form.condiciones_legales || ''} onChange={(e) => setField('condiciones_legales', e.target.value)} />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm text-zinc-400 font-bold">Garantía</span>
              <textarea className="input min-h-[120px]" value={form.garantia || ''} onChange={(e) => setField('garantia', e.target.value)} />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm text-zinc-400 font-bold">Observaciones por defecto</span>
              <textarea className="input min-h-[100px]" value={form.observaciones_defecto || ''} onChange={(e) => setField('observaciones_defecto', e.target.value)} />
            </label>
          </section>

          <aside className="card p-6 xl:col-span-1">
            <div className="flex items-center gap-2 text-emerald-400 font-black mb-4"><ShieldCheck /> Vista de uso</div>
            <div className="rounded-3xl bg-white text-zinc-950 p-5 shadow-2xl">
              <div className="flex items-start justify-between border-b pb-4" style={{ borderColor: form.color_principal || '#DC2626' }}>
                <div>
                  <div className="text-xs uppercase tracking-widest text-zinc-500">Autokeys Lab</div>
                  <div className="font-black text-2xl" style={{ color: form.color_principal || '#DC2626' }}>
                    {nombreTipoDocumento(form.tipo_documento)}
                  </div>
                </div>
                {form.mostrar_logo && <div className="font-black text-xs border rounded-xl px-3 py-2">LOGO</div>}
              </div>
              <p className="text-sm mt-4 whitespace-pre-line">{form.texto_cabecera || 'Cabecera del documento...'}</p>
              <div className="my-5 rounded-xl border p-3 text-sm">
                <div className="flex justify-between"><span>Servicio ejemplo</span><strong>150,00 €</strong></div>
                <div className="flex justify-between mt-2"><span>IVA 21%</span><strong>31,50 €</strong></div>
                <div className="flex justify-between mt-3 pt-3 border-t text-lg"><span>Total</span><strong>181,50 €</strong></div>
              </div>
              <p className="text-xs text-zinc-500 whitespace-pre-line">{form.texto_pie || 'Pie del documento...'}</p>
              {form.mostrar_sello && <div className="mt-4 border rounded-xl text-center text-xs font-black py-3">SELLO</div>}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
