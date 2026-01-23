'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: '🏠 หน้าหลัก', icon: '🏠' },
    { href: '/stock', label: '📦 รายการสินค้า', icon: '📦' },
    { href: '/receiving', label: '📥 รับงานเข้า', icon: '📥' },
    { href: '/issuing', label: '📤 จ่ายงานออก', icon: '📤' },
    { href: '/packing', label: '📦 ข้อมูลการบรรจุ', icon: '📦' },
    { href: '/ng', label: '🚫 งาน NG', icon: '🚫' },
    { href: '/history', label: '📋 ประวัติ', icon: '📋' },
    { href: '/reports', label: '📊 รายงาน', icon: '📊' },
  ];

  return (
    <nav className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 shadow-lg border-b border-yellow-200 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-18">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className={`group relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              pathname === '/dashboard' 
                ? 'bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 shadow-lg animate-shimmer' 
                : 'text-amber-700 hover:text-amber-900 hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 hover:shadow-md'
            }`}>
              <span className="relative z-10">🏠 หน้าหลัก</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-300/20 to-yellow-300/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link href="/stock" className={`group relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              pathname === '/stock' 
                ? 'bg-gradient-to-r from-yellow-200 to-amber-200 text-yellow-800 shadow-lg animate-shimmer' 
                : 'text-yellow-700 hover:text-yellow-900 hover:bg-gradient-to-r hover:from-yellow-100 hover:to-amber-100 hover:shadow-md'
            }`}>
              <span className="relative z-10">📦 รายการสินค้า</span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-amber-300/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link href="/receiving" className={`group relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              pathname === '/receiving' 
                ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 shadow-lg animate-shimmer' 
                : 'text-green-700 hover:text-green-900 hover:bg-gradient-to-r hover:from-green-100 hover:to-emerald-100 hover:shadow-md'
            }`}>
              <span className="relative z-10">📥 รับงานเข้า</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-300/20 to-emerald-300/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link href="/issuing" className={`group relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              pathname === '/issuing' 
                ? 'bg-gradient-to-r from-orange-200 to-red-200 text-orange-800 shadow-lg animate-shimmer' 
                : 'text-orange-700 hover:text-orange-900 hover:bg-gradient-to-r hover:from-orange-100 hover:to-red-100 hover:shadow-md'
            }`}>
              <span className="relative z-10">📤 จ่ายงานออก</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-300/20 to-red-300/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link href="/ng" className={`group relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              pathname === '/ng' 
                ? 'bg-gradient-to-r from-red-200 to-pink-200 text-red-800 shadow-lg animate-shimmer' 
                : 'text-red-700 hover:text-red-900 hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 hover:shadow-md'
            }`}>
              <span className="relative z-10">🚫 งาน NG</span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-300/20 to-pink-300/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link href="/history" className={`group relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              pathname === '/history' 
                ? 'bg-gradient-to-r from-purple-200 to-indigo-200 text-purple-800 shadow-lg animate-shimmer' 
                : 'text-purple-700 hover:text-purple-900 hover:bg-gradient-to-r hover:from-purple-100 hover:to-indigo-100 hover:shadow-md'
            }`}>
              <span className="relative z-10">📋 ประวัติ</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 to-indigo-300/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link href="/reports" className={`group relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              pathname === '/reports' 
                ? 'bg-gradient-to-r from-indigo-200 to-blue-200 text-indigo-800 shadow-lg animate-shimmer' 
                : 'text-indigo-700 hover:text-indigo-900 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-100 hover:shadow-md'
            }`}>
              <span className="relative z-10">📊 รายงาน</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-300/20 to-blue-300/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg shadow-md border border-yellow-200">
              <div className="text-sm font-medium text-amber-800">
                {new Date().toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex space-x-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 transform hover:scale-105 ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-yellow-200 to-amber-200 text-yellow-800 shadow-lg border border-yellow-300'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 hover:shadow-md'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label.replace(/^[🏠📦📥📤🚫📋📊] /, '')}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
