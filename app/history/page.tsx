'use client';

import { useState, useEffect } from 'react';

interface StockItem {
  id: string;
  myobNumber: string;
  model: string;
  partName: string;
  partNumber: string;
  revision: string;
  poNumber: string;
  receivedQty: number;
  receivedDate: string;
  supplier?: string;
  customer?: string;
  issuedQty?: number;
  invoiceNumber?: string;
  issueDate?: string;
  event?: string;
  withdrawalNumber?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface PartSummary {
  myobNumber: string;
  partName: string;
  totalReceived: number;
  totalIssued: number;
  balance: number;
  lastActivity: string;
}

export default function HistoryPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<PartSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      setItems(data);
      
      // สร้างสรุปข้อมูล
      const summaryMap = new Map<string, PartSummary>();
      
      data.forEach((item: StockItem) => {
        const key = `${item.myobNumber}-${item.partNumber}`;
        
        if (!summaryMap.has(key)) {
          summaryMap.set(key, {
            myobNumber: item.myobNumber,
            partName: item.partName,
            totalReceived: 0,
            totalIssued: 0,
            balance: 0,
            lastActivity: item.updatedAt
          });
        }
        
        const summary = summaryMap.get(key)!;
        summary.totalReceived += item.receivedQty;
        summary.totalIssued += item.issuedQty || 0;
        summary.balance = summary.totalReceived - summary.totalIssued;
        
        if (new Date(item.updatedAt) > new Date(summary.lastActivity)) {
          summary.lastActivity = item.updatedAt;
        }
      });
      
      setSummary(Array.from(summaryMap.values()));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSummary = summary.filter(item => {
    const matchesSearch = item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.myobNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'low') return matchesSearch && item.balance < 50;
    if (filter === 'empty') return matchesSearch && item.balance <= 0;
    if (filter === 'active') return matchesSearch && item.balance > 0;
    
    return matchesSearch;
  });

  const totalReceived = summary.reduce((sum, item) => sum + item.totalReceived, 0);
  const totalIssued = summary.reduce((sum, item) => sum + item.totalIssued, 0);
  const totalBalance = totalReceived - totalIssued;
  const lowStockCount = summary.filter(item => item.balance < 50 && item.balance > 0).length;
  const emptyStockCount = summary.filter(item => item.balance <= 0).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            📊 ประวัติและสรุปภาพรวม
          </h1>
          <p className="text-purple-200">ข้อมูลสรุปการรับเข้าและจ่ายออกทั้งหมด</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{totalReceived.toLocaleString()}</div>
              <div className="text-purple-200">รับเข้าทั้งหมด</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{totalIssued.toLocaleString()}</div>
              <div className="text-purple-200">จ่ายออกทั้งหมด</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{totalBalance.toLocaleString()}</div>
              <div className="text-purple-200">คงเหลือทั้งหมด</div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{lowStockCount + emptyStockCount}</div>
              <div className="text-purple-200">แจ้งเตือน</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(lowStockCount > 0 || emptyStockCount > 0) && (
          <div className="mb-6 space-y-2">
            {emptyStockCount > 0 && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-400 mr-2">🚨</span>
                  <span className="text-red-200">
                    มีสินค้าหมดสต็อก {emptyStockCount} รายการ
                  </span>
                </div>
              </div>
            )}
            
            {lowStockCount > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-2">⚠️</span>
                  <span className="text-yellow-200">
                    มีสินค้าใกล้หมด (น้อยกว่า 50 ชิ้น) {lowStockCount} รายการ
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="ค้นหา Part Name หรือ MYOB Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/20 text-purple-200 hover:bg-white/30'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'active' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/20 text-purple-200 hover:bg-white/30'
                }`}
              >
                มีสต็อก
              </button>
              <button
                onClick={() => setFilter('low')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'low' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white/20 text-purple-200 hover:bg-white/30'
                }`}
              >
                ใกล้หมด
              </button>
              <button
                onClick={() => setFilter('empty')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'empty' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/20 text-purple-200 hover:bg-white/30'
                }`}
              >
                หมดสต็อก
              </button>
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">MYOB Number</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">Part Name</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">รับเข้า</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">จ่ายออก</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">คงเหลือ</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">กิจกรรมล่าสุด</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummary.map((item, index) => (
                  <tr key={`${item.myobNumber}-${index}`} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-6 py-4 text-white font-mono">{item.myobNumber}</td>
                    <td className="px-6 py-4 text-purple-100">{item.partName}</td>
                    <td className="px-6 py-4 text-center text-green-400 font-semibold">
                      {item.totalReceived.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center text-orange-400 font-semibold">
                      {item.totalIssued.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">
                      <span className={`${
                        item.balance <= 0 ? 'text-red-400' :
                        item.balance < 50 ? 'text-yellow-400' :
                        'text-blue-400'
                      }`}>
                        {item.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-purple-200 text-sm">
                      {new Date(item.lastActivity).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredSummary.length === 0 && (
          <div className="text-center py-8 text-purple-200">
            ไม่พบข้อมูลที่ตรงกับการค้นหา
          </div>
        )}
      </div>
    </div>
  );
}