import { badgeClasses, statusTone, type BadgeTone } from './theme'

export default function LabBadge({
  children,
  tone,
  status,
  dot = false,
}: {
  children: React.ReactNode
  tone?: BadgeTone
  status?: string | null
  dot?: boolean
}) {
  const resolvedTone = tone || statusTone(status)
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClasses[resolvedTone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
