'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DueRecord {
  id: string;
  deliveryType: 'domestic' | 'international';
  myobNumber: string;
  customer: string;
  countryOfOrigin: string;
  sampleRequestSheet: string;
  model: string;
  partNumber: string;
  partName: string;
  revisionLevel: string;
  revisionNumber: string;
  event: string;
  customerPo: string;
  quantity: number;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  isDelivered?: boolean;
  deliveredAt?: string;
}

interface DueAlertItem {
  record: DueRecord;
  daysLeft: number;
}

const parseDueDateValue = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const normalized = value.replace(/\s+/g, ' ').trim();
  const altParsed = new Date(normalized);
  if (!Number.isNaN(altParsed.getTime())) return altParsed;
  const match = normalized.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
};

const formatDueDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  recentTransactions: number;
  totalReceived: number;
  totalIssued: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    recentTransactions: 0,
    totalReceived: 0,
    totalIssued: 0
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dueAlerts, setDueAlerts] = useState<DueAlertItem[]>([]);
  const [isDueAlertOpen, setIsDueAlertOpen] = useState(false);
  const [alertCountdown, setAlertCountdown] = useState(0);

  const fetchStats = async () => {
    try {
      // Fetch stock items
      const stockResponse = await fetch('/api/stock');
      const stockData = await stockResponse.json();
      const items = Array.isArray(stockData) ? stockData : [];
      
      // Fetch transactions
      const transactionResponse = await fetch('/api/transactions');
      const transactionData = await transactionResponse.json();
      const transactions = Array.isArray(transactionData) ? transactionData : [];

      // Calculate stats
      const totalItems = items.length;
      const lowStockItems = items.filter(item => {
        const balance = item.receivedQty - (item.issuedQty || 0);
        return balance <= 10;
      }).length;
      
      const totalReceived = items.reduce((sum, item) => sum + item.receivedQty, 0);
      const totalIssued = items.reduce((sum, item) => sum + (item.issuedQty || 0), 0);
      const recentTransactions = transactions.length;

      setStats({
        totalItems,
        lowStockItems,
        recentTransactions,
        totalReceived,
        totalIssued
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem('dueRecords');
      const records = saved ? (JSON.parse(saved) as DueRecord[]) : [];
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const msPerDay = 1000 * 60 * 60 * 24;

      const nextAlerts = records
        .filter(record => !record.isDelivered)
        .map(record => {
          const parsed = parseDueDateValue(record.dueDate);
          if (!parsed) return null;
          const startOfDue = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
          const diffDays = Math.ceil((startOfDue.getTime() - startOfToday.getTime()) / msPerDay);
          if (diffDays < 1 || diffDays > 5) return null;
          return { record, daysLeft: diffDays };
        })
        .filter((item): item is DueAlertItem => Boolean(item))
        .sort((a, b) => a.daysLeft - b.daysLeft);

      setDueAlerts(nextAlerts);
      setIsDueAlertOpen(nextAlerts.length > 0);
    } catch (error) {
      console.error('Error loading due alerts:', error);
      setDueAlerts([]);
      setIsDueAlertOpen(false);
    }
  }, [mounted]);

  useEffect(() => {
    if (!isDueAlertOpen) return;
    setAlertCountdown(3);
    const interval = window.setInterval(() => {
      setAlertCountdown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    const timer = window.setTimeout(() => {
      setIsDueAlertOpen(false);
    }, 3000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [isDueAlertOpen]);

  const menuItems = [
    {
      title: 'DUE DELIVERY',
      subtitle: '(บันทึกกำหนดส่งงาน)',
      icon: '🚚',
      href: '/packing',
      delay: 'delay-500'
    },
    {
      title: 'RECEIVING',
      subtitle: '(รับงานเข้า)',
      icon: '📥',
      href: '/receiving',
      delay: 'delay-200'
    },
    {
      title: 'ISSUING',
      subtitle: '(จ่ายงานออก)',
      icon: '📤',
      href: '/issuing',
      delay: 'delay-300'
    },
    {
      title: 'NG STOCK',
      subtitle: '(งาน NG)',
      icon: '🚫',
      href: '/ng',
      delay: 'delay-[350ms]'
    },
    {
      title: 'STOCK BALANCE',
      subtitle: '(สต็อกคงเหลือทั้งหมด)',
      icon: '⚖️',
      href: '/stock',
      delay: 'delay-500'
    },
    {
      title: 'REPORTS',
      subtitle: '(รายงาน)',
      icon: '📊',
      href: '/reports',
      delay: 'delay-600'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 via-emerald-800 via-teal-700 to-green-600 relative overflow-hidden">
      {/* Blue Gradient Background Effects */}
      <div className="absolute inset-0">
        {/* Main Blue Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/30 via-blue-500/40 to-sky-400/35 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-gradient-to-bl from-blue-600/25 via-indigo-500/30 to-purple-600/25 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-tr from-sky-500/20 via-blue-500/25 to-cyan-400/20 rounded-full blur-xl animate-pulse delay-1500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-88 h-88 bg-gradient-to-tl from-blue-700/30 via-indigo-600/35 to-purple-500/25 rounded-full blur-2xl animate-pulse delay-2000"></div>
        
        {/* Additional Blue Accents */}
        <div className="absolute top-10 left-10 w-60 h-60 bg-gradient-to-br from-purple-400/15 via-blue-400/20 to-sky-300/15 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-bl from-blue-500/20 via-indigo-400/25 to-purple-500/15 rounded-full blur-xl animate-pulse delay-1200"></div>
        <div className="absolute bottom-10 left-20 w-56 h-56 bg-gradient-to-tr from-sky-400/18 via-blue-400/22 to-cyan-300/16 rounded-full blur-xl animate-pulse delay-1800"></div>
        <div className="absolute bottom-20 right-10 w-68 h-68 bg-gradient-to-tl from-blue-600/25 via-indigo-500/30 to-purple-400/20 rounded-full blur-xl animate-pulse delay-2400"></div>
      </div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-lg text-white/80 font-medium">กำลังโหลดข้อมูล...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 via-emerald-800 via-teal-700 to-green-600 relative overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap" rel="stylesheet" />
      
      {/* Sparkling Stars */}
      <div className="absolute top-20 left-20 w-3 h-3 bg-white rounded-full animate-pulse shadow-white shadow-lg" style={{animationDelay: '0s', animationDuration: '2s'}}></div>
      <div className="absolute top-40 right-32 w-2 h-2 bg-yellow-200 rounded-full animate-pulse shadow-yellow-200 shadow-md" style={{animationDelay: '0.5s', animationDuration: '1.5s'}}></div>
      <div className="absolute bottom-32 left-1/4 w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-white shadow-lg" style={{animationDelay: '1s', animationDuration: '2.5s'}}></div>
      <div className="absolute top-1/3 right-20 w-2 h-2 bg-emerald-200 rounded-full animate-pulse shadow-emerald-200 shadow-md" style={{animationDelay: '1.5s', animationDuration: '1.8s'}}></div>
      <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-teal-200 rounded-full animate-pulse shadow-teal-200 shadow-lg" style={{animationDelay: '2s', animationDuration: '2.2s'}}></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10 min-h-screen flex flex-col justify-center">
        <div className="flex flex-col items-center justify-center">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-8xl font-bold text-white flex items-center justify-center gap-6" style={{fontFamily: 'Kalam, cursive'}}>
                <span>📦</span>
                <span>STOCK NEW MODEL</span>
              </h1>
              <p className="text-3xl text-white/80 font-light mt-4" style={{fontFamily: 'Kalam, cursive'}}>
                เลือกใช้งานฟีเจอร์ที่ต้องการ
              </p>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group block"
              >
                <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15),0_10px_25px_rgba(0,0,0,0.1),0_5px_10px_rgba(0,0,0,0.05),inset_0_6px_0_rgba(255,255,255,1),inset_0_-6px_0_rgba(0,0,0,0.25),inset_6px_0_0_rgba(255,255,255,0.9),inset_-6px_0_0_rgba(0,0,0,0.2)] border-2 border-gray-300 hover:shadow-[0_30px_70px_rgba(0,0,0,0.25),0_15px_35px_rgba(0,0,0,0.15),0_8px_15px_rgba(0,0,0,0.1),inset_0_8px_0_rgba(255,255,255,1),inset_0_-8px_0_rgba(0,0,0,0.3),inset_8px_0_0_rgba(255,255,255,1),inset_-8px_0_0_rgba(0,0,0,0.25)] hover:border-gray-400 hover:scale-105 hover:-translate-y-2 transition-all duration-500 ease-out relative overflow-hidden group transform-gpu">
                  {/* Realistic Light Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                  <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-white/30 to-transparent rounded-3xl blur-xl opacity-50"></div>
                  <div className="p-10 text-center h-full flex flex-col justify-center min-h-[280px] relative z-10">
                    <div className="mb-8">
                      <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                        <span className="text-6xl">{item.icon}</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4 leading-tight group-hover:animate-pulse" style={{fontFamily: 'Kalam, cursive'}}>
                      {item.title}
                    </h3>
                    <p className="text-xl text-gray-600 leading-relaxed font-medium group-hover:animate-pulse" style={{fontFamily: 'Kalam, cursive'}}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {isDueAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-[32px] border border-white/20 bg-gradient-to-br from-rose-400 via-pink-400 to-rose-300 p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white">⏰ แจ้งเตือนงานใกล้ครบกำหนด</h2>
                <p className="text-white/80 mt-2">งานคงค้างที่ต้องส่งภายใน 1-5 วัน</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDueAlertOpen(false)}
                className="rounded-full bg-white/20 px-4 py-2 text-white hover:bg-white/30"
              >
                ปิด {alertCountdown > 0 ? `(${alertCountdown})` : ''}
              </button>
            </div>

            <div className="mt-6 space-y-3 max-h-[55vh] overflow-auto pr-2">
              {dueAlerts.map(item => (
                <div
                  key={item.record.id}
                  className="rounded-2xl bg-white/20 px-5 py-4 text-white shadow-lg"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold">
                        {item.record.customer || 'ไม่ระบุลูกค้า'}
                      </div>
                      <div className="text-white/80 text-sm">
                        {item.record.partNumber} • {item.record.model}
                      </div>
                      <div className="text-white/70 text-xs">
                        PO: {item.record.customerPo || '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white/80">กำหนดส่ง</div>
                      <div className="text-lg font-semibold">
                        {formatDueDate(item.record.dueDate)}
                      </div>
                      <div className="text-sm text-white/90">
                        อีก {item.daysLeft} วัน
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
