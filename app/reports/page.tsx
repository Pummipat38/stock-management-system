'use client';

import { useState, useEffect } from 'react';
import { StockItem } from '@/types/stock';

export default function ReportsPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStockItems = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      setStockItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(stockItems);
    } else {
      const filtered = stockItems.filter(item => {
        const search = searchTerm.toLowerCase();
        return (
          item.myobNumber.toLowerCase().includes(search) ||
          item.partName.toLowerCase().includes(search) ||
          item.partNumber.toLowerCase().includes(search) ||
          item.model.toLowerCase().includes(search) ||
          item.poNumber.toLowerCase().includes(search) ||
          (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(search))
        );
      });
      setFilteredItems(filtered);
    }
  }, [searchTerm, stockItems]);

  useEffect(() => {
    fetchStockItems();
  }, []);

  const getBalance = (item: StockItem) => {
    return item.receivedQty - (item.issuedQty || 0);
  };

  const lowStockItems = stockItems.filter(item => getBalance(item) <= 10 && getBalance(item) > 0);
  const outOfStockItems = stockItems.filter(item => getBalance(item) <= 0);
  const totalReceived = stockItems.reduce((sum, item) => sum + item.receivedQty, 0);
  const totalIssued = stockItems.reduce((sum, item) => sum + (item.issuedQty || 0), 0);
  const totalBalance = totalReceived - totalIssued;

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header with Back Button */}
        <div className="mb-8 relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
            📊 REPORTS
            <div className="text-2xl font-normal text-white/70 mt-2">
              (รายงาน)
            </div>
          </h1>
          <p className="text-white/80 mt-4">รายงานสถานะสต็อกและการเคลื่อนไหวสินค้า</p>
          
          {/* Back Button - positioned absolute top right */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>

      {/* Search Box */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="ค้นหา MYOB, Model, Part Name, Part Number, PO Number, Invoice..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-gray-600">
            พบ {filteredItems.length} รายการจากทั้งหมด {stockItems.length} รายการ
          </p>
        )}
      </div>

      {/* สรุปภาพรวม */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              📦
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รายการทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stockItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              📥
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">รับเข้าทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{totalReceived.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              📤
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">จ่ายออกทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{totalIssued.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              📋
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">คงเหลือทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* สินค้าที่สต็อกต่ำ */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 mb-8">
        <div className="p-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white flex items-center">
            ⚠️ สินค้าที่สต็อกต่ำ (≤ 10)
            <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {lowStockItems.length} รายการ
            </span>
          </h3>
        </div>
        <div className="p-4">
          {lowStockItems.length > 0 ? (
            <div className="max-h-64 overflow-y-auto space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <div>
                    <p className="font-medium text-white">{item.partName}</p>
                    <p className="text-sm text-white/70">{item.myobNumber} - {item.partNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-300">{getBalance(item)}</p>
                    <p className="text-xs text-white/60">คงเหลือ</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60 text-center py-8">ไม่มีสินค้าที่สต็อกต่ำ</p>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* การรับงานเข้ารายเดือน */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
          <div className="p-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white flex items-center">
              📥 การรับงานเข้ารายเดือน
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-1 h-48">
              {Array.from({length: 12}, (_, i) => {
                const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                const values = [120, 95, 140, 110, 85, 130, 115, 105, 125, 135, 90, 118];
                const maxValue = Math.max(...values);
                const height = (values[i] / maxValue) * 100;
                
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-300 hover:from-emerald-500 hover:to-emerald-300 relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {values[i]}
                      </div>
                    </div>
                    <div className="text-xs text-white/70 mt-2 font-medium">{monthNames[i]}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-white/60 text-sm">จำนวนการรับงานเข้าต่อเดือน (หน่วย: ชิ้น)</p>
            </div>
          </div>
        </div>

        {/* การจ่ายงานออกรายเดือน */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
          <div className="p-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white flex items-center">
              📤 การจ่ายงานออกรายเดือน
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-1 h-48">
              {Array.from({length: 12}, (_, i) => {
                const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                const values = [110, 88, 125, 98, 75, 115, 102, 92, 108, 118, 82, 105];
                const maxValue = Math.max(...values);
                const height = (values[i] / maxValue) * 100;
                
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full">
                    <div 
                      className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all duration-300 hover:from-orange-500 hover:to-orange-300 relative group"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {values[i]}
                      </div>
                    </div>
                    <div className="text-xs text-white/70 mt-2 font-medium">{monthNames[i]}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-white/60 text-sm">จำนวนการจ่ายงานออกต่อเดือน (หน่วย: ชิ้น)</p>
            </div>
          </div>
        </div>
      </div>

      {/* รายการสินค้าทั้งหมดแบบสรุป */}
      <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
        <div className="p-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white">📋 สรุปรายการสินค้าทั้งหมด</h3>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">MYOB</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Part Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">รับเข้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">จ่ายออก</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">คงเหลือ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {stockItems.map((item) => {
                const balance = getBalance(item);
                let statusColor = 'bg-green-100 text-green-800';
                let statusText = 'ปกติ';
                
                if (balance <= 0) {
                  statusColor = 'bg-red-100 text-red-800';
                  statusText = 'หมดสต็อก';
                } else if (balance <= 10) {
                  statusColor = 'bg-yellow-100 text-yellow-800';
                  statusText = 'สต็อกต่ำ';
                }

                return (
                  <tr key={item.id} className={`hover:bg-white/5 transition-colors ${
                    balance < 10 && balance > 0 ? 'bg-yellow-500/10 border-l-4 border-yellow-400/50' : 
                    balance <= 0 ? 'bg-red-500/10 border-l-4 border-red-400/50' : ''
                  }`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                      <div className="flex items-center">
                        {balance < 10 && balance > 0 && (
                          <span className="mr-2 text-yellow-400 animate-pulse" title="สต็อกต่ำ!">
                            ⚠️
                          </span>
                        )}
                        {balance <= 0 && (
                          <span className="mr-2 text-red-400 animate-pulse" title="หมดสต็อก!">
                            🚨
                          </span>
                        )}
                        {item.myobNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-white max-w-xs">
                      <div className="truncate" title={item.partName}>{item.partName}</div>
                      <div className="text-xs text-white/60">{item.partNumber}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {item.receivedQty.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {(item.issuedQty || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          balance <= 0 ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          balance < 10 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 animate-pulse' :
                          'bg-green-500/20 text-green-300 border-green-500/30'
                        }`}>
                          {balance.toLocaleString()}
                        </span>
                        {balance < 10 && balance > 0 && (
                          <span className="ml-2 text-xs text-yellow-400 font-medium animate-bounce">
                            ต่ำ!
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        balance <= 0 ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                        balance <= 10 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                        'bg-green-500/20 text-green-300 border-green-500/30'
                      } ${balance < 10 && balance > 0 ? 'animate-pulse' : ''}`}>
                        {statusText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Monthly Chart */}
      <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20">
        <div className="p-4 border-b border-white/20">
          <h3 className="text-lg font-semibold text-white flex items-center">
            📈 การตัดงานรายเดือน
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-12 gap-2 h-64">
            {Array.from({length: 12}, (_, i) => {
              const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
              const values = [45, 38, 52, 41, 35, 48, 42, 39, 46, 44, 37, 43];
              const maxValue = Math.max(...values);
              const height = (values[i] / maxValue) * 100;
              
              return (
                <div key={i} className="flex flex-col items-center justify-end h-full">
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t-lg transition-all duration-300 hover:from-indigo-400 hover:to-purple-300 relative group"
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {values[i]}
                    </div>
                  </div>
                  <div className="text-xs text-white/70 mt-2 font-medium">{monthNames[i]}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <p className="text-white/60 text-sm">จำนวนการตัดงานต่อเดือน (หน่วย: ชิ้น)</p>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
