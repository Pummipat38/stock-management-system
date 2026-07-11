'use client';

import { useState, useEffect } from 'react';
import { StockItem } from '@/types/stock';

interface ArchivedGroup {
  key: string;
  myobNumber: string;
  model: string;
  partNumber: string;
  partName: string;
  totalReceived: number;
  lastReceivedDate: string;
  entries: StockItem[];
}

export default function ReceivingArchivePage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroup, setSelectedGroup] = useState<ArchivedGroup | null>(null);
  const itemsPerPage = 10;

  const normalizeSearchText = (value?: string) =>
    (value || '').toString().toLowerCase().replace(/[\s-]+/g, '');

  const getGroupKey = (item: StockItem) => `${item.myobNumber}||${item.partNumber}`;

  const getBalanceMap = (items: StockItem[]) => {
    const balanceMap = new Map<string, number>();
    items.forEach(item => {
      const key = getGroupKey(item);
      const received = item.receivedQty > 0 ? item.receivedQty : 0;
      const issued = item.issuedQty && item.issuedQty > 0 ? item.issuedQty : 0;
      balanceMap.set(key, (balanceMap.get(key) || 0) + received - issued);
    });
    return balanceMap;
  };

  useEffect(() => {
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

    fetchStockItems();
  }, []);

  useEffect(() => {
    const search = normalizeSearchText(searchTerm);
    if (!search) {
      setFilteredItems(stockItems);
    } else {
      const filtered = stockItems.filter(item =>
        normalizeSearchText(item.myobNumber).includes(search) ||
        normalizeSearchText(item.partName).includes(search) ||
        normalizeSearchText(item.partNumber).includes(search) ||
        normalizeSearchText(item.model).includes(search) ||
        normalizeSearchText(item.poNumber).includes(search)
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, stockItems]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  const buildArchivedGroups = () => {
    const balanceMap = getBalanceMap(stockItems);
    const receivedItems = filteredItems.filter(item => item.receivedQty > 0);
    const archivedItems = receivedItems.filter(item => (balanceMap.get(getGroupKey(item)) || 0) <= 0);

    const groupedMap = new Map<string, ArchivedGroup>();
    archivedItems.forEach(item => {
      const key = getGroupKey(item);
      const existing = groupedMap.get(key);
      if (existing) {
        existing.totalReceived += item.receivedQty;
        if (item.model && !existing.model.split(',').map(s => s.trim()).filter(Boolean).includes(item.model)) {
          existing.model = existing.model ? `${existing.model}, ${item.model}` : item.model;
        }
        existing.entries.push(item);
        if (new Date(item.receivedDate).getTime() > new Date(existing.lastReceivedDate).getTime()) {
          existing.lastReceivedDate = item.receivedDate;
        }
      } else {
        groupedMap.set(key, {
          key,
          myobNumber: item.myobNumber,
          model: item.model,
          partNumber: item.partNumber,
          partName: item.partName,
          totalReceived: item.receivedQty,
          lastReceivedDate: item.receivedDate,
          entries: [item],
        });
      }
    });

    return Array.from(groupedMap.values()).sort((a, b) => {
      const myobCompare = a.myobNumber.localeCompare(b.myobNumber, 'en', { numeric: true, sensitivity: 'base' });
      if (myobCompare !== 0) return myobCompare;
      const partCompare = a.partNumber.localeCompare(b.partNumber, 'en', { numeric: true, sensitivity: 'base' });
      if (partCompare !== 0) return partCompare;
      return a.model.localeCompare(b.model, 'en', { numeric: true, sensitivity: 'base' });
    });
  };

  const archivedGroups = buildArchivedGroups();
  const totalPages = Math.ceil(archivedGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = archivedGroups.slice(startIndex, endIndex);
  const emptyRowsCount = Math.max(0, itemsPerPage - currentItems.length);
  const emptyRows = Array(emptyRowsCount).fill(null);

  const partColors = [
    'text-blue-400',
    'text-green-400',
    'text-purple-400',
    'text-red-400',
    'text-indigo-400',
    'text-pink-400',
    'text-yellow-400',
    'text-teal-400',
    'text-orange-400',
    'text-cyan-400'
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gray-800/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gray-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gray-900/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-8 py-8 relative z-10 max-w-[95%]">
        <div className="mb-8 relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
            🗂️ RECEIVING ARCHIVE
            <div className="text-2xl font-normal text-white/70 mt-2">
              (รายการรับเข้าไม่มีสต็อก)
            </div>
          </h1>

          <div className="absolute top-0 right-0">
            <button
              onClick={() => window.location.href = '/receiving'}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหา MYOB, Model, Part Name, Part Number, PO Number..."
              className="block w-full pl-10 pr-3 py-2 border border-white/30 rounded-md leading-5 bg-white/10 backdrop-blur-sm placeholder-white/60 text-white focus:outline-none focus:placeholder-white/40 focus:ring-1 focus:ring-white/50 focus:border-white/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm flex overflow-hidden border border-white/20">
          <div className="flex-1 min-w-0">
            <div className="p-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">รายการที่รับเข้าแล้วแต่สต็อกเป็นศูนย์</h3>
            </div>
            <div className="overflow-hidden">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-24">MYOB</th>
                    <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-32">MODEL</th>
                    <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-40">PART NUMBER</th>
                    <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-48">PART NAME</th>
                    <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {currentItems.map((item, index) => {
                    const colorIndex = Math.abs(item.key.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % partColors.length;
                    const partColor = partColors[colorIndex];

                    return (
                      <tr key={item.key} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-center w-24">
                          <div className={`truncate ${partColor}`}>{item.myobNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xl text-center w-32">
                          <span className={`inline-flex items-center justify-center w-44 px-3 py-1 rounded-full text-base font-bold border-2 ${partColor} ${partColor.replace('text-', 'bg-')}/10 ${partColor.replace('text-', 'border-')}/50`}>
                            {item.model}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-center w-40">
                          <div className="truncate text-white" title={item.partNumber}>
                            {item.partNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-center w-48">
                          <div className="truncate text-white" title={item.partName}>
                            {item.partName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center w-28">
                          <button
                            onClick={() => setSelectedGroup(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                          >
                            🔍 ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {emptyRows.map((_, index) => (
                    <tr key={`empty-${index}`} className="h-16">
                      <td className="px-4 py-4 w-24">&nbsp;</td>
                      <td className="px-4 py-4 w-32">&nbsp;</td>
                      <td className="px-4 py-4 w-40">&nbsp;</td>
                      <td className="px-4 py-4 w-48">&nbsp;</td>
                      <td className="px-4 py-4 w-28">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedGroup && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedGroup(null)}
          >
            <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-[95%] max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📋 รายละเอียดการรับเข้า
                  </h2>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-white/80 mt-1 text-sm">
                  {selectedGroup.myobNumber} • {selectedGroup.model} • {selectedGroup.partNumber} • {selectedGroup.partName}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-rose-300">{selectedGroup.totalReceived.toLocaleString()}</div>
                    <div className="text-white/60 text-sm mt-1">รับเข้ารวม</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-300">
                      {new Date(selectedGroup.lastReceivedDate).toLocaleDateString('th-TH')}
                    </div>
                    <div className="text-white/60 text-sm mt-1">รับเข้าล่าสุด</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-300">{selectedGroup.entries.length}</div>
                    <div className="text-white/60 text-sm mt-1">จำนวนครั้งที่รับเข้า</div>
                  </div>
                </div>

                {/* Entries Table */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 font-semibold text-white">
                    ประวัติการรับเข้าทั้งหมด
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-3 text-white/70">วันที่รับเข้า</th>
                          <th className="px-4 py-3 text-white/70">PO / Purchase</th>
                          <th className="px-4 py-3 text-white/70 text-center">จำนวน</th>
                          <th className="px-4 py-3 text-white/70">Supplier</th>
                          <th className="px-4 py-3 text-white/70">Customer</th>
                          <th className="px-4 py-3 text-white/70">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {selectedGroup.entries
                          .slice()
                          .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
                          .map((entry, idx) => (
                            <tr key={entry.id || idx} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-white whitespace-nowrap">
                                {new Date(entry.receivedDate).toLocaleDateString('th-TH')}
                              </td>
                              <td className="px-4 py-3 text-white whitespace-nowrap">
                                {entry.poNumber || '-'}
                              </td>
                              <td className="px-4 py-3 text-white text-center whitespace-nowrap">
                                <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                                  {entry.receivedQty.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-white whitespace-nowrap">
                                {entry.supplier || '-'}
                              </td>
                              <td className="px-4 py-3 text-white whitespace-nowrap">
                                {entry.customer || '-'}
                              </td>
                              <td className="px-4 py-3 text-white/80 break-words max-w-xs">
                                {entry.remarks || '-'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-2 border-t border-white/10">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-white">{archivedGroups.length}</div>
              <div className="text-white/70 text-lg">รายการที่ไม่มีสต็อก</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-300">
                {archivedGroups.reduce((sum: number, item: ArchivedGroup) => sum + item.totalReceived, 0).toLocaleString()}
              </div>
              <div className="text-white/70 text-lg">จำนวนที่เคยรับทั้งหมด</div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-white/20 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            ◀ ก่อนหน้า
          </button>
          <span className="text-white/80 px-4 py-2">
            หน้า {currentPage} / {Math.max(totalPages, 1)}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages || 1))}
            disabled={currentPage >= totalPages}
            className="bg-white/20 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            ถัดไป ▶
          </button>
        </div>
      </div>
    </div>
  );
}
