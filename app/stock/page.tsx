'use client';

import { useState, useEffect } from 'react';
import { StockItem } from '@/types/stock';
import StockBalanceTable from '@/components/StockBalanceTable';
import { useRouter } from 'next/navigation';

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const normalizeSearchText = (value?: string) =>
    (value || '')
      .toString()
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[\u2010-\u2015\u2212]/g, '-')
      .toLowerCase()
      .replace(/[\s-]+/g, '');

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    try {
      const response = await fetch('/api/stock');
      if (response.ok) {
        const data = await response.json();
        setStockItems(data);
      } else {
        console.error('Failed to fetch stock items');
      }
    } catch (error) {
      console.error('Error fetching stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = stockItems.filter(item => {
    const search = normalizeSearchText(searchTerm);
    if (!search) return true;
    return (
      normalizeSearchText(item.partName).includes(search) ||
      normalizeSearchText(item.partNumber).includes(search) ||
      normalizeSearchText(item.model).includes(search) ||
      normalizeSearchText(item.myobNumber).includes(search)
    );
  });

  const calculateBalance = (received: number, issued?: number) => {
    return received - (issued || 0);
  };

  const totalReceived = stockItems.reduce((sum, item) => sum + item.receivedQty, 0);
  const totalIssued = stockItems.reduce((sum, item) => sum + (item.issuedQty || 0), 0);
  const totalBalance = totalReceived - totalIssued;
  const lowStockItems = stockItems.filter(item => calculateBalance(item.receivedQty, item.issuedQty) <= 10);
  const outOfStockItems = stockItems.filter(item => calculateBalance(item.receivedQty, item.issuedQty) <= 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gray-800/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gray-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gray-900/30 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-white">กำลังโหลด...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gray-800/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gray-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gray-900/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-8 relative">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-white rounded-full mr-3 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            </div>
            <h1 className="text-4xl font-bold text-white">STOCK BALANCE</h1>
          </div>
          <p className="text-white/70 text-lg">(สต็อกคงเหลือทั้งหมด)</p>
          
          {/* Back Button - positioned absolute top right */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => router.push('/dashboard')}
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
              placeholder="ค้นหาสินค้า (Part Name, Part No., Model, MYOB)..."
              className="block w-full pl-10 pr-3 py-2 border border-white/20 rounded-md leading-5 bg-white/10 backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 focus:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>


        {/* Stock Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-white/20">
          <StockBalanceTable 
            items={filteredItems}
          />
        </div>
      </div>
    </div>
  );
}
