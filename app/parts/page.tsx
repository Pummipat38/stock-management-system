'use client';

import { useState, useEffect } from 'react';
import { StockItem } from '@/types/stock';

export default function PartsPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle mouse wheel scrolling
  useEffect(() => {
    const handleWheel = (event: Event) => {
      const wheelEvent = event as WheelEvent;
      const uniqueCount = Object.keys(
        filteredItems.reduce((acc, item) => {
          const key = `${item.myobNumber}-${item.partNumber}`;
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>)
      ).length;
      const totalPages = Math.ceil(uniqueCount / itemsPerPage);
      
      if (totalPages <= 1) return;

      wheelEvent.preventDefault();
      
      if (wheelEvent.deltaY > 0) {
        // Scroll down - next page
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
      } else {
        // Scroll up - previous page
        setCurrentPage(prev => Math.max(prev - 1, 1));
      }
    };

    const tableContainer = document.querySelector('.parts-table-container');
    if (tableContainer) {
      tableContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => tableContainer.removeEventListener('wheel', handleWheel);
    }
  }, [filteredItems, itemsPerPage]);

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
          (item.supplier && item.supplier.toLowerCase().includes(search))
        );
      });
      setFilteredItems(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, stockItems]);

  useEffect(() => {
    fetchStockItems();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  // Get unique parts (group by MYOB, Part Number)
  const uniqueParts = filteredItems.reduce((acc, item) => {
    const key = `${item.myobNumber}-${item.partNumber}`;
    if (!acc[key]) {
      acc[key] = {
        myobNumber: item.myobNumber,
        partNumber: item.partNumber,
        partName: item.partName,
        suppliers: item.supplier ? [item.supplier] : [],
        models: item.model ? [item.model] : [],
        totalReceived: 0,
        totalIssued: 0,
        balance: 0
      };
    } else {
      if (!acc[key].partName && item.partName) {
        acc[key].partName = item.partName;
      }
      if (item.supplier && !acc[key].suppliers.includes(item.supplier)) {
        acc[key].suppliers.push(item.supplier);
      }
      if (item.model && !acc[key].models.includes(item.model)) {
        acc[key].models.push(item.model);
      }
    }
    acc[key].totalReceived += item.receivedQty || 0;
    acc[key].totalIssued += item.issuedQty || 0;
    acc[key].balance = acc[key].totalReceived - acc[key].totalIssued;
    return acc;
  }, {} as Record<string, any>);

  const partsArray = Object.values(uniqueParts).sort((a, b) => a.myobNumber.localeCompare(b.myobNumber));
  const totalPages = Math.ceil(partsArray.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = partsArray.slice(startIndex, endIndex);

  // สร้าง empty rows เพื่อให้ตารางมีความสูงคงที่
  const emptyRowsCount = Math.max(0, itemsPerPage - currentItems.length);
  const emptyRows = Array(emptyRowsCount).fill(null);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gray-800/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gray-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gray-900/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header with Back Button */}
        <div className="mb-8 relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
            📋 PARTS LIST
            <div className="text-2xl font-normal text-white/70 mt-2">
              (รายการ Part ทั้งหมด)
            </div>
          </h1>
          
          {/* Back Button - positioned absolute top right */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => window.history.back()}
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
              <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหา MYOB, Part Number, Part Name, Supplier..."
              className="block w-full pl-10 pr-3 py-2 border border-white/30 rounded-md leading-5 bg-white/10 backdrop-blur-sm placeholder-white/60 text-white focus:outline-none focus:placeholder-white/40 focus:ring-1 focus:ring-white/50 focus:border-white/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-white/70">
              พบ {partsArray.length} Part จากทั้งหมด {Object.keys(uniqueParts).length} Part
            </p>
          )}
        </div>

        {/* ตารางแสดงรายการ Parts */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm flex parts-table-container overflow-hidden border border-white/20">
          <div className="flex-1 min-w-0">
            <div className="p-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">รายการ Part ทั้งหมด</h3>
            </div>
            <div className="overflow-x-auto overflow-y-hidden">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider w-24">MYOB</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider w-32">PART NUMBER</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider w-48">PART NAME</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider w-32">SUPPLIER</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider w-24">MODEL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {[
                    ...currentItems.map((part, index) => {
                      const supplierText = part.suppliers && part.suppliers.length > 0 ? part.suppliers.join(', ') : '-';
                      const modelText = part.models && part.models.length > 0 ? part.models.join(', ') : '-';
                      return (
                        <tr key={`${part.myobNumber}-${part.partNumber}-${index}`} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-bold w-24">
                            <div className="truncate text-white">{part.myobNumber}</div>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold w-32">
                            <div className="truncate text-white" title={part.partNumber}>
                              {part.partNumber}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm font-bold w-48">
                            <div className="truncate text-white" title={part.partName}>
                              {part.partName}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-white w-32">
                            <div className="truncate" title={supplierText}>
                              {supplierText}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm w-24">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border-2 truncate text-white bg-white/10 border-white/30">
                              {modelText}
                            </span>
                          </td>
                        </tr>
                      );
                    }),
                    ...emptyRows.map((_, index) => (
                      <tr key={`empty-${index}`} className="h-16">
                        <td className="px-4 py-4 w-24">&nbsp;</td>
                        <td className="px-4 py-4 w-32">&nbsp;</td>
                        <td className="px-4 py-4 w-48">&nbsp;</td>
                        <td className="px-4 py-4 w-32">&nbsp;</td>
                        <td className="px-4 py-4 w-24">&nbsp;</td>
                      </tr>
                    ))
                  ]}
                </tbody>
              </table>
            </div>
          </div>
        </div>


        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all duration-200 border border-white/30"
            >
              ← ก่อนหน้า
            </button>
            
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <span className="text-white font-medium">
                หน้า {currentPage} จาก {totalPages}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all duration-200 border border-white/30"
            >
              ถัดไป →
            </button>
          </div>
        )}

        {/* สรุปข้อมูล Parts */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg mt-6 border border-white/20">
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">
                  {partsArray.length}
                </div>
                <div className="text-sm text-white/70">Part ทั้งหมด</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
