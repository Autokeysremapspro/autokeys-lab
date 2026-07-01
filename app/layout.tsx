import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Autokeys Lab',
  description: 'ERP interno para laboratorio de electrónica de vehículos'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  )
}
