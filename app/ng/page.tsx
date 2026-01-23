'use client';

import { useState, useEffect } from 'react';

interface NGTransaction {
  id: string;
  myobNumber: string;
  model: string;
  partName: string;
  partNumber: string;
  revision?: string;
  poNumber?: string;
  receivedQty: number;
  receivedDate: string;
  supplier?: string;
  issuedQty: number;
  invoiceNumber?: string;
  issueDate?: string;
  customer?: string;
  event?: string;
  withdrawalNumber?: string;
  remarks?: string;
  createdAt: string;
}

export default function NGPage() {
  const [ngTransactions, setNGTransactions] = useState<NGTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch NG transactions
      const ngResponse = await fetch('/api/ng-items');
      const ngData = await ngResponse.json();
      const transactions = Array.isArray(ngData) ? ngData : [];
      setNGTransactions(transactions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-rose-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-rose-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header with Back Button */}
        <div className="mb-8 relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-red-100 to-rose-200 bg-clip-text text-transparent">
            🚫 NG STOCK
            <div className="text-2xl font-normal text-white/70 mt-2">
              (งาน NG)
            </div>
          </h1>
          <p className="text-white/80 mt-4">จ่ายงานจากคลังไปยังงาน NG โดยตัดจากสต็อก</p>
          
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
      
        <div className="grid grid-cols-1 gap-6 px-4">

        {/* NG History */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">📋 ประวัติงาน NG</h2>
          
          {ngTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🚫</div>
              <p className="text-white/60">ยังไม่มีประวัติงาน NG</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {ngTransactions.map((transaction) => (
                <div key={transaction.id} className="border border-red-400/30 rounded-lg p-4 bg-red-500/10 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-white">
                        {transaction.myobNumber} - {transaction.partName}
                      </h3>
                      <p className="text-sm text-white/60">Part No: {transaction.partNumber}</p>
                      <p className="text-sm text-white/60">Model: {transaction.model}</p>
                    </div>
                    <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs font-medium border border-red-500/30">
                      NG: {transaction.issuedQty}
                    </span>
                  </div>
                  
                  <div className="text-sm text-white/70 space-y-1">
                    <div>วันที่: {transaction.issueDate ? new Date(transaction.issueDate).toLocaleDateString('th-TH') : '-'}</div>
                    {transaction.customer && (
                      <div>Customer: {transaction.customer}</div>
                    )}
                    {transaction.invoiceNumber && (
                      <div>Invoice: {transaction.invoiceNumber}</div>
                    )}
                    {transaction.remarks && (
                      <div className="bg-white/10 p-2 rounded border border-white/20">
                        <span className="font-medium text-white">หมายเหตุ:</span> <span className="text-white/80">{transaction.remarks}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">📊 สรุปงาน NG</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 backdrop-blur-sm">
            <div className="text-2xl font-bold text-red-300">
              {ngTransactions.reduce((sum, t) => sum + t.issuedQty, 0)}
            </div>
            <div className="text-sm text-red-400">จำนวน NG ทั้งหมด</div>
          </div>
          <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30 backdrop-blur-sm">
            <div className="text-2xl font-bold text-orange-300">
              {ngTransactions.length}
            </div>
            <div className="text-sm text-orange-400">รายการ NG ทั้งหมด</div>
          </div>
          <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30 backdrop-blur-sm">
            <div className="text-2xl font-bold text-yellow-300">
              {new Set(ngTransactions.map(t => `${t.myobNumber}-${t.partNumber}`)).size}
            </div>
            <div className="text-sm text-yellow-400">สินค้าที่มี NG</div>
          </div>
        </div>
      </div>
        
      </div>
    </div>
  );
}
