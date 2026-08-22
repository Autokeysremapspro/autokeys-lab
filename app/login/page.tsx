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
  Users,
  Car,
  FolderOpen,
  Receipt,
  UploadCloud,
  UserRound,
  UserPlus,
  ArrowRight,
} from 'lucide-react'
import { LabLogoMark } from '@/components/lab'

function getStandaloneMode() {
  if (typeof window === 'undefined') return false
  const nav = (window.navigator as Navigator & { standalone?: boolean }).standalone
  return Boolean(nav || window.matchMedia?.('(display-mode: standalone)').matches)
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
  const fallbackNext = useMemo(() => (typeof window === 'undefined' ? '/' : getStandaloneMode() ? '/mobile' : '/'), [])
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}${next}` },
      })
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
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#050608] text-white">
      <div
        className="pointer-events-none fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1588814547572-13d8fb9bda3d?auto=format&fit=crop&fm=jpg&q=82&w=2600')",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(3,5,7,.76)_0%,rgba(3,5,7,.86)_42%,rgba(3,5,7,.91)_56%,rgba(3,5,7,.84)_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_26%_42%,rgba(232,29,40,.16),transparent_28%),radial-gradient(circle_at_92%_42%,rgba(232,29,40,.12),transparent_26%),linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.22))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[.06] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-[2048px] lg:grid-cols-[49.7%_50.3%]">
        <section className="relative hidden min-h-[100dvh] overflow-hidden border-r border-white/[0.10] lg:flex lg:flex-col lg:justify-between lg:px-8 lg:py-8 xl:px-10 xl:py-9 2xl:px-12 2xl:py-10 [@media(min-width:1700px)]:px-16 [@media(min-width:1700px)]:py-12">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,5,7,.15),rgba(3,5,7,.38)_86%,rgba(3,5,7,.65))]" />
          <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#050608] via-[#050608]/48 to-transparent" />

          <div className="relative z-10 max-w-[690px]">
            <div className="flex items-center gap-4">
              <LabLogoMark size={62} />
              <div>
                <div className="text-[28px] font-semibold leading-none tracking-[-.025em] xl:text-[31px] 2xl:text-[34px]">Autokeys Lab</div>
                <div className="mt-2 text-[13px] text-zinc-300 xl:text-[14px]">by Autokeys Remaps Pro</div>
              </div>
            </div>

            <h1 className="mt-8 text-[31px] font-semibold leading-[1.03] tracking-[-.035em] xl:mt-10 xl:text-[35px] 2xl:text-[39px] [@media(min-width:1700px)]:text-[43px]">
              Acceso al <span className="text-[#f12632]">ERP</span> profesional
            </h1>
            <p className="mt-3 max-w-[560px] text-[13px] leading-5 text-zinc-300/85 xl:text-[14px] xl:leading-6 2xl:text-[15px]">
              Gestiona tu taller de forma eficiente: clientes, vehículos, expedientes, facturación y file service en un solo lugar.
            </p>

            <div className="mt-6 space-y-3 xl:mt-7 xl:space-y-3.5">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="flex max-w-[520px] items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#f12632]/30 bg-[#f12632]/[0.075] text-[#f12632] shadow-[inset_0_1px_0_rgba(255,255,255,.035)] xl:h-12 xl:w-12">
                      <Icon size={20} />
                    </div>
                    <div className="pt-0.5">
                      <div className="text-[12px] font-semibold text-zinc-100 xl:text-[13px]">{feature.title}</div>
                      <div className="mt-0.5 max-w-[370px] text-[10px] leading-4 text-zinc-400 xl:text-[11px]">{feature.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative z-10 mt-7 hidden rounded-[18px] border border-[#ef202d]/25 bg-[linear-gradient(145deg,rgba(9,12,16,.82),rgba(5,7,10,.74))] p-4 shadow-[0_24px_75px_rgba(0,0,0,.48),inset_0_1px_0_rgba(255,255,255,.035)] backdrop-blur-xl xl:block 2xl:p-5 [@media(max-height:820px)]:hidden">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px] opacity-75">
              <div className="absolute left-[18%] top-[37%] h-px w-[28%] bg-gradient-to-r from-transparent via-[#ef202d] to-[#ef202d]/60" />
              <div className="absolute right-[18%] top-[37%] h-px w-[28%] bg-gradient-to-l from-transparent via-[#ef202d] to-[#ef202d]/60" />
              <div className="absolute bottom-[26%] left-1/2 h-[28%] w-px -translate-x-1/2 bg-gradient-to-b from-[#ef202d]/70 to-transparent" />
              <div className="absolute left-[28%] top-[58%] h-px w-[18%] rotate-[18deg] bg-[#ef202d]/55" />
              <div className="absolute right-[28%] top-[58%] h-px w-[18%] -rotate-[18deg] bg-[#ef202d]/55" />
            </div>
            <div className="relative grid grid-cols-3 items-center gap-y-4 2xl:gap-y-5">
              <Module icon={Users} label="Clientes" />
              <div />
              <Module icon={FolderOpen} label="Expedientes" />
              <Module icon={Car} label="Vehículos" />
              <div className="mx-auto grid h-[78px] w-[96px] place-items-center rounded-[16px] border border-[#ef202d]/45 bg-[radial-gradient(circle_at_center,rgba(239,32,45,.30),rgba(7,9,12,.96)_64%)] shadow-[0_0_38px_rgba(239,32,45,.28)] 2xl:h-[86px] 2xl:w-[108px]">
                <span className="text-[24px] font-black italic tracking-[-.12em] text-[#ef202d] 2xl:text-[27px]">AK</span>
              </div>
              <Module icon={Receipt} label="Facturación" />
              <div />
              <Module icon={UploadCloud} label="File Service" />
              <div />
            </div>
          </div>

          <div className="relative z-10 mt-4 hidden text-center text-[9px] text-zinc-500 xl:block [@media(max-height:820px)]:hidden 2xl:text-[10px]">
            © 2026 <span className="text-[#ef202d]">Autokeys Lab</span> by Autokeys Remaps Pro. Todos los derechos reservados.
          </div>
        </section>

        <section className="relative flex min-h-[100dvh] items-center justify-center px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8 xl:px-10 2xl:px-12 [@media(min-width:1700px)]:px-16">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,7,10,.24),rgba(5,7,10,.03))] lg:bg-[linear-gradient(90deg,rgba(5,7,10,.58),rgba(5,7,10,.38))]" />

          <div className="relative z-10 w-full max-w-[700px]">
            <div className="mb-4 flex items-center gap-3 lg:hidden">
              <LabLogoMark size={46} />
              <div>
                <div className="text-[23px] font-semibold leading-none tracking-[-.025em]">Autokeys Lab</div>
                <div className="mt-1.5 text-[11px] text-zinc-400">by Autokeys Remaps Pro</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[20px] border border-white/[0.20] bg-[linear-gradient(160deg,rgba(14,17,22,.92),rgba(6,8,11,.90))] shadow-[0_38px_110px_rgba(0,0,0,.60),inset_0_1px_0_rgba(255,255,255,.045)] backdrop-blur-2xl sm:rounded-[24px] lg:rounded-[22px]">
              <div className="grid grid-cols-2 border-b border-white/[0.10] px-4 pt-4 sm:px-6 sm:pt-5 lg:px-7 lg:pt-5 xl:px-8">
                <button className="flex min-h-[54px] items-center justify-center gap-2 border-b-2 border-[#ef202d] bg-white/[0.02] px-3 text-[12px] font-semibold text-[#ef202d] sm:min-h-[58px] sm:text-[13px]">
                  <UserRound size={17} />
                  <span>Iniciar sesión</span>
                </button>
                <Link href="/register" className="flex min-h-[54px] items-center justify-center gap-2 px-3 text-[12px] font-medium text-zinc-500 transition hover:text-zinc-300 sm:min-h-[58px] sm:text-[13px]">
                  <UserPlus size={17} />
                  <span>Solicitar acceso</span>
                </Link>
              </div>

              {!resetMode ? (
                <div className="px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7 lg:px-8 lg:pb-7 xl:px-9 2xl:px-10">
                  <div>
                    <h2 className="text-[25px] font-semibold tracking-[-.03em] sm:text-[28px] 2xl:text-[30px]">Bienvenido de nuevo</h2>
                    <p className="mt-1.5 text-[12px] text-zinc-500 sm:text-[13px]">Inicia sesión para acceder a tu plataforma ERP.</p>
                  </div>

                  <form onSubmit={submit} className="mt-6 space-y-4 sm:mt-7">
                    <FieldLabel label="Correo electrónico">
                      <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="h-[50px] w-full rounded-[10px] border border-white/[0.13] bg-[#090c10]/90 pl-12 pr-4 text-[12px] outline-none transition focus:border-[#ef202d]/60 focus:shadow-[0_0_0_3px_rgba(239,32,45,.07)] sm:h-[52px] sm:text-[13px]"
                      />
                    </FieldLabel>

                    <FieldLabel label="Contraseña">
                      <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="h-[50px] w-full rounded-[10px] border border-white/[0.13] bg-[#090c10]/90 pl-12 pr-12 text-[12px] outline-none transition focus:border-[#ef202d]/60 focus:shadow-[0_0_0_3px_rgba(239,32,45,.07)] sm:h-[52px] sm:text-[13px]"
                      />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 transition hover:text-zinc-300" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </FieldLabel>

                    <div className="flex flex-col gap-3 text-[11px] sm:flex-row sm:items-center sm:justify-between sm:text-[12px]">
                      <label className="flex items-center gap-2 text-zinc-400">
                        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[#ef202d]" />
                        Recordar sesión
                      </label>
                      <button type="button" onClick={() => { setResetMode(true); setResetEmail(email) }} className="text-left font-medium text-[#ef202d] sm:text-right">¿Olvidaste tu contraseña?</button>
                    </div>

                    <button disabled={loading} className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[10px] border border-[#ff4750]/30 bg-gradient-to-r from-[#ef202d] via-[#ef202d] to-[#df1722] text-[14px] font-semibold shadow-[0_15px_40px_rgba(239,32,45,.24),inset_0_1px_0_rgba(255,255,255,.14)] transition hover:brightness-110 disabled:opacity-50 sm:h-[56px] sm:text-[15px]">
                      {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                      {!loading && <ArrowRight size={18} />}
                    </button>
                  </form>

                  <div className="my-5 flex items-center gap-3 text-[10px] text-zinc-600 sm:my-6 sm:text-[11px]">
                    <div className="h-px flex-1 bg-white/[0.09]" />
                    <span>o continúa con</span>
                    <div className="h-px flex-1 bg-white/[0.09]" />
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                    <button onClick={() => oauth('google')} className="flex h-[48px] items-center justify-center gap-2 rounded-[10px] border border-white/[0.12] bg-white/[0.025] text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.05] sm:h-[50px] sm:text-[12px]">
                      <span className="text-[18px] font-bold text-[#4285F4]">G</span>
                      Continuar con Google
                    </button>
                    <button onClick={() => oauth('azure')} className="flex h-[48px] items-center justify-center gap-2 rounded-[10px] border border-white/[0.12] bg-white/[0.025] text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.05] sm:h-[50px] sm:text-[12px]">
                      <span className="grid grid-cols-2 gap-[1px]">
                        <i className="h-2 w-2 bg-[#f35325]" />
                        <i className="h-2 w-2 bg-[#81bc06]" />
                        <i className="h-2 w-2 bg-[#05a6f0]" />
                        <i className="h-2 w-2 bg-[#ffba08]" />
                      </span>
                      Continuar con Microsoft
                    </button>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    <Contact icon={Mail} title="Email" value="info@autokeyspro.es" />
                    <Contact icon={Phone} title="Teléfono" value="+34 953 85 27 78" />
                    <Contact icon={MessageCircle} title="WhatsApp" value="+34 632 98 26 46" green />
                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-white/[0.11] bg-[#090c10]/88 px-4 py-3 text-[9px] leading-4 text-zinc-500 sm:text-[10px]">
                    <ShieldCheck size={17} className="shrink-0 text-[#ef202d]" />
                    <span>Conexión segura y cifrada. Utilizamos SSL y cumplimos con las normativas de privacidad.</span>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-7 sm:px-7 sm:py-8 lg:px-8 xl:px-9 2xl:px-10">
                  <h2 className="text-[24px] font-semibold tracking-[-.025em] sm:text-[27px]">Recuperar contraseña</h2>
                  <p className="mt-1.5 text-[12px] text-zinc-500 sm:text-[13px]">Te enviaremos un enlace seguro para restablecerla.</p>
                  <form onSubmit={submitReset} className="mt-6 space-y-4">
                    <FieldLabel label="Correo electrónico">
                      <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input required type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="h-[52px] w-full rounded-[10px] border border-white/[0.13] bg-[#090c10]/90 pl-12 pr-4 text-[13px] outline-none focus:border-[#ef202d]/60" />
                    </FieldLabel>
                    <button disabled={resetLoading} className="h-[54px] w-full rounded-[10px] bg-gradient-to-r from-[#ef202d] to-[#d91824] text-[13px] font-semibold shadow-[0_14px_36px_rgba(239,32,45,.22)] disabled:opacity-50">
                      {resetLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </button>
                    <button type="button" onClick={() => setResetMode(false)} className="w-full py-2 text-center text-[11px] text-zinc-500 transition hover:text-zinc-300">Volver a iniciar sesión</button>
                  </form>
                </div>
              )}
            </div>

            <div className="mt-4 text-center text-[9px] text-zinc-500 lg:hidden">
              © 2026 <span className="text-[#ef202d]">Autokeys Lab</span> by Autokeys Remaps Pro
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Module({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.13] bg-[#0b0e12]/90 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,.035)] 2xl:h-11 2xl:w-11">
        <Icon size={18} />
      </div>
      <span className="text-[9px] font-medium text-zinc-300 2xl:text-[10px]">{label}</span>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-medium text-zinc-300 sm:text-[12px]">{label}</span>
      <div className="relative">{children}</div>
    </label>
  )
}

function Contact({ icon: Icon, title, value, green = false }: { icon: any; title: string; value: string; green?: boolean }) {
  return (
    <div className="flex min-h-[58px] items-center gap-2.5 rounded-[10px] border border-white/[0.11] bg-[#090c10]/80 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.02)]">
      <Icon size={17} className={green ? 'shrink-0 text-[#28d764]' : 'shrink-0 text-[#ef202d]'} />
      <div className="min-w-0">
        <div className="text-[10px] font-medium text-zinc-300">{title}</div>
        <div className="truncate text-[9px] text-zinc-500">{value}</div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-[100dvh] place-items-center bg-[#050608] text-sm text-zinc-500">Cargando acceso seguro...</main>}>
      <LoginContent />
    </Suspense>
  )
}
