'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 flex items-center justify-center">
      <div className="text-white text-2xl">กำลังโหลด...</div>
    </div>
  );
}
