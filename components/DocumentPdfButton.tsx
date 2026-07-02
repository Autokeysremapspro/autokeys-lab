'use client'

import { FileText } from 'lucide-react'

type Props = {
  id: string
  label?: string
  className?: string
}

export default function DocumentPdfButton({
  id,
  label = 'Descargar PDF',
  className = 'btn btn-dark flex items-center gap-2',
}: Props) {
  function openPdf() {
    window.open(`/api/documentos/${id}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <button type="button" onClick={openPdf} className={className}>
      <FileText size={18} />
      {label}
    </button>
  )
}
