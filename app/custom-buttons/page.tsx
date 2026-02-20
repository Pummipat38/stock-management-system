'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

 type FieldType = 'text' | 'date' | 'number' | 'textarea';

interface CustomButton {
  id: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
}

interface ButtonData {
  id: string;
  buttonId: string;
  fieldName: string;
  fieldValue: string;
  fieldType: FieldType;
  createdAt: string;
}

export default function CustomButtonsPage() {
  const [buttons, setButtons] = useState<CustomButton[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [selectedButton, setSelectedButton] = useState<CustomButton | null>(null);
  const [buttonData, setButtonData] = useState<ButtonData[]>([]);
  const [isCreateDataModalOpen, setIsCreateDataModalOpen] = useState(false);
  
  const [newButton, setNewButton] = useState({
    name: '',
    color: 'blue',
    description: ''
  });

  const [newData, setNewData] = useState({
    fieldName: '',
    fieldValue: '',
    fieldType: 'text' as FieldType
  });

  const router = useRouter();

  useEffect(() => {
    fetchButtons();
  }, []);

  const fetchButtons = async () => {
    try {
      const response = await fetch('/api/custom-buttons');
      if (response.ok) {
        const data = await response.json();
        setButtons(data);
      }
    } catch (error) {
      console.error('Error fetching buttons:', error);
    }
  };

  const fetchButtonData = async (buttonId: string) => {
    try {
      const response = await fetch(`/api/custom-buttons/${buttonId}/data`);
      if (response.ok) {
        const data = await response.json();
        setButtonData(data);
      }
    } catch (error) {
      console.error('Error fetching button data:', error);
    }
  };

  const createButton = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/custom-buttons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newButton),
      });

      if (response.ok) {
        fetchButtons();
        setIsCreateModalOpen(false);
        setNewButton({ name: '', color: 'blue', description: '' });
        alert('สร้างปุ่มสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาดในการสร้างปุ่ม');
      }
    } catch (error) {
      console.error('Error creating button:', error);
      alert('เกิดข้อผิดพลาดในการสร้างปุ่ม');
    }
  };

  const createButtonData = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedButton) return;
    
    try {
      const response = await fetch(`/api/custom-buttons/${selectedButton.id}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newData,
          buttonId: selectedButton.id
        }),
      });

      if (response.ok) {
        fetchButtonData(selectedButton.id);
        setIsCreateDataModalOpen(false);
        setNewData({ fieldName: '', fieldValue: '', fieldType: 'text' });
        alert('เพิ่มข้อมูลสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
      }
    } catch (error) {
      console.error('Error creating button data:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  };

  const deleteButton = async (id: string) => {
    if (!confirm('ต้องการลบปุ่มนี้หรือไม่?')) return;
    
    try {
      const response = await fetch(`/api/custom-buttons/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchButtons();
        alert('ลบปุ่มสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาดในการลบปุ่ม');
      }
    } catch (error) {
      console.error('Error deleting button:', error);
      alert('เกิดข้อผิดพลาดในการลบปุ่ม');
    }
  };

  const deleteButtonData = async (id: string) => {
    if (!confirm('ต้องการลบข้อมูลนี้หรือไม่?')) return;
    
    try {
      const response = await fetch(`/api/custom-buttons/data/${id}`, {
        method: 'DELETE',
      });

      if (response.ok && selectedButton) {
        fetchButtonData(selectedButton.id);
        alert('ลบข้อมูลสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } catch (error) {
      console.error('Error deleting button data:', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const openButtonData = (button: CustomButton) => {
    setSelectedButton(button);
    fetchButtonData(button.id);
    setIsDataModalOpen(true);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; hover: string; text: string }> = {
      blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', text: 'text-white' },
      green: { bg: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-white' },
      red: { bg: 'bg-red-600', hover: 'hover:bg-red-700', text: 'text-white' },
      yellow: { bg: 'bg-yellow-600', hover: 'hover:bg-yellow-700', text: 'text-white' },
      purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', text: 'text-white' },
      pink: { bg: 'bg-pink-600', hover: 'hover:bg-pink-700', text: 'text-white' },
      indigo: { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', text: 'text-white' },
      gray: { bg: 'bg-gray-600', hover: 'hover:bg-gray-700', text: 'text-white' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">� MASTER PLAN</h1>
          <p className="text-gray-400">จัดการเอกสารและสถานะ Part ตามที่กำหนด</p>
        </div>

        {/* Back Button - positioned absolute top right */}
        <div className="absolute top-0 right-0">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
          >
            ← BACK
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
          >
            ➕ สร้างปุ่มใหม่
          </button>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {buttons.map((button) => {
            const colorClasses = getColorClasses(button.color);
            return (
              <div
                key={button.id}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-xl transition-all hover:scale-105"
              >
                <h3 className="text-xl font-bold text-white mb-2">{button.name}</h3>
                {button.description && (
                  <p className="text-gray-400 text-sm mb-4">{button.description}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => openButtonData(button)}
                    className={`flex-1 px-4 py-2 ${colorClasses.bg} ${colorClasses.hover} ${colorClasses.text} rounded-lg font-medium transition-colors`}
                  >
                    📋 ดูข้อมูล
                  </button>
                  <button
                    onClick={() => deleteButton(button.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Button Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">➕ สร้างปุ่มใหม่</h2>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={createButton} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อปุ่ม *</label>
                  <input
                    type="text"
                    value={newButton.name}
                    onChange={(e) => setNewButton(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="กรอกชื่อปุ่ม (เช่น: MODEL, ISSUE PR)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">สีปุ่ม</label>
                  <select
                    value={newButton.color}
                    onChange={(e) => setNewButton(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="blue">🔵 น้ำเงิน</option>
                    <option value="green">🟢 เขียว</option>
                    <option value="red">🔴 แดง</option>
                    <option value="yellow">🟡 เหลือง</option>
                    <option value="purple">🟣 ม่วง</option>
                    <option value="pink">🩷 ชมพู</option>
                    <option value="indigo">🔷 คราม</option>
                    <option value="gray">⚫ เทา</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">คำอธิบาย</label>
                  <textarea
                    value={newButton.description}
                    onChange={(e) => setNewButton(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="กรอกคำอธิบายปุ่ม (ถ้ามี)"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ❌ ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    💾 สร้างปุ่ม
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Button Data Modal */}
        {isDataModalOpen && selectedButton && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 rounded-t-2xl border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📋 ข้อมูลปุ่ม: {selectedButton.name}
                  </h2>
                  <button
                    onClick={() => setIsDataModalOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">รายการข้อมูล</h3>
                  <button
                    onClick={() => setIsCreateDataModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    ➕ เพิ่มข้อมูล
                  </button>
                </div>

                <div className="space-y-4">
                  {buttonData.map((data) => (
                    <div key={data.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-2">{data.fieldName}</h4>
                          {data.fieldType === 'textarea' ? (
                            <p className="text-gray-300 whitespace-pre-wrap">{data.fieldValue}</p>
                          ) : (
                            <p className="text-gray-300">{data.fieldValue}</p>
                          )}
                          <p className="text-gray-500 text-sm mt-2">
                            ประเภท: {data.fieldType} | สร้าง: {new Date(data.createdAt).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteButtonData(data.id)}
                          className="ml-4 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {buttonData.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-lg mb-2">📭 ยังไม่มีข้อมูล</p>
                      <p>กด "เพิ่มข้อมูล" เพื่อเริ่มบันทึก</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Data Modal */}
        {isCreateDataModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 rounded-t-2xl border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">➕ เพิ่มข้อมูลใหม่</h2>
                  <button
                    onClick={() => setIsCreateDataModalOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={createButtonData} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อฟิลด์ *</label>
                  <input
                    type="text"
                    value={newData.fieldName}
                    onChange={(e) => setNewData(prev => ({ ...prev, fieldName: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="กรอกชื่อฟิลด์ (เช่น: วันที่เปิด Issue, PR Number)"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ประเภทฟิลด์</label>
                  <select
                    value={newData.fieldType}
                    onChange={(e) => setNewData(prev => ({ ...prev, fieldType: e.target.value as FieldType }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="text">📝 ข้อความ</option>
                    <option value="date">📅 วันที่</option>
                    <option value="number">🔢 ตัวเลข</option>
                    <option value="textarea">📄 ย่อหน้าข้อความ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ค่าฟิลด์ *</label>
                  {newData.fieldType === 'textarea' ? (
                    <textarea
                      value={newData.fieldValue}
                      onChange={(e) => setNewData(prev => ({ ...prev, fieldValue: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                      placeholder="กรอกค่าฟิลด์"
                      required
                    />
                  ) : (
                    <input
                      type={newData.fieldType}
                      value={newData.fieldValue}
                      onChange={(e) => setNewData(prev => ({ ...prev, fieldValue: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="กรอกค่าฟิลด์"
                      required
                    />
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsCreateDataModalOpen(false)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ❌ ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    💾 เพิ่มข้อมูล
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
