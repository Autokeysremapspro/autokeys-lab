'use client'

import { useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ArchivosProPanel from '@/components/ArchivosProPanel'

export default function ExpedienteArchivosPage() {
  const params = useParams()
  const expedienteId = String(params?.id || '')

  return (
    <AppShell>
      <ArchivosProPanel expedienteId={expedienteId} />
    </AppShell>
  )
}
