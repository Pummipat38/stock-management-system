'use client';

import { useState, useEffect } from 'react';

interface BackupFile {
  fileName: string;
  size: number;
  createdAt: string;
  recordCount: number;
  totalReceived: number;
  totalIssued: number;
  type: string;
  error?: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/backup');
      const data = await response.json();
      if (data.success) {
        setBackups(data.backups);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' })
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage(`✅ สร้าง Backup สำเร็จ: ${result.recordCount} รายการ`);
        loadBackups();
      } else {
        setMessage(`❌ สร้าง Backup ล้มเหลว: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (fileName: string) => {
    if (!confirm(`คุณต้องการกู้คืนข้อมูลจาก ${fileName} ใช่หรือไม่?\n\n⚠️ ข้อมูลปัจจุบันทั้งหมดจะถูกแทนที่!`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', fileName })
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage(`✅ กู้คืนข้อมูลสำเร็จ: ${result.recordCount} รายการ`);
        // รีเฟรชหน้าเพื่อแสดงข้อมูลใหม่
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setMessage(`❌ กู้คืนข้อมูลล้มเหลว: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' })
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage(`✅ Export Excel สำเร็จ: ${result.recordCount} รายการ\n📄 รายละเอียด: ${result.fileName}\n📋 สรุป: ${result.summaryFileName}\n📊 FIFO: ${result.fifoFileName || 'ไม่มีข้อมูล'}\n📁 โฟลเดอร์: D:\\stock-backups\\excel\\`);
      } else {
        setMessage(`❌ Export ล้มเหลว: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const exportFIFO = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export-fifo' })
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage(`✅ Export FIFO สำเร็จ!\n📊 จำนวน Parts: ${result.partCount}\n📄 ไฟล์หลัก: ${result.fileName}\n📁 โฟลเดอร์: D:\\stock-backups\\excel\\`);
      } else {
        setMessage(`❌ Export FIFO ล้มเหลว: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ เกิดข้อผิดพลาด: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            🛡️ ระบบสำรองข้อมูล
          </h1>
          <p className="text-purple-200">ปลอดภัย ไม่หายอีกต่อไป</p>
        </div>

        {/* Action Buttons */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={createBackup}
              disabled={loading}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ กำลังสำรอง...' : '💾 สร้าง Backup ทันที'}
            </button>
            
            <button
              onClick={exportData}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ กำลัง Export...' : '📊 Export Excel'}
            </button>

            <button
              onClick={exportFIFO}
              disabled={loading}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ กำลัง Export...' : '📋 Export FIFO (แยก Part)'}
            </button>
            
            <button
              onClick={loadBackups}
              disabled={loading}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 รีเฟรช
            </button>

            <button
              onClick={() => {
                // เปิดโฟลเดอร์ Excel
                window.open('file:///D:/stock-backups/excel/', '_blank');
              }}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              📁 เปิดโฟลเดอร์ Excel
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 mb-6">
            <pre className="text-white whitespace-pre-wrap">{message}</pre>
          </div>
        )}

        {/* Backup List */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white mb-2">📋 รายการไฟล์สำรอง</h2>
            <p className="text-purple-200">ระบบสำรองข้อมูลอัตโนมัติทุก 30 นาที</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">ชื่อไฟล์</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">ขนาด</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">จำนวนข้อมูล</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">รับเข้า/จ่ายออก</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">วันที่สร้าง</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">ประเภท</th>
                  <th className="px-6 py-4 text-center text-purple-200 font-semibold">การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-purple-200">
                      ไม่มีไฟล์สำรอง - กดปุ่ม "สร้าง Backup ทันที" เพื่อเริ่มต้น
                    </td>
                  </tr>
                ) : (
                  backups.map((backup, index) => (
                    <tr key={backup.fileName} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4 text-white font-mono text-sm">
                        {backup.fileName}
                        {backup.error && (
                          <div className="text-red-400 text-xs mt-1">⚠️ {backup.error}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-purple-200">
                        {formatFileSize(backup.size)}
                      </td>
                      <td className="px-6 py-4 text-center text-blue-400 font-semibold">
                        {backup.recordCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-purple-200 text-sm">
                        <div className="text-green-400">📥 {backup.totalReceived?.toLocaleString() || 0}</div>
                        <div className="text-orange-400">📤 {backup.totalIssued?.toLocaleString() || 0}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-purple-200 text-sm">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          backup.type === 'auto' ? 'bg-blue-500/20 text-blue-300' :
                          backup.type === 'manual' ? 'bg-green-500/20 text-green-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {backup.type === 'auto' ? '🤖 อัตโนมัติ' :
                           backup.type === 'manual' ? '👤 ด้วยตนเอง' :
                           '🚀 เริ่มต้น'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => restoreBackup(backup.fileName)}
                          disabled={loading || !!backup.error}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          🔄 กู้คืน
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">ℹ️ ข้อมูลเพิ่มเติม</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-purple-200">
            <div>
              <h4 className="font-semibold text-white mb-2">🔄 Auto Backup:</h4>
              <ul className="space-y-1 text-sm">
                <li>• สำรองข้อมูลอัตโนมัติทุก 30 นาที</li>
                <li>• เก็บไฟล์สำรอง 30 วัน</li>
                <li>• บันทึกใน D:\stock-backups\</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">🛡️ ความปลอดภัย:</h4>
              <ul className="space-y-1 text-sm">
                <li>• ไม่ต้องพึ่งอินเทอร์เน็ต</li>
                <li>• ข้อมูลอยู่ในเครื่องคุณ</li>
                <li>• กู้คืนได้ทุกเมื่อ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">📋 FIFO Excel:</h4>
              <ul className="space-y-1 text-sm">
                <li>• 1 Part = 1 Sheet แยกชัดเจน</li>
                <li>• แสดง Running Balance</li>
                <li>• ไม่งงเรื่อง FIFO อีกต่อไป</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
