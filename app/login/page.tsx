'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(next)
      }
    })
  }, [router, next])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    try {
      setLoading(true)
      const cleanEmail = email.trim().toLowerCase()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) throw error

      const authUserId = data.user?.id

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios_app')
        .select('*')
        .or(`auth_user_id.eq.${authUserId},email.eq.${cleanEmail}`)
        .maybeSingle()

      if (perfilError) throw perfilError

      if (!perfil) {
        await supabase.auth.signOut()
        toast.error('Tu cuenta Auth existe, pero no tienes usuario interno vinculado')
        return
      }

      if (perfil.activo === false) {
        await supabase.auth.signOut()
        toast.error('Usuario bloqueado. Contacta con administración')
        return
      }

      if (!perfil.auth_user_id && authUserId) {
        await supabase
          .from('usuarios_app')
          .update({ auth_user_id: authUserId })
          .eq('id', perfil.id)
      }

      await supabase
        .from('usuarios_app')
        .update({ ultimo_acceso: new Date().toISOString() })
        .eq('id', perfil.id)

      toast.success(`Bienvenido, ${perfil.nombre || cleanEmail}`)
      router.push(next)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4 bg-[radial-gradient(circle_at_top,#2a0004,#070707_45%)] text-zinc-100">
      <form onSubmit={submit} className="card w-full max-w-md p-8 space-y-5">
        <div>
          <p className="text-xs text-red-400 uppercase tracking-[0.24em] font-black">
            Acceso interno
          </p>
          <h1 className="text-4xl font-black mt-2">
            AUTOKEYS <span className="text-red-500">CORE</span>
          </h1>
          <p className="text-zinc-500 mt-2">
            Laboratorio de electrónica · ECU · IMMO · Llaves
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <Mail size={16} /> Email
          </label>
          <input
            required
            type="email"
            className="w-full"
            placeholder="info@autokeyspro.es"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-zinc-300 flex items-center gap-2">
            <LockKeyhole size={16} /> Contraseña
          </label>
          <input
            required
            className="w-full"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button disabled={loading} className="btn btn-red w-full disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-sm text-zinc-400 flex gap-3">
          <ShieldCheck className="text-emerald-300 shrink-0" size={20} />
          <p>
            El acceso se gestiona con Supabase Auth. Los usuarios y roles se administran desde el apartado Usuarios.
          </p>
        </div>
      </form>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center p-4 bg-[radial-gradient(circle_at_top,#2a0004,#070707_45%)] text-zinc-100">
          <div className="card w-full max-w-md p-8 text-center text-zinc-400">
            Cargando acceso...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
