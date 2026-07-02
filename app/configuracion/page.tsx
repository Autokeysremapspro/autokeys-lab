import AppShell from '@/components/AppShell'
import ConfigEmpresaForm from '@/components/ConfigEmpresaForm'

export default function ConfiguracionPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-red-400">Autokeys Core</p>
          <h1 className="mt-2 text-3xl font-black text-white">Configuración</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Ajustes de empresa, numeración y textos que utilizará el ERP en documentos y procesos administrativos.
          </p>
        </div>
        <ConfigEmpresaForm />
      </div>
    </AppShell>
  )
}
