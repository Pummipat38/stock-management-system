import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PwaRegister from '@/components/PwaRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stock Management System',
  description: 'ระบบจัดการสต็อกสินค้า พร้อม MYOB Integration',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/pwa/icon/192', type: 'image/png', sizes: '192x192' },
      { url: '/pwa/icon/512', type: 'image/png', sizes: '512x512' }
    ]
  }
}

export const viewport: Viewport = {
  themeColor: '#10b981'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PwaRegister />
        <div className="relative min-h-screen">
          <div className="fixed inset-0 flex items-end justify-center pointer-events-none pb-12 z-30">
            <span className="text-[120px] sm:text-[180px] font-black uppercase tracking-[0.25em] text-white/20 select-none text-center leading-none">
              <span className="block">ENGINEER</span>
              <span className="block text-[48px] sm:text-[72px] tracking-[0.2em] mt-4">RK (THAILAND) LTD.</span>
            </span>
          </div>
          <div className="relative z-20">{children}</div>
        </div>
      </body>
    </html>
  )
}
