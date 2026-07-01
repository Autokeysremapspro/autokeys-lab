'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LayoutDashboard, Users, Car, ClipboardList, FileText, Package, UploadCloud, LogOut, Search } from 'lucide-react'

const nav = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/clientes', 'Clientes', Users],
  ['/vehiculos', 'Vehículos', Car],
  ['/expedientes', 'Expedientes / OT', ClipboardList],
  ['/facturas', 'Facturas', FileText],
  ['/stock', 'Stock', Package],
  ['/file-service', 'File Service', UploadCloud]
]

export default function AppShell({children}: {children: React.ReactNode}) {
  const pathname = usePathname(); const router = useRouter()
  async function logout(){ await supabase.auth.signOut(); router.push('/login') }
  return <div className="min-h-screen flex bg-akdark">
    <aside className="w-72 border-r border-zinc-800 p-5 hidden lg:block">
      <div className="mb-8">
        <div className="text-2xl font-black tracking-tight">AUTOKEYS <span className="text-akred">LAB</span></div>
        <div className="text-xs text-zinc-500 mt-1">Electrónica · Llaves · ECU · Remaps</div>
      </div>
      <nav className="space-y-2">
        {nav.map(([href,label,Icon]: any)=> <Link key={href} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${pathname===href?'bg-akred text-white':'hover:bg-zinc-900 text-zinc-300'}`}>
          <Icon size={18}/><span className="font-semibold">{label}</span>
        </Link>)}
      </nav>
      <button onClick={logout} className="mt-8 flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-zinc-900 text-zinc-400 w-full"><LogOut size={18}/> Salir</button>
    </aside>
    <main className="flex-1 p-4 lg:p-8">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-4xl font-black">Autokeys Lab</h1>
          <p className="text-zinc-500">Panel interno profesional</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 min-w-[360px]"><Search size={18} className="text-zinc-500"/><input placeholder="Buscar OT, matrícula, cliente..." className="bg-transparent border-0 p-0 w-full"/></div>
      </div>
      {children}
    </main>
  </div>
}
