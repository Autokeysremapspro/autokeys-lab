'use client'

import type { ReactNode } from 'react'

/**
 * En Autokeys Core el acceso ya queda protegido por AppShell/Supabase.
 * Este gate se mantiene como punto de extensión para permisos futuros.
 */
export default function AKApprovalGate({ children }: { children: ReactNode }) {
  return <>{children}</>
}
