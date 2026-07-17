'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, ChevronRight, Globe2, Mail, MapPin, Phone, ShieldCheck, Sparkles, User, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const specialities = ['File Service', 'Reprogramación', 'Electrónica ECU', 'Llaves e inmovilizadores', 'Diagnosis avanzada', 'Taller mecánico']
const tools = ['KESS3', 'Magic FLEX', 'Autotuner', 'CMDFlash', 'PCMFlash', 'KTAG', 'MPPS', 'Autel', 'Xhorse', 'Otra']

const initialForm = {
  empresa: '', razon_social: '', nif: '', nombre: '', apellidos: '', cargo: '', email: '', telefono: '', password: '',
  pais: 'España', provincia: '', ciudad: '', direccion: '', codigo_postal: '', web: '', especialidad: '', experiencia_anios: '',
  herramientas: [] as string[], observaciones: '', acepta: false,
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(initialForm)
  const progress = useMemo(() => step * 25, [step])

  function field<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggleTool(tool: string) {
    field('herramientas', form.herramientas.includes(tool) ? form.herramientas.filter((item) => item !== tool) : [...form.herramientas, tool])
  }

  function validateCurrent() {
    if (step === 1 && (!form.empresa.trim() || !form.nif.trim())) return 'Completa empresa y NIF/CIF'
    if (step === 2 && (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim() || form.password.length < 6)) return 'Completa contacto, email, teléfono y una contraseña de mínimo 6 caracteres'
    if (step === 3 && (!form.pais.trim() || !form.ciudad.trim() || !form.especialidad)) return 'Completa ubicación y especialidad principal'
    if (step === 4 && !form.acepta) return 'Debes aceptar la revisión y las condiciones de acceso'
    return null
  }

  function next() {
    const error = validateCurrent()
    if (error) return toast.error(error)
    setStep((value) => Math.min(4, value + 1))
  }

  async function submit() {
    const validation = validateCurrent()
    if (validation) return toast.error(validation)
    setLoading(true)

    try {
      const { data: signUp, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            empresa: form.empresa.trim(),
            nombre: `${form.nombre} ${form.apellidos}`.trim(),
            tipo_usuario: 'distribuidor',
            estado_acceso: 'pendiente',
          },
        },
      })
      if (authError) throw authError
      if (!signUp.user) throw new Error('No se pudo crear la solicitud de acceso')

      const { error: requestError } = await supabase.from('akcloud_solicitudes_distribuidores').insert({
        auth_user_id: signUp.user.id,
        email: form.email.trim().toLowerCase(),
        empresa: form.empresa.trim(),
        razon_social: form.razon_social.trim() || null,
        nif: form.nif.trim(),
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim() || null,
        cargo: form.cargo.trim() || null,
        telefono: form.telefono.trim(),
        pais: form.pais.trim(),
        provincia: form.provincia.trim() || null,
        ciudad: form.ciudad.trim(),
        direccion: form.direccion.trim() || null,
        codigo_postal: form.codigo_postal.trim() || null,
        web: form.web.trim() || null,
        especialidad: form.especialidad,
        experiencia_anios: form.experiencia_anios ? Number(form.experiencia_anios) : null,
        herramientas: form.herramientas,
        observaciones: form.observaciones.trim() || null,
        estado: 'pendiente',
      })
      if (requestError) throw requestError

      toast.success('Solicitud enviada a Autokeys Core')
      router.replace('/solicitud-enviada?estado=pendiente')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#030303] text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(217,4,41,.23),transparent_28%),radial-gradient(circle_at_85%_70%,rgba(127,29,29,.16),transparent_32%)]" />
      <div className="fixed inset-0 opacity-[.07] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:80px_80px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[.78fr_1.22fr]">
        <aside className="relative hidden overflow-hidden border-r border-white/10 lg:block">
          <div className="absolute inset-0 bg-[url('/images/login/ak-login-hero.webp')] bg-cover bg-center opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/65 to-[#050507]" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <Link href="/" className="inline-flex items-center gap-3"><img src="/images/login/autokeys-logo-small.webp" alt="Autokeys" className="w-56" /></Link>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-red-300"><Sparkles size={15}/> Acceso profesional</span>
              <h1 className="mt-6 text-5xl font-black uppercase italic leading-[.95] xl:text-7xl">Únete a la red de <span className="text-red-500">Autokeys.</span></h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/55">Solicita acceso al ecosistema privado para distribuidores. Cada alta es revisada desde Autokeys Core.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {['Cuenta verificada', 'Precios profesionales', 'Soporte técnico'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/45 p-4 text-sm font-black backdrop-blur-xl"><CheckCircle2 className="mb-3 text-red-400" size={20}/>{item}</div>)}
            </div>
          </div>
        </aside>

        <section className="relative flex items-center justify-center px-5 py-8 md:px-10 xl:px-16">
          <div className="w-full max-w-4xl rounded-[2rem] border border-white/12 bg-[#090b0f]/92 p-6 shadow-[0_50px_140px_rgba(0,0,0,.72)] backdrop-blur-2xl md:p-9">
            <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[.25em] text-red-400">Solicitud de distribuidor</p>
                <h2 className="mt-2 text-3xl font-black uppercase md:text-4xl">{['Empresa','Contacto y acceso','Actividad profesional','Revisión final'][step-1]}</h2>
              </div>
              <div className="min-w-[180px]"><div className="flex justify-between text-xs font-black text-white/40"><span>Paso {step}/4</span><span>{progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-red-700 to-red-400 transition-all" style={{width:`${progress}%`}} /></div></div>
            </div>

            <div className="mt-7 min-h-[390px]">
              {step === 1 && <div className="grid gap-4 md:grid-cols-2"><Input label="Nombre comercial *" icon={Building2} value={form.empresa} onChange={(v)=>field('empresa',v)}/><Input label="Razón social" icon={Building2} value={form.razon_social} onChange={(v)=>field('razon_social',v)}/><Input label="NIF / CIF *" icon={ShieldCheck} value={form.nif} onChange={(v)=>field('nif',v)}/><Input label="Página web" icon={Globe2} value={form.web} onChange={(v)=>field('web',v)} placeholder="https://..."/></div>}
              {step === 2 && <div className="grid gap-4 md:grid-cols-2"><Input label="Nombre *" icon={User} value={form.nombre} onChange={(v)=>field('nombre',v)}/><Input label="Apellidos" icon={User} value={form.apellidos} onChange={(v)=>field('apellidos',v)}/><Input label="Cargo" icon={Wrench} value={form.cargo} onChange={(v)=>field('cargo',v)}/><Input label="Teléfono *" icon={Phone} value={form.telefono} onChange={(v)=>field('telefono',v)}/><Input label="Email *" icon={Mail} type="email" value={form.email} onChange={(v)=>field('email',v)}/><Input label="Contraseña *" icon={ShieldCheck} type="password" value={form.password} onChange={(v)=>field('password',v)}/></div>}
              {step === 3 && <div className="space-y-6"><div className="grid gap-4 md:grid-cols-3"><Input label="País *" icon={Globe2} value={form.pais} onChange={(v)=>field('pais',v)}/><Input label="Provincia" icon={MapPin} value={form.provincia} onChange={(v)=>field('provincia',v)}/><Input label="Ciudad *" icon={MapPin} value={form.ciudad} onChange={(v)=>field('ciudad',v)}/><Input label="Dirección" icon={MapPin} value={form.direccion} onChange={(v)=>field('direccion',v)}/><Input label="Código postal" icon={MapPin} value={form.codigo_postal} onChange={(v)=>field('codigo_postal',v)}/><Input label="Años de experiencia" icon={Wrench} type="number" value={form.experiencia_anios} onChange={(v)=>field('experiencia_anios',v)}/></div><Choice title="Especialidad principal *" items={specialities} selected={[form.especialidad]} onToggle={(item)=>field('especialidad',item)} single/><Choice title="Herramientas que utilizas" items={tools} selected={form.herramientas} onToggle={toggleTool}/></div>}
              {step === 4 && <div className="grid gap-6 lg:grid-cols-[1fr_.75fr]"><div className="rounded-3xl border border-white/10 bg-white/[.035] p-6"><h3 className="text-xl font-black uppercase">Resumen de solicitud</h3><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">{[['Empresa',form.empresa],['Contacto',`${form.nombre} ${form.apellidos}`],['Email',form.email],['Teléfono',form.telefono],['Ubicación',[form.ciudad,form.provincia,form.pais].filter(Boolean).join(', ')],['Especialidad',form.especialidad],['Herramientas',form.herramientas.join(', ')||'No indicadas']].map(([k,v])=><div key={k}><dt className="text-xs font-black uppercase tracking-wider text-white/35">{k}</dt><dd className="mt-1 font-bold text-white/80">{v}</dd></div>)}</dl></div><div className="space-y-4"><textarea value={form.observaciones} onChange={(e)=>field('observaciones',e.target.value)} placeholder="Cuéntanos brevemente qué tipo de trabajos realizas..." className="min-h-40 w-full rounded-2xl border border-white/12 bg-black/30 p-4 text-sm outline-none focus:border-red-500/60"/><label className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm text-white/60"><input type="checkbox" checked={form.acepta} onChange={(e)=>field('acepta',e.target.checked)} className="mt-1 accent-red-600"/><span>Acepto que Autokeys revise la solicitud y que el acceso no será efectivo hasta su aprobación.</span></label></div></div>}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
              <button onClick={()=>step===1?router.push('/'):setStep(step-1)} className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[.035] px-5 py-3 text-sm font-black uppercase text-white/65 hover:text-white"><ArrowLeft size={18}/>{step===1?'Volver':'Atrás'}</button>
              {step<4?<button onClick={next} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-700 to-red-500 px-6 py-3 text-sm font-black uppercase shadow-[0_16px_45px_rgba(217,4,41,.3)]">Continuar <ChevronRight size={18}/></button>:<button onClick={submit} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-700 to-red-500 px-7 py-3 text-sm font-black uppercase disabled:opacity-60">{loading?'Enviando...':'Enviar solicitud'} <ArrowRight size={18}/></button>}
            </div>
            <p className="mt-5 text-center text-sm text-white/35">¿Ya tienes acceso? <Link href="/login" className="font-black text-red-400">Iniciar sesión</Link></p>
          </div>
        </section>
      </div>
    </main>
  )
}

function Input({label,icon:Icon,value,onChange,type='text',placeholder}:any){return <label className="block"><span className="mb-2 block text-[11px] font-black uppercase tracking-[.2em] text-white/35">{label}</span><div className="flex h-14 items-center rounded-2xl border border-white/12 bg-black/30 focus-within:border-red-500/60"><Icon className="ml-4 text-white/30" size={18}/><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="h-full w-full bg-transparent px-4 text-sm outline-none placeholder:text-white/20"/></div></label>}
function Choice({title,items,selected,onToggle,single=false}:any){return <div><p className="mb-3 text-[11px] font-black uppercase tracking-[.2em] text-white/35">{title}</p><div className="flex flex-wrap gap-2">{items.map((item:string)=><button type="button" key={item} onClick={()=>onToggle(item)} className={`rounded-full border px-4 py-2 text-sm font-black transition ${selected.includes(item)?'border-red-500 bg-red-500/15 text-white':'border-white/10 bg-white/[.035] text-white/45 hover:text-white'}`}>{item}</button>)}</div></div>}
