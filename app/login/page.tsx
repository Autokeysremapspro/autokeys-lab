'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Layers,
  MonitorCheck,
  Headset,
  Phone,
  MessageCircle,
} from 'lucide-react'
import { LabLogoMark } from '@/components/lab'

function getStandaloneMode() {
  if (typeof window === 'undefined') return false
  const navigatorStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches
  return Boolean(navigatorStandalone || displayModeStandalone)
}

const FEATURES = [
  { icon: ShieldCheck, title: 'Acceso seguro', desc: 'Protegemos tus datos con los más altos estándares de seguridad.' },
  { icon: Layers, title: 'Gestión centralizada', desc: 'Toda la información de tu taller organizada y siempre disponible.' },
  { icon: MonitorCheck, title: 'Seguimiento del taller', desc: 'Controla trabajos, expedientes y estado de cada proyecto en tiempo real.' },
  { icon: Headset, title: 'Soporte técnico', desc: 'Asistencia especializada para que tu taller nunca se detenga.' },
]

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
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next)
    })
  }, [router, next])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    try {
      setLoading(true)
      const cleanEmail = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      if (error) throw error

      const authUserId = data.user?.id
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios_app')
        .select('*')
        .or(`auth_user_id.eq.${authUserId},email.eq.${cleanEmail}`)
        .maybeSingle()
      if (perfilError) throw perfilError

      if (perfil) {
        if (perfil.activo === false) {
          await supabase.auth.signOut()
          toast.error('Usuario bloqueado. Contacta con administración')
          return
        }
        if (!perfil.auth_user_id && authUserId) {
          await supabase.from('usuarios_app').update({ auth_user_id: authUserId }).eq('id', perfil.id)
        }
        await supabase.from('usuarios_app').update({ ultimo_acceso: new Date().toISOString() }).eq('id', perfil.id)

        toast.success(`Bienvenido, ${perfil.nombre || cleanEmail}`)
        router.replace(next)
        router.refresh()
        return
      }

      // No es staff interno — comprobamos si es una cuenta de distribuidor
      // (portal separado en /mi-cuenta, con su propia tarifa de precios).
      const { data: distribuidor, error: distError } = await supabase
        .from('akcloud_distribuidores')
        .select('id, empresa, estado')
        .eq('auth_user_id', authUserId)
        .maybeSingle()
      if (distError) throw distError

      if (distribuidor) {
        if (distribuidor.estado !== 'activo') {
          await supabase.auth.signOut()
          toast.error(`Tu cuenta está ${distribuidor.estado}. Contacta con Autokeys Lab.`)
          return
        }
        toast.success(`Bienvenido, ${distribuidor.empresa}`)
        router.replace(next.startsWith('/mi-cuenta') ? next : '/mi-cuenta')
        router.refresh()
        return
      }

      await supabase.auth.signOut()
      toast.error('Tu cuenta no tiene un perfil vinculado en Autokeys Lab')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function oauth(provider: 'google' | 'azure') {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}${next}` } })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Este proveedor no está configurado todavía')
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault()
    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/restablecer-password`,
      })
      if (error) throw error
      toast.success('Te hemos enviado un email para restablecer tu contraseña')
      setResetMode(false)
    } catch (error: any) {
      toast.error(error.message || 'No se pudo enviar el email de recuperación')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      <div className="grid min-h-screen xl:grid-cols-2">
        <div className="relative hidden flex-col justify-between gap-10 overflow-hidden p-10 xl:flex xl:p-14 2xl:p-16">
          <img
            src="/login-hero.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-[center_32%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080b]/40 via-transparent to-transparent" />

          <div className="relative flex items-center">
            <LabLogoMark size={52} />
          </div>

          <div className="relative">
            <h1 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,.6)] sm:text-5xl">
              Acceso al <span className="text-[#ff3b46]">ERP</span> profesional
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-zinc-200 drop-shadow-[0_1px_6px_rgba(0,0,0,.6)]">
              Gestiona tu taller de forma eficiente: clientes, vehículos, expedientes, facturación y file service en un solo lugar.
            </p>

            <div className="mt-9 space-y-4">
              {FEATURES.map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.title} className="flex items-start gap-3.5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#c81f2a]/30 bg-black/40 text-[#ff5468] backdrop-blur-sm"><Icon size={20} /></div>
                    <div>
                      <div className="text-sm font-bold text-white">{f.title}</div>
                      <div className="text-xs leading-5 text-zinc-300">{f.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="relative text-xs text-zinc-400">© 2024 <span className="font-bold text-zinc-200">Autokeys Lab</span> by Autokeys Remaps Pro. Todos los derechos reservados.</p>
        </div>

        <div className="flex items-center justify-center p-6 py-10 sm:p-10 xl:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center xl:hidden">
              <LabLogoMark size={44} />
            </div>

            {!resetMode ? (
              <>
                <h2 className="text-2xl font-bold text-white">Bienvenido de nuevo</h2>
                <p className="mt-1 text-sm text-zinc-500">Inicia sesión para acceder a tu plataforma ERP.</p>

                <form onSubmit={submit} className="mt-7 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-zinc-400">Correo electrónico</span>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full !pl-10 text-sm" />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-zinc-400">Contraseña</span>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input required type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••••" className="w-full !pl-10 !pr-10 text-sm" />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 text-zinc-400">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[#c81f2a]" />
                      Recordar sesión
                    </label>
                    <button type="button" onClick={() => { setResetMode(true); setResetEmail(email) }} className="font-bold text-[#ff5468] hover:text-[#ff7a86]">¿Olvidaste tu contraseña?</button>
                  </div>

                  <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c81f2a] py-3.5 text-sm font-bold text-white transition hover:bg-[#e2242f] disabled:opacity-60">
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión →'}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3 text-xs text-zinc-600">
                  <div className="h-px flex-1 bg-white/10" /> o continúa con <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => oauth('google')} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-bold text-zinc-300 hover:bg-white/[0.05]">
                    <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.96 11.96 0 000 12c0 1.93.46 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/></svg>
                    Continuar con Google
                  </button>
                  <button onClick={() => oauth('azure')} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2.5 text-xs font-bold text-zinc-300 hover:bg-white/[0.05]">
                    <svg width="14" height="14" viewBox="0 0 23 23"><path fill="#F35325" d="M1 1h10v10H1z"/><path fill="#81BC06" d="M12 1h10v10H12z"/><path fill="#05A6F0" d="M1 12h10v10H1z"/><path fill="#FFBA08" d="M12 12h10v10H12z"/></svg>
                    Continuar con Microsoft
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  <a href="mailto:info@autokeyspro.es" className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-2 py-3 text-center hover:bg-white/[0.04]">
                    <Mail size={15} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-500">Email</span>
                    <span className="truncate text-[10px] text-zinc-400">info@autokeyspro.es</span>
                  </a>
                  <a href="tel:+34953852778" className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-2 py-3 text-center hover:bg-white/[0.04]">
                    <Phone size={15} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-500">Teléfono</span>
                    <span className="text-[10px] text-zinc-400">+34 953 85 27 78</span>
                  </a>
                  <a href="https://wa.me/34632982646" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-2 py-3 text-center hover:bg-white/[0.04]">
                    <MessageCircle size={15} className="text-zinc-500" />
                    <span className="text-[10px] font-bold text-zinc-500">WhatsApp</span>
                    <span className="text-[10px] text-zinc-400">+34 632 98 26 46</span>
                  </a>
                </div>

                <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-[#4ade95]/20 bg-[#4ade95]/[0.05] p-3.5 text-xs text-zinc-400">
                  <ShieldCheck size={16} className="shrink-0 text-[#4ade95]" />
                  Conexión segura y cifrada. Utilizamos SSL y cumplimos con las normativas de privacidad.
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white">Recuperar contraseña</h2>
                <p className="mt-1 text-sm text-zinc-500">Te enviaremos un enlace para restablecerla.</p>
                <form onSubmit={submitReset} className="mt-7 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-zinc-400">Correo electrónico</span>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input required type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="tu@email.com" className="w-full !pl-10 text-sm" />
                    </div>
                  </label>
                  <button disabled={resetLoading} className="w-full rounded-xl bg-[#c81f2a] py-3.5 text-sm font-bold text-white hover:bg-[#e2242f] disabled:opacity-60">
                    {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                  <button type="button" onClick={() => setResetMode(false)} className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-300">Volver a iniciar sesión</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#07080b] p-4 text-zinc-100">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0e0f14] p-8 text-center text-zinc-400">Cargando acceso...</div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
