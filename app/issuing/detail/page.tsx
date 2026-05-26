'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { StockItem } from '@/types/stock';

export default function IssuingDetailPage() {
  const searchParams = useSearchParams();
  const myob = searchParams.get('myob');
  const partNumber = searchParams.get('partNumber');
  
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      setStockItems(data);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (myob && partNumber) {
      const filtered = stockItems.filter(item => 
        item.myobNumber === myob && item.partNumber === partNumber
      );
      setFilteredItems(filtered);
    }
  }, [myob, partNumber, stockItems]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      const found = stockItems.find(item => 
        item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (found) {
        const url = `/issuing/detail?myob=${encodeURIComponent(found.myobNumber)}&partNumber=${encodeURIComponent(found.partNumber)}`;
        window.open(url, '_blank');
      } else {
        alert('ไม่พบรหัสสินค้านี้');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-600 to-sky-600 flex items-center justify-center">
        <div className="text-white text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  const headerItem = filteredItems[0];
  const issuedItems = filteredItems.filter(item => item.issuedQty && item.issuedQty > 0);
  const totalIssued = issuedItems.reduce((sum, item) => sum + (item.issuedQty || 0), 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-600 to-sky-600">
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">🔍 รายละเอียดการจ่ายออกทั้งหมด</h1>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all"
          >
            ปิดหน้าต่าง
          </button>
        </div>

        {/* ช่องค้นหารหัสสินค้า */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
          <div className="flex items-center gap-4">
            <label className="text-white font-medium">รหัสสินค้า:</label>
            <input
              type="text"
              placeholder="พิมพ์รหัสสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              ค้นหา
            </button>
          </div>
          <p className="mt-2 text-sm text-white/70">พิมพ์รหัสสินค้าแล้วกด Enter หรือคลิกปุ่มค้นหา</p>
        </div>

        {headerItem && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">ข้อมูลสินค้า</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">MYOB</div>
                <div className="text-lg font-semibold text-gray-800">{headerItem.myobNumber}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">PART NUMBER</div>
                <div className="text-lg font-semibold text-gray-800">{headerItem.partNumber}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">PART NAME</div>
                <div className="text-lg font-semibold text-gray-800">{headerItem.partName}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-500">MODEL</div>
                <div className="text-lg font-semibold text-gray-800">{headerItem.model}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-red-600">จำนวนจ่ายทั้งหมด</div>
                <div className="text-2xl font-bold text-red-700">{totalIssued.toLocaleString()}</div>
                <div className="text-sm text-red-500">จ่าย {issuedItems.length} ครั้ง</div>
              </div>
            </div>
          </div>
        )}

        {/* ตารางรายการจ่ายออก */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">รายการจ่ายออกทั้งหมด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่จ่าย</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ใบเบิก</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">จำนวน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลูกค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {issuedItems
                  .sort((a, b) => new Date(a.issueDate || a.createdAt).getTime() - new Date(b.issueDate || b.createdAt).getTime())
                  .map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.issueDate ? new Date(item.issueDate).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.withdrawalNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.issuedQty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.customer || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={item.remarks}>
                          {item.remarks || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                {issuedItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      ไม่มีรายการจ่ายออก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
