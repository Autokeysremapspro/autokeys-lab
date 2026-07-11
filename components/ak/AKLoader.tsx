export default function AKLoader({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm font-bold text-zinc-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-red-500" />
      {label}
    </div>
  )
}
