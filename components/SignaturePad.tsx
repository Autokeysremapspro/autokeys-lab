'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'

export type SignaturePadHandle = {
  clear: () => void
  isEmpty: () => boolean
  toBlob: () => Promise<Blob>
}

type Props = {
  className?: string
}

function getPoint(event: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad({ className }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const emptyRef = useRef(true)
  const [version, setVersion] = useState(0)

  function resizeCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return

    const parent = canvas.parentElement
    const width = parent?.clientWidth || 320
    const height = 220
    const ratio = window.devicePixelRatio || 1

    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    emptyRef.current = true
    setVersion((current) => current + 1)
  }

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  useImperativeHandle(ref, () => ({
    clear() {
      resizeCanvas()
    },
    isEmpty() {
      return emptyRef.current
    },
    toBlob() {
      const canvas = canvasRef.current
      if (!canvas) return Promise.reject(new Error('No hay firma'))
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) reject(new Error('No se pudo generar la firma'))
          else resolve(blob)
        }, 'image/png')
      })
    },
  }))

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    drawingRef.current = true
    canvas.setPointerCapture(event.pointerId)
    const point = getPoint(event, canvas)
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const point = getPoint(event, canvas)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    emptyRef.current = false
  }

  function stop(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    drawingRef.current = false
    try {
      canvas.releasePointerCapture(event.pointerId)
    } catch {}
  }

  return (
    <div className={className}>
      <div className="rounded-3xl border border-white/10 bg-slate-950 p-3">
        <canvas
          key={version}
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
          className="block w-full touch-none rounded-2xl bg-slate-950"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>Firma con el dedo dentro del recuadro.</span>
        <button
          type="button"
          onClick={resizeCanvas}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 font-bold text-white"
        >
          <RotateCcw size={15} /> Limpiar
        </button>
      </div>
    </div>
  )
})

export default SignaturePad
