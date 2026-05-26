import { redirect } from 'next/navigation';
import Link from 'next/link'
import { Briefcase, Shirt, Car, BarChart3, History } from 'lucide-react'

export default function Home() {
  redirect('/dashboard');

  // Legacy landing (unreachable) - kept for reference
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _LegacyHome() {
  const menuItems = [
    {
      href: '/products',
      title: 'OFFICE SUPPLIES',
      subtitle: '(ของใช้ในสำนักงาน)',
      icon: <Briefcase className="w-16 h-16" />,
      color: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      shadow: 'shadow-blue-200'
    },
    {
      href: '/stock-in',
      title: 'UNIFORM',
      subtitle: '(เสื้อพนักงาน)',
      icon: <Shirt className="w-16 h-16" />,
      color: 'bg-green-500',
      hover: 'hover:bg-green-600',
      shadow: 'shadow-green-200'
    },
    {
      href: '/stock-out',
      title: 'COMPANY VEHICLES',
      subtitle: '(รถของบริษัท)',
      icon: <Car className="w-16 h-16" />,
      color: 'bg-red-500',
      hover: 'hover:bg-red-600',
      shadow: 'shadow-red-200'
    },
    {
      href: '/stock-balance',
      title: 'ยอดคงเหลือ',
      icon: <BarChart3 className="w-16 h-16" />,
      color: 'bg-purple-500',
      hover: 'hover:bg-purple-600',
      shadow: 'shadow-purple-200'
    },
    {
      href: '/movements',
      title: 'ประวัติ',
      icon: <History className="w-16 h-16" />,
      color: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      shadow: 'shadow-orange-200'
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-600 to-sky-600 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-6xl sm:text-7xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            Stock Control System
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 text-center place-items-stretch">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`group bg-white rounded-3xl p-12 transition-all duration-300 hover:-translate-y-2 shadow-xl hover:shadow-2xl ${item.shadow} flex flex-col items-center justify-center w-full md:max-w-none lg:col-span-4 min-h-[280px] ${index === 3 ? 'lg:col-start-3' : ''} ${index === 4 ? 'lg:col-start-7' : ''}`}
            >
              <div className={`inline-flex items-center justify-center p-8 rounded-2xl text-white mb-8 transition-transform group-hover:scale-110 ${item.color}`}>
                {item.icon}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                {item.title}
              </h2>
              {'subtitle' in item && item.subtitle && (
                <div className="mt-2 text-2xl font-semibold text-gray-500">
                  {item.subtitle}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
  }
}
