'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function Login(){
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const router=useRouter();
 async function submit(e:any){ e.preventDefault(); const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) toast.error(error.message); else router.push('/') }
 return <main className="min-h-screen grid place-items-center p-4 bg-[radial-gradient(circle_at_top,#2a0004,#070707_45%)]">
  <form onSubmit={submit} className="card w-full max-w-md p-8 space-y-5">
   <div><h1 className="text-4xl font-black">AUTOKEYS <span className="text-akred">LAB</span></h1><p className="text-zinc-500 mt-2">Acceso interno</p></div>
   <input className="w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
   <input className="w-full" placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
   <button className="btn btn-red w-full">Entrar</button>
   <p className="text-xs text-zinc-500">Crea primero los usuarios desde Supabase Authentication.</p>
  </form>
 </main>
}
