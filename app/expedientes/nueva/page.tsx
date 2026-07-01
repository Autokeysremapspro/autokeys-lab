import AppShell from '@/components/AppShell'
import WorkOrderWizard from '@/components/WorkOrderWizard'

export default function NuevaOTPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <p className="text-sm text-red-400 font-bold uppercase tracking-[0.2em]">Nuevo trabajo</p>
        <h2 className="text-3xl font-black mt-1">Nueva Orden de Trabajo</h2>
        <p className="text-zinc-500 mt-2">Asistente rápido para recepción y laboratorio.</p>
      </div>
      <WorkOrderWizard />
    </AppShell>
  )
}
