'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LabLogoMark } from '@/components/lab'

export default function RestablecerPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session))
      setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setHasSession(true)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      toast.success('Contraseña actualizada')
      await supabase.auth.signOut()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#07080b] p-4 text-zinc-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0f14] p-8">
        <div className="mb-6 flex items-center gap-3">
          <LabLogoMark size={40} />
          <div>
            <div className="text-lg font-bold text-white">Autokeys Lab</div>
            <div className="text-xs text-zinc-500">Restablecer contraseña</div>
          </div>
        </div>

        {!ready ? (
          <p className="text-sm text-zinc-500">Comprobando enlace...</p>
        ) : done ? (
          <div>
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#4ade95]/20 bg-[#4ade95]/[0.06] p-4 text-sm text-[#4ade95]">
              <ShieldCheck size={18} /> Tu contraseña se ha actualizado correctamente.
            </div>
            <button onClick={() => router.replace('/login')} className="w-full rounded-xl bg-[#c81f2a] py-3 text-sm font-bold text-white hover:bg-[#e2242f]">
              Ir a iniciar sesión
            </button>
          </div>
        ) : !hasSession ? (
          <div>
            <p className="text-sm text-zinc-400">Este enlace no es válido o ha caducado. Solicita uno nuevo desde la pantalla de inicio de sesión.</p>
            <button onClick={() => router.replace('/login')} className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-bold text-zinc-300 hover:bg-white/[0.06]">
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-zinc-500">Elige una contraseña nueva para tu cuenta.</p>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-zinc-400">Nueva contraseña</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full !pl-10 !pr-10 text-sm" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-zinc-400">Confirmar contraseña</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input required type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••••••" className="w-full !pl-10 text-sm" />
              </div>
            </label>
            <button disabled={loading} className="w-full rounded-xl bg-[#c81f2a] py-3 text-sm font-bold text-white hover:bg-[#e2242f] disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
