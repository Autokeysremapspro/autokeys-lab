'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

function getStandaloneMode() {
  if (typeof window === 'undefined') return false

  const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches

  return Boolean(navigatorStandalone || displayModeStandalone)
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const fallbackNext = useMemo(() => {
    if (typeof window === 'undefined') return '/'
    return getStandaloneMode() ? '/mobile' : '/'
  }, [])

  const next = searchParams.get('next') || fallbackNext
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
      router.replace(next)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="ak-v5-bg min-h-screen text-white">
      <section className="relative z-10 grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
        <div className="flex items-center justify-center px-5 py-10 lg:px-12">
          <form onSubmit={submit} className="ak-v5-glass w-full max-w-[500px] rounded-[32px] p-7 sm:p-10">
            <div className="ak-v5-pill"><span className="ak-v5-dot"/> Acceso interno seguro</div><div className="ak-v5-kicker mt-8">Autokeys Core</div><h1 className="ak-v5-title mt-3 text-5xl sm:text-6xl">Mission<br/>Control.</h1><p className="mt-5 text-sm leading-7 text-white/38">Gestión integral del laboratorio, producción AK Cloud y control operativo.</p>
            <div className="mt-9 space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold text-white/45">Email corporativo</span><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"/><input required type="email" className="ak-v5-input !pl-12" placeholder="info@autokeyspro.es" value={email} onChange={e=>setEmail(e.target.value)}/></div></label><label className="block"><span className="mb-2 block text-xs font-bold text-white/45">Contraseña</span><div className="relative"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"/><input required className="ak-v5-input !pl-12" placeholder="••••••••••••" type="password" value={password} onChange={e=>setPassword(e.target.value)}/></div></label></div><button disabled={loading} className="ak-v5-button mt-8 w-full !py-4">{loading?'Verificando identidad...':'Entrar al sistema'}</button><div className="mt-7 flex gap-3 rounded-2xl border border-[#53e6a8]/15 bg-[#53e6a8]/[.045] p-4 text-xs leading-5 text-white/38"><ShieldCheck className="shrink-0 text-[#53e6a8]" size={20}/>Sesión protegida mediante Supabase Auth y permisos internos por rol.</div>
          </form>
        </div>
        <div className="relative hidden overflow-hidden border-l border-white/[.06] lg:block"><div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_45%,rgba(229,160,93,.16),transparent_30%),linear-gradient(135deg,#0b1018,#05070a)]"/><div className="absolute inset-0 opacity-[.18] [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:48px_48px]"/><div className="relative flex h-full items-center justify-center p-14"><div className="w-full max-w-[680px]"><div className="ak-v5-terminal ak-v5-scan rounded-[28px] p-7"><div className="flex items-center justify-between"><div className="text-xs font-black uppercase tracking-[.2em] text-[#67e8d1]">System overview</div><span className="ak-v5-pill"><span className="ak-v5-dot"/> Online</span></div><div className="mt-8 grid grid-cols-2 gap-3"><div className="ak-v5-stat"><div className="text-xs text-white/28">Laboratorio</div><div className="mt-3 text-3xl font-black">OPERATIVO</div></div><div className="ak-v5-stat"><div className="text-xs text-white/28">AK Cloud</div><div className="mt-3 text-3xl font-black text-[#67e8d1]">SYNC</div></div><div className="ak-v5-stat"><div className="text-xs text-white/28">Seguridad</div><div className="mt-3 text-3xl font-black text-[#53e6a8]">ACTIVE</div></div><div className="ak-v5-stat"><div className="text-xs text-white/28">Entorno</div><div className="mt-3 text-3xl font-black text-[#ffd09a]">PROD</div></div></div><div className="mt-5 space-y-3 text-xs">{['database connection','authentication gateway','storage services','realtime events'].map((x,i)=><div key={x} className="flex items-center justify-between border-b border-white/[.055] pb-3"><span className="text-white/28">{x}</span><span className="text-[#53e6a8]">✓ ready</span></div>)}</div></div></div></div></div>
      </section>
    </main>
  )}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center p-4 bg-[radial-gradient(circle_at_top,#3a2412,#0a0d12_45%)] text-zinc-100">
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
