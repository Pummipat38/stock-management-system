import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stock Management System',
  description: 'ระบบจัดการสต็อกสินค้า พร้อม MYOB Integration',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>"
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
