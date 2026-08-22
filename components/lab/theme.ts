// Tokens de tono compartidos por el nuevo shell "Autokeys Lab" (acento rojo).
// Un mismo set de colores para iconos de stat cards, badges de estado y puntos de semáforo.

export type LabTone = 'red' | 'orange' | 'blue' | 'green' | 'purple' | 'zinc'

export const toneIconTile: Record<LabTone, string> = {
  red: 'bg-[#ef1e35]/15 text-[#ff5468] ring-1 ring-[#ef1e35]/25',
  orange: 'bg-[#f5820a]/15 text-[#ffab52] ring-1 ring-[#f5820a]/25',
  blue: 'bg-[#2f7bf6]/15 text-[#6ea6ff] ring-1 ring-[#2f7bf6]/25',
  green: 'bg-[#17b06b]/15 text-[#4ade95] ring-1 ring-[#17b06b]/25',
  purple: 'bg-[#8b5cf6]/15 text-[#b39bff] ring-1 ring-[#8b5cf6]/25',
  zinc: 'bg-white/[.06] text-zinc-300 ring-1 ring-white/10',
}

export const toneDot: Record<LabTone, string> = {
  red: 'bg-[#ff5468]',
  orange: 'bg-[#ffab52]',
  blue: 'bg-[#6ea6ff]',
  green: 'bg-[#4ade95]',
  purple: 'bg-[#b39bff]',
  zinc: 'bg-zinc-400',
}

export const toneText: Record<LabTone, string> = {
  red: 'text-[#ff5468]',
  orange: 'text-[#ffab52]',
  blue: 'text-[#6ea6ff]',
  green: 'text-[#4ade95]',
  purple: 'text-[#b39bff]',
  zinc: 'text-zinc-300',
}

export type BadgeTone = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'zinc'

export const badgeClasses: Record<BadgeTone, string> = {
  green: 'bg-[#17b06b]/15 text-[#4ade95] border border-[#17b06b]/25',
  amber: 'bg-[#f5820a]/15 text-[#ffab52] border border-[#f5820a]/25',
  red: 'bg-[#ef1e35]/15 text-[#ff5468] border border-[#ef1e35]/25',
  blue: 'bg-[#2f7bf6]/15 text-[#6ea6ff] border border-[#2f7bf6]/25',
  purple: 'bg-[#8b5cf6]/15 text-[#b39bff] border border-[#8b5cf6]/25',
  zinc: 'bg-white/[.06] text-zinc-300 border border-white/10',
}

// Mapea estados de negocio habituales (facturas, expedientes, stock...) a un tono de badge.
export function statusTone(status?: string | null): BadgeTone {
  const s = String(status || '').toLowerCase()
  if (['pagada', 'pagado', 'activo', 'ok', 'entregado', 'entregada', 'completado', 'completada', 'finalizado', 'finalizada'].includes(s)) return 'green'
  if (['pendiente', 'bajo stock', 'programar pedido', 'en proceso', 'en_proceso', 'analizando', 'abierto', 'en curso'].includes(s)) return 'amber'
  if (['vencida', 'vencido', 'critico', 'crítico', 'cancelado', 'cancelada', 'inactivo', 'urgente', 'alta'].includes(s)) return 'red'
  if (['cobro parcial', 'en cola', 'en_cola', 'informativo', 'media'].includes(s)) return 'blue'
  if (['platinum', 'gold', 'baja'].includes(s)) return 'purple'
  return 'zinc'
}

export const LAB_BG = '#07080b'
export const LAB_PANEL = 'linear-gradient(180deg, rgba(19,21,27,.92), rgba(9,10,13,.94))'
