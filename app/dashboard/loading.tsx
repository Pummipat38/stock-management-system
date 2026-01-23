'use client';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 via-emerald-800 via-teal-700 to-green-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
            <div className="text-lg text-white/80 font-medium">กำลังโหลดข้อมูล...</div>
          </div>
        </div>
      </div>
    </div>
  );
}
