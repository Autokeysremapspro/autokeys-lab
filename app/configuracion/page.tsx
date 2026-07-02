import AppShell from '@/components/AppShell'
import AdminCenter from '@/components/AdminCenter'

export default function ConfiguracionPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/30 p-6 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-red-400">Autokeys Core</p>
          <h1 className="mt-2 text-3xl font-black text-white lg:text-5xl">Centro de Administración</h1>
          <p className="mt-3 max-w-4xl text-slate-400">
            Configura empresa, usuarios, permisos, documentos, notificaciones, logs y mantenimiento general del ERP.
          </p>
        </div>

        <AdminCenter />
      </div>
    </AppShell>
  )
}
