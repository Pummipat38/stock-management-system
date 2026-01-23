'use client';

import { useState, useEffect } from 'react';

interface LoadingProgressProps {
  message?: string;
  className?: string;
}

export default function LoadingProgress({ 
  message = "กำลังโหลดข้อมูล", 
  className = "" 
}: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          return 0; // รีเซ็ตกลับไปเริ่มใหม่
        }
        const increment = Math.random() * 7 + 1;
        return Math.min(prev + increment, 95);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex justify-center items-center h-64 ${className}`}>
      <div className="flex flex-col items-center space-y-6 w-full max-w-md">
        {/* Spinning Circle */}
        <div className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full animate-spin"></div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700/50 rounded-full h-3 backdrop-blur-sm border border-white/10">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Progress Text */}
        <div className="text-center">
          <div className="text-2xl font-bold text-white/90 mb-1">
            {Math.round(progress)}%
          </div>
          <div className="text-sm text-white/70">{message}</div>
        </div>
      </div>
    </div>
  );
}
