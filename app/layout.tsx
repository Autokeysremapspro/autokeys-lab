import './globals.css'
import './visual-polish.css'
import './login-art.css'
import './login-responsive.css'
import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono, Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import PushBootstrap from '@/components/PushBootstrap'

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-display' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono' })
const body = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Autokeys Lab',
  description: 'ERP profesional de Autokeys Remaps Pro para gestión de taller y laboratorio de electrónica de vehículos'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body>
        <Toaster position="top-right" />
        <PushBootstrap />
        {children}
      </body>
    </html>
  )
}
