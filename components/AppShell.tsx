'use client'

import ChatInterno from '@/components/ChatInterno'
import LabShell from '@/components/lab/LabShell'

/* Legacy pages keep AppShell as a compatibility import, but AppShell no longer
 * renders a second theme or duplicate page header. The page itself owns its
 * title/actions while LabShell provides the single AK Lab navigation chrome. */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LabShell>
        {children}
      </LabShell>
      <ChatInterno />
    </>
  )
}
