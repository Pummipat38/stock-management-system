'use client';

import { useState, useEffect } from 'react';
import { StockItem } from '@/types/stock';

export default function ProductsPage() {
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
      setFilteredItems(data);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(stockItems);
    } else {
      const filtered = stockItems.filter(item => {
        const search = searchTerm.toLowerCase();
        return (
          item.partName.toLowerCase().includes(search) ||
          item.partNumber.toLowerCase().includes(search) ||
          item.model.toLowerCase().includes(search)
        );
      });
      setFilteredItems(filtered);
    }
  }, [searchTerm, stockItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-600 to-sky-600 flex items-center justify-center">
        <div className="text-white text-xl">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-700 via-emerald-600 to-sky-600">
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">📦 Office Supplies - ของใช้ในสำนักงาน</h1>
          <a
            href="/"
            className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white hover:bg-white/30 transition-all"
          >
            กลับหน้าหลัก
          </a>
        </div>

        {/* ช่องค้นหา */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
          <div className="flex items-center gap-4">
            <label className="text-white font-medium">ค้นหา:</label>
            <input
              type="text"
              placeholder="ค้นหาชื่อสินค้า, รหัสสินค้า, รุ่น..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-white/70">
              พบ {filteredItems.length} รายการจากทั้งหมด {stockItems.length} รายการ
            </p>
          )}
        </div>

        {/* ตารางสินค้า */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">รายการสินค้าทั้งหมด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัสสินค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อสินค้า</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รุ่น</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">คงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems
                  .filter((item, index, self) => 
                    self.findIndex(i => i.partNumber === item.partNumber) === index
                  )
                  .map((item, index) => {
                    const allItemsWithSamePart = stockItems.filter(i => i.partNumber === item.partNumber);
                    const totalReceived = allItemsWithSamePart.reduce((sum, i) => sum + i.receivedQty, 0);
                    const totalIssued = allItemsWithSamePart.reduce((sum, i) => sum + (i.issuedQty || 0), 0);
                    const balance = totalReceived - totalIssued;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.partNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={item.partName}>
                            {item.partName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.model}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            balance > 0 
                              ? 'bg-green-100 text-green-800' 
                              : balance === 0 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {balance}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      ไม่พบสินค้าที่ค้นหา
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
