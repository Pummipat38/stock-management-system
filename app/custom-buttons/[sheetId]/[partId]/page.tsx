/* eslint-disable */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function MasterPlanPartPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 relative">
          <h1 className="text-3xl font-bold text-white mb-2">ไม่พบหน้า</h1>
          <p className="text-gray-400">ฟีเจอร์นี้ถูกลบออกจากระบบแล้ว</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
