'use client';

import { useState, useEffect, useMemo } from 'react';
import { StockItem } from '@/types/stock';

interface ReceivingFormData {
  myobNumber: string;
  model: string;
  partName: string;
  partNumber: string;
  revision: string;
  poNumber: string;
  receivedQty: number;
  receivedDate: string;
  supplier?: string;
  customer?: string;
  remarks?: string;
}

interface BulkPartData {
  myobNumber: string;
  model: string;
  partName: string;
  partNumber: string;
  revision: string;
  receivedQty: number;
}

interface BulkReceivingFormData {
  poNumber: string;
  receivedDate: string;
  supplier?: string;
  customer?: string;
  remarks?: string;
  parts: BulkPartData[];
}

interface ReceivingFormData {
  myobNumber: string;
  model: string;
  partName: string;
  partNumber: string;
  revision: string;
  poNumber: string;
  receivedQty: number;
  receivedDate: string;
  supplier?: string;
  customer?: string;
  remarks?: string;
}

export default function ReceivingPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailGroupKey, setDetailGroupKey] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 13;

  // Handle mouse wheel scrolling
  useEffect(() => {
    const handleWheel = (event: Event) => {
      const wheelEvent = event as WheelEvent;
      const receivedItems = filteredItems.filter(item => item.receivedQty > 0);
      const totalPages = Math.ceil(receivedItems.length / itemsPerPage);
      
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

    const tableContainer = document.querySelector('.receiving-table-container');
    if (tableContainer) {
      tableContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => tableContainer.removeEventListener('wheel', handleWheel);
    }
  }, [filteredItems, itemsPerPage]);
  const [formData, setFormData] = useState<ReceivingFormData>({
    myobNumber: '',
    model: '',
    partName: '',
    partNumber: '',
    revision: '',
    poNumber: '',
    receivedQty: 0,
    receivedDate: new Date().toISOString().split('T')[0],
    supplier: '',
    customer: '',
    remarks: '',
  });

  const [bulkFormData, setBulkFormData] = useState<BulkReceivingFormData>({
    poNumber: '',
    receivedDate: new Date().toISOString().split('T')[0],
    supplier: '',
    customer: '',
    remarks: '',
    parts: [
      {
        myobNumber: '',
        model: '',
        partName: '',
        partNumber: '',
        revision: '',
        receivedQty: 0,
      }
    ]
  });

  // Build autocomplete suggestion lists from previously entered stock items
  const fieldSuggestions = useMemo(() => {
    const fields = ['myobNumber', 'model', 'partNumber', 'partName', 'revision', 'poNumber', 'supplier', 'customer'];
    const map: Record<string, string[]> = {};
    fields.forEach(f => {
      const set = new Set<string>();
      stockItems.forEach(item => {
        const v = String((item as unknown as Record<string, unknown>)[f] ?? '').trim();
        if (v) set.add(v);
      });
      map[f] = Array.from(set).sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }));
    });
    return map;
  }, [stockItems]);

  const renderSuggestionDatalists = () => (
    <>
      {Object.entries(fieldSuggestions).map(([field, options]) => (
        <datalist key={field} id={`dl-${field}`}>
          {options.map(opt => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
      ))}
    </>
  );

  const fetchStockItems = async () => {
    try {
      // Bypass cache เพื่อดูข้อมูลล่าสุด
      const response = await fetch(`/api/stock?ts=${Date.now()}`);
      const data = await response.json();
      console.log('Stock items fetched:', data.length);
      console.log('TSO10061 found:', data.filter((item: any) => item.myobNumber === 'TSO10061'));
      setStockItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteSelected = async () => {
    if (selectedDeleteIds.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการลบ');
      return;
    }

    for (const id of selectedDeleteIds) {
      await handleDelete(id);
    }
    setSelectedDeleteIds([]);
    setIsDeleteMode(false);
  };

  const handleEditSelected = () => {
    if (selectedDeleteIds.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการแก้ไข');
      return;
    }
    if (selectedDeleteIds.length > 1) {
      alert('กรุณาเลือกเพียง 1 รายการเพื่อแก้ไข');
      return;
    }
    const targetItem = stockItems.find(item => item.id === selectedDeleteIds[0]);
    if (!targetItem) {
      alert('ไม่พบรายการที่เลือก');
      return;
    }
    handleEdit(targetItem);
  };

  const toggleDeleteSelection = (id: string) => {
    setSelectedDeleteIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Filter items based on search term
  useEffect(() => {
    const search = normalizeSearchText(searchTerm);
    if (!search) {
      setFilteredItems(stockItems);
    } else {
      const filtered = stockItems.filter(item => {
        return (
          normalizeSearchText(item.myobNumber).includes(search) ||
          normalizeSearchText(item.partName).includes(search) ||
          normalizeSearchText(item.partNumber).includes(search) ||
          normalizeSearchText(item.model).includes(search) ||
          normalizeSearchText(item.poNumber).includes(search)
        );
      });
      setFilteredItems(filtered);
    }
  }, [searchTerm, stockItems]);

  useEffect(() => {
    fetchStockItems();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'receivedQty' ? Number(value) : value,
    }));
  };

  // ตรวจสอบข้อมูลซ้ำก่อนบันทึก
  const checkDuplicateData = (data: ReceivingFormData) => {
    const normalizedInvoice = (data.poNumber || '').toLowerCase().trim();
    const normalizedPartName = data.partName.toLowerCase().trim();
    const normalizedPartNumber = data.partNumber.toLowerCase().trim();
    const receivedQty = data.receivedQty;

    const duplicates = stockItems.filter(item => {
      if (!item.receivedQty || item.receivedQty <= 0) return false;
      
      const itemInvoice = (item.poNumber || '').toLowerCase().trim();
      const itemPartName = item.partName.toLowerCase().trim();
      const itemPartNumber = item.partNumber.toLowerCase().trim();
      const itemQty = item.receivedQty;

      // ตรวจสอบว่ามีข้อมูลซ้ำกัน (invoice + part name + part number + จำนวน)
      return (
        itemInvoice === normalizedInvoice &&
        itemPartName === normalizedPartName &&
        itemPartNumber === normalizedPartNumber &&
        itemQty === receivedQty
      );
    });

    return duplicates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลซ้ำ
    const duplicates = checkDuplicateData(formData);
    if (duplicates.length > 0) {
      const duplicateInfo = duplicates.map(item => 
        `MYOB: ${item.myobNumber}, Part: ${item.partNumber}, จำนวน: ${item.receivedQty}, วันที่: ${new Date(item.receivedDate).toLocaleDateString('th-TH')}`
      ).join('\n');
      
      const confirmMessage = `พบข้อมูลซ้ำ ${duplicates.length} รายการ:\n\n${duplicateInfo}\n\nต้องการบันทึกซ้ำหรือไม่?`;
      const confirmed = confirm(confirmMessage);
      
      if (!confirmed) {
        return;
      }
    }

    try {
      const url = editingItem ? `/api/stock/${editingItem.id}` : '/api/stock';
      const method = editingItem ? 'PUT' : 'POST';
      
      const submitData = editingItem ? {
        ...editingItem,
        ...formData,
      } : formData;

      console.log('Sending request to:', url);
      console.log('Method:', method);
      console.log('Submit data:', submitData);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        
        alert('บันทึกข้อมูลสำเร็จ!');
        
        setIsFormOpen(false);
        setEditingItem(null);
        setFormData({
          myobNumber: '',
          model: '',
          partName: '',
          partNumber: '',
          revision: '',
          poNumber: '',
          receivedQty: 0,
          receivedDate: new Date().toISOString().split('T')[0],
          supplier: '',
          remarks: '',
        });
        fetchStockItems();
      } else {
        const errorData = await response.text();
        console.error('Response error:', errorData);
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + response.status);
      }
    } catch (error) {
      console.error('Error saving receiving data:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormData({
      myobNumber: item.myobNumber,
      model: item.model,
      partName: item.partName,
      partNumber: item.partNumber,
      revision: item.revision,
      poNumber: item.poNumber,
      receivedQty: item.receivedQty,
      receivedDate: new Date(item.receivedDate).toISOString().split('T')[0],
      supplier: item.supplier || '',
      customer: item.customer || '',
      remarks: item.remarks || '',
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) {
      try {
        const response = await fetch(`/api/stock/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchStockItems();
        }
      } catch (error) {
        console.error('Error deleting stock item:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {renderSuggestionDatalists()}
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gray-800/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gray-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gray-900/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-8 py-8 relative z-10 max-w-[95%]">
        {/* Header with Back Button */}
        <div className="mb-8 relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
            📥 RECEIVING
            <div className="text-2xl font-normal text-white/70 mt-2">
              (รับงานเข้า)
            </div>
          </h1>
          
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
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                myobNumber: '',
                model: '',
                partName: '',
                partNumber: '',
                revision: '',
                poNumber: '',
                receivedQty: 0,
                receivedDate: new Date().toISOString().split('T')[0],
                supplier: '',
                remarks: '',
              });
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
          >
            📥 บันทึกการรับเข้าใหม่
          </button>

          <button
            onClick={() => {
              setBulkFormData({
                poNumber: '',
                receivedDate: new Date().toISOString().split('T')[0],
                supplier: '',
                customer: '',
                remarks: '',
                parts: [
                  {
                    myobNumber: '',
                    model: '',
                    partName: '',
                    partNumber: '',
                    revision: '',
                    receivedQty: 0,
                  }
                ]
              });
              setIsBulkFormOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
          >
            📦 บันทึกการรับเข้าใหม่ &gt;1
          </button>

          <button
            onClick={() => window.location.href = '/receiving-archive'}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
          >
            🗂️ รายการรับเข้า (ไม่มีสต็อก)
          </button>

          <button
            onClick={() => window.location.href = '/parts'}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
          >
            📋 ดู Part ทั้งหมด
          </button>
          <button
            onClick={() => {
              setIsDeleteMode(prev => !prev);
              setSelectedDeleteIds([]);
            }}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors border border-white/30"
          >
            ⚙️ ตัวเลือก
          </button>
          {isDeleteMode && (
            <button
              onClick={handleEditSelected}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
            >
              ✏️ แก้ไขที่เลือก ({selectedDeleteIds.length})
            </button>
          )}
          {isDeleteMode && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
            >
              🗑️ ลบที่เลือก ({selectedDeleteIds.length})
            </button>
          )}
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
            placeholder="ค้นหา MYOB, Model, Part Name, Part Number, PO Number..."
            className="block w-full pl-10 pr-3 py-2 border border-white/30 rounded-md leading-5 bg-white/10 backdrop-blur-sm placeholder-white/60 text-white focus:outline-none focus:placeholder-white/40 focus:ring-1 focus:ring-white/50 focus:border-white/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-white/70">
            พบ {filteredItems.length} รายการจากทั้งหมด {stockItems.length} รายการ
          </p>
        )}

      {isDetailOpen && detailGroupKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">🔍 รายละเอียดการรับเข้า</h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                ปิด
              </button>
            </div>

            {/* ทดสอบเพิ่มช่องค้นหา */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-2">🔍 ค้นหารหัสสินค้า:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์รหัสสินค้า..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const searchValue = e.currentTarget.value.trim();
                      if (searchValue) {
                        const foundItem = stockItems.find(item => 
                          item.partNumber.toLowerCase().includes(searchValue.toLowerCase())
                        );
                        if (foundItem) {
                          setDetailGroupKey(getGroupKey(foundItem));
                          e.currentTarget.value = '';
                        } else {
                          alert('ไม่พบรหัสสินค้านี้');
                        }
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const inputs = document.querySelectorAll('input[placeholder="พิมพ์รหัสสินค้า..."]');
                    if (inputs.length > 0) {
                      const input = inputs[0] as HTMLInputElement;
                      const searchValue = input.value.trim();
                      if (searchValue) {
                        const foundItem = stockItems.find(item => 
                          item.partNumber.toLowerCase().includes(searchValue.toLowerCase())
                        );
                        if (foundItem) {
                          setDetailGroupKey(getGroupKey(foundItem));
                          input.value = '';
                        } else {
                          alert('ไม่พบรหัสสินค้านี้');
                        }
                      }
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  ค้นหา
                </button>
              </div>
            </div>

            {(() => {
              const items = stockItems
                .filter(item => getGroupKey(item) === detailGroupKey && item.receivedQty > 0)
                .slice()
                .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());
              const totalReceived = items.reduce((sum, item) => sum + item.receivedQty, 0);
              
              // คำนวณยอดเบิกทั้งหมด (รวมรายการที่ issuedQty > 0 ด้วย)
              const allItemsWithSameKey = stockItems.filter(item => getGroupKey(item) === detailGroupKey);
              const totalIssued = allItemsWithSameKey.reduce((sum, item) => sum + (item.issuedQty || 0), 0);
              const actualBalance = totalReceived - totalIssued;
              
              const headerItem = items[0];
              const models = Array.from(
                new Set(items.map(item => (item.model || '').trim()).filter(Boolean))
              );
              const modelText = models.length > 0 ? models.join(', ') : '-';

              return (
                <div className="space-y-4">
                  {headerItem && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-500">MYOB</div>
                        <div className="text-lg font-semibold text-gray-800">{headerItem.myobNumber}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-500">MODEL</div>
                        <div className="text-lg font-semibold text-gray-800">{modelText}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-500">PART NUMBER</div>
                        <div className="text-lg font-semibold text-gray-800">{headerItem.partNumber}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-500">PART NAME</div>
                        <div className="text-lg font-semibold text-gray-800">{headerItem.partName}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-xs text-blue-600">รับเข้าทั้งหมด</div>
                        <div className="text-lg font-semibold text-blue-700">{totalReceived.toLocaleString()}</div>
                        <div className="text-xs text-blue-500">รับเข้า {items.length} ครั้ง</div>
                      </div>
                      <div className={`${actualBalance >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4`}>
                        <div className={`text-xs ${actualBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {actualBalance >= 0 ? 'คงเหลือ' : 'ติดลบ'}
                        </div>
                        <div className={`text-lg font-semibold ${actualBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {actualBalance.toLocaleString()}
                        </div>
                        <div className={`text-xs ${actualBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          (รับ {totalReceived} - เบิก {totalIssued})
                        </div>
                      </div>
                      {items.length > 1 && (
                        <div className="bg-orange-50 rounded-lg p-4">
                          <div className="text-xs text-orange-600">จัดการรายการซ้ำ</div>
                          <button
                            onClick={() => {
                              const confirmMessage = `ต้องการลบรายการซ้ำทั้งหมด ${items.length - 1} รายการหรือไม่?\n(จะเหลือไว้เฉพาะรายการล่าสุด)`;
                              if (confirm(confirmMessage)) {
                                // เรียงตามวันที่ ลบรายการเก่าทั้งหมด เหลือไว้แค่รายการล่าสุด
                                const sortedByDate = items.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
                                const itemsToDelete = sortedByDate.slice(1); // รายการเก่าทั้งหมด
                                
                                itemsToDelete.forEach(item => {
                                  handleDelete(item.id);
                                });
                                
                                setIsDetailOpen(false);
                                alert(`ลบรายการซ้ำ ${itemsToDelete.length} รายการเรียบร้อยแล้ว`);
                              }
                            }}
                            className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            🗑️ ลบรายการซ้ำทั้งหมด ({items.length - 1} รายการ)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-800">รายการรับเข้า</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white">
                          <tr className="text-gray-500">
                            <th className="py-3 px-4">วันที่รับเข้า</th>
                            <th className="py-3 px-4">PO</th>
                            <th className="py-3 px-4">จำนวนรับเข้า</th>
                            <th className="py-3 px-4">Supplier</th>
                            <th className="py-3 px-4">หมายเหตุ</th>
                            <th className="py-3 px-4 text-center">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.id} className="border-t">
                              <td className="py-3 px-4">{new Date(item.receivedDate).toLocaleDateString('th-TH')}</td>
                              <td className="py-3 px-4">{item.poNumber || '-'}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                  {item.receivedQty}
                                </span>
                              </td>
                              <td className="py-3 px-4">{item.supplier || '-'}</td>
                              <td className="py-3 px-4">{item.remarks || '-'}</td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors text-lg"
                                  title="ลบรายการนี้"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                          {items.length === 0 && (
                            <tr>
                              <td className="py-3 px-4 text-gray-500" colSpan={6}>ไม่มีข้อมูลรับเข้า</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingItem ? '✏️ แก้ไขข้อมูลการรับเข้า' : '📥 บันทึกการรับเข้าใหม่'}
                </h2>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingItem(null);
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* ข้อมูลพื้นฐาน */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  📋 ข้อมูลสินค้า
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">เลข MYOB *</label>
                    <input
                      type="text"
                      name="myobNumber"
                      list="dl-myobNumber"
                      value={formData.myobNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="กรอกเลข MYOB"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Model *</label>
                    <input
                      type="text"
                      name="model"
                      list="dl-model"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="กรอก Model"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Part Number *</label>
                    <input
                      type="text"
                      name="partNumber"
                      list="dl-partNumber"
                      value={formData.partNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="กรอก Part Number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Part Name *</label>
                    <input
                      type="text"
                      name="partName"
                      list="dl-partName"
                      value={formData.partName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="กรอก Part Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Revision</label>
                    <input
                      type="text"
                      name="revision"
                      list="dl-revision"
                      value={formData.revision}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="กรอก Revision (ถ้ามี)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">จำนวนที่รับเข้า *</label>
                    <input
                      type="number"
                      name="receivedQty"
                      value={formData.receivedQty}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="0"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ข้อมูลการรับเข้า */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  📦 ข้อมูลการรับเข้า
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">วันที่รับเข้า *</label>
                    <input
                      type="date"
                      name="receivedDate"
                      value={formData.receivedDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">เลข Purchase *</label>
                    <input
                      type="text"
                      name="poNumber"
                      list="dl-poNumber"
                      value={formData.poNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="กรอกเลข Purchase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Supplier</label>
                    <input
                      type="text"
                      name="supplier"
                      list="dl-supplier"
                      value={formData.supplier}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="กรอกชื่อ Supplier"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Customer</label>
                    <input
                      type="text"
                      name="customer"
                      list="dl-customer"
                      value={formData.customer}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="กรอกชื่อ Customer"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">หมายเหตุ</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                  />
                </div>
              </div>

              {/* ปุ่มควบคุม */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  ❌ ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  💾 {editingItem ? 'อัปเดต' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Receiving Form Modal */}
      {isBulkFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-4 rounded-t-2xl border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  📦 บันทึกการรับเข้าหลาย Part พร้อมกัน
                </h2>
                <button
                  onClick={() => setIsBulkFormOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              try {
                // บันทึกแต่ละ part แยกกัน
                for (const part of bulkFormData.parts) {
                  if (part.myobNumber && part.partNumber && part.partName && part.receivedQty > 0) {
                    const submitData = {
                      myobNumber: part.myobNumber,
                      model: part.model,
                      partName: part.partName,
                      partNumber: part.partNumber,
                      revision: part.revision,
                      poNumber: bulkFormData.poNumber,
                      receivedQty: part.receivedQty,
                      receivedDate: bulkFormData.receivedDate,
                      supplier: bulkFormData.supplier,
                      customer: bulkFormData.customer,
                      remarks: bulkFormData.remarks,
                    };

                    const response = await fetch('/api/stock', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(submitData),
                    });

                    if (!response.ok) {
                      throw new Error(`Failed to save part ${part.partNumber}`);
                    }
                  }
                }
                
                alert('บันทึกข้อมูลทั้งหมดสำเร็จ!');
                setIsBulkFormOpen(false);
                setBulkFormData({
                  poNumber: '',
                  receivedDate: new Date().toISOString().split('T')[0],
                  supplier: '',
                  customer: '',
                  remarks: '',
                  parts: [
                    {
                      myobNumber: '',
                      model: '',
                      partName: '',
                      partNumber: '',
                      revision: '',
                      receivedQty: 0,
                    }
                  ]
                });
                fetchStockItems();
              } catch (error) {
                console.error('Error saving bulk receiving data:', error);
                alert('เกิดข้อผิดพลาดในการบันทึก: ' + (error instanceof Error ? error.message : 'Unknown error'));
              }
            }} className="p-6 space-y-4">
              
              {/* ข้อมูลทั่วไป */}
              <div className="bg-slate-800/50 border border-sky-500/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  ข้อมูลทั่วไป (ใช้ร่วมกันทุก Part)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">เลข Purchase *</label>
                    <input
                      type="text"
                      list="dl-poNumber"
                      value={bulkFormData.poNumber}
                      onChange={(e) => setBulkFormData(prev => ({ ...prev, poNumber: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="กรอกเลข Purchase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">วันที่รับเข้า *</label>
                    <input
                      type="date"
                      value={bulkFormData.receivedDate}
                      onChange={(e) => setBulkFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Supplier</label>
                    <input
                      type="text"
                      list="dl-supplier"
                      value={bulkFormData.supplier || ''}
                      onChange={(e) => setBulkFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="กรอกชื่อ Supplier"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Customer</label>
                    <input
                      type="text"
                      list="dl-customer"
                      value={bulkFormData.customer || ''}
                      onChange={(e) => setBulkFormData(prev => ({ ...prev, customer: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="กรอกชื่อ Customer"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">หมายเหตุ</label>
                  <textarea
                    value={bulkFormData.remarks || ''}
                    onChange={(e) => setBulkFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
                    placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                  />
                </div>
              </div>

              {/* รายการ Parts */}
              <div className="bg-slate-800/50 border border-sky-500/30 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    📦 รายการ Parts
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkFormData(prev => ({
                        ...prev,
                        parts: [...prev.parts, {
                          myobNumber: '',
                          model: '',
                          partName: '',
                          partNumber: '',
                          revision: '',
                          receivedQty: 0,
                        }]
                      }));
                    }}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    ➕ เพิ่ม Part
                  </button>
                </div>

                <div className="space-y-3">
                  {bulkFormData.parts.map((part, index) => (
                    <div key={index} className="bg-slate-700/50 border border-slate-500/40 rounded-xl p-4 relative">
                      {bulkFormData.parts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setBulkFormData(prev => ({
                              ...prev,
                              parts: prev.parts.filter((_, i) => i !== index)
                            }));
                          }}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          ❌
                        </button>
                      )}
                      
                      <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                        📋 Part #{index + 1}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">เลข MYOB *</label>
                          <input
                            type="text"
                            list="dl-myobNumber"
                            value={part.myobNumber}
                            onChange={(e) => {
                              const newParts = [...bulkFormData.parts];
                              newParts[index].myobNumber = e.target.value;
                              setBulkFormData(prev => ({ ...prev, parts: newParts }));
                            }}
                            className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="กรอกเลข MYOB"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Model *</label>
                          <input
                            type="text"
                            list="dl-model"
                            value={part.model}
                            onChange={(e) => {
                              const newParts = [...bulkFormData.parts];
                              newParts[index].model = e.target.value;
                              setBulkFormData(prev => ({ ...prev, parts: newParts }));
                            }}
                            className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="กรอก Model"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Part Number *</label>
                          <input
                            type="text"
                            list="dl-partNumber"
                            value={part.partNumber}
                            onChange={(e) => {
                              const newParts = [...bulkFormData.parts];
                              newParts[index].partNumber = e.target.value;
                              setBulkFormData(prev => ({ ...prev, parts: newParts }));
                            }}
                            className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="กรอก Part Number"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Part Name *</label>
                          <input
                            type="text"
                            list="dl-partName"
                            value={part.partName}
                            onChange={(e) => {
                              const newParts = [...bulkFormData.parts];
                              newParts[index].partName = e.target.value;
                              setBulkFormData(prev => ({ ...prev, parts: newParts }));
                            }}
                            className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="กรอก Part Name"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Revision</label>
                          <input
                            type="text"
                            list="dl-revision"
                            value={part.revision}
                            onChange={(e) => {
                              const newParts = [...bulkFormData.parts];
                              newParts[index].revision = e.target.value;
                              setBulkFormData(prev => ({ ...prev, parts: newParts }));
                            }}
                            className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="กรอก Revision (ถ้ามี)"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">จำนวนที่รับเข้า *</label>
                          <input
                            type="number"
                            value={part.receivedQty}
                            onChange={(e) => {
                              const newParts = [...bulkFormData.parts];
                              newParts[index].receivedQty = Number(e.target.value);
                              setBulkFormData(prev => ({ ...prev, parts: newParts }));
                            }}
                            min="1"
                            className="w-full px-3 py-2 bg-slate-600/60 border border-slate-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                            placeholder="0"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ปุ่มควบคุม */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkFormOpen(false);
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  ❌ ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  💾 บันทึกทั้งหมด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ตารางแสดงรายการรับเข้า */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm flex receiving-table-container overflow-hidden border border-white/20">
        <div className="flex-1 min-w-0">
          <div className="p-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white">รายการการรับเข้าทั้งหมด</h3>
          </div>
          <div className="overflow-hidden">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-white/5">
                <tr>
                  {isDeleteMode && (
                    <th className="px-3 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-16">
                      เลือก
                    </th>
                  )}
                  <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-20">MYOB</th>
                  <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-24">MODEL</th>
                  <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-32">PART NUMBER</th>
                  <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-40">PART NAME</th>
                  <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider w-20">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(() => {
                const balanceMap = getBalanceMap(stockItems);
                const receivedItems = filteredItems.filter(item => item.receivedQty > 0);
                // แสดงรายการที่รับเข้าทั้งหมด ไม่ว่า balance จะเป็นเท่าไหร่
                const inStockReceivedItems = receivedItems;
                
                // แยกรายการกัน ไม่รวมเป็นกลุ่ม
                const sortedItems = inStockReceivedItems
                  .slice()
                  .sort((a, b) => {
                    // เรียงตาม MYOB ก่อน แล้วค่อยตาม Part Number
                    if (a.myobNumber !== b.myobNumber) {
                      return a.myobNumber.localeCompare(b.myobNumber, 'en', { numeric: true, sensitivity: 'base' });
                    }
                    return a.partNumber.localeCompare(b.partNumber, 'en', { numeric: true, sensitivity: 'base' });
                  });

                const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
                const startIndex = (currentPage - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const currentItems = sortedItems.slice(startIndex, endIndex);

                // สร้าง empty rows เพื่อให้ตารางมีความสูงคงที่
                const emptyRowsCount = Math.max(0, itemsPerPage - currentItems.length);
                const emptyRows = Array(emptyRowsCount).fill(null);

                return [
                  ...currentItems.map((item, index) => {
                    
                    // สร้างสีที่แตกต่างกันสำหรับแต่ละ part
                    const partKey = `${item.myobNumber}-${item.partNumber}`;
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
                    const colorIndex = Math.abs(partKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % partColors.length;
                    const partColor = partColors[colorIndex];
                    
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        {isDeleteMode && (
                          <td className="px-3 py-4 whitespace-nowrap text-center w-16">
                            <input
                              type="checkbox"
                              checked={selectedDeleteIds.includes(item.id)}
                              onChange={() => {
                                setSelectedDeleteIds((prev: string[]) => {
                                  if (prev.includes(item.id)) {
                                    return prev.filter((id: string) => id !== item.id);
                                  }
                                  return [...prev, item.id];
                                });
                              }}
                              className="h-4 w-4 text-red-600 border-gray-300 rounded"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-center w-20">
                          <div className={`truncate ${partColor}`}>{item.myobNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xl text-center w-24">
                          <span className={`inline-flex items-center justify-center w-44 px-3 py-1 rounded-full text-base font-bold border-2 ${partColor} ${partColor.replace('text-', 'bg-')}/10 ${partColor.replace('text-', 'border-')}/50`}>
                            {item.model || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-center w-32">
                          <div className="truncate text-white" title={item.partNumber}>
                            {item.partNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-center w-40">
                          <div className="truncate text-white" title={item.partName}>
                            {item.partName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center w-20">
                          <div className="flex space-x-1 justify-center">
                            <button
                              onClick={() => {
                                setDetailGroupKey(getGroupKey(item));
                                setIsDetailOpen(true);
                              }}
                              className="text-yellow-300 hover:text-yellow-200 transition-colors text-2xl"
                              title="ดูรายละเอียด"
                            >
                              🔍
                            </button>
                            {(() => {
                              const createdDate = new Date(item.createdAt);
                              const currentDate = new Date();
                              const daysDiff = Math.floor((currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (daysDiff <= 2) {
                                return (
                                  <>
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 px-1 py-1 rounded transition-colors"
                                      title="แก้ไข"
                                    >
                                      ✏️
                                    </button>
                                  </>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  }),
                  ...emptyRows.map((_, index) => (
                    <tr key={`empty-${index}`} className="h-16">
                      {isDeleteMode && <td className="px-4 py-4">&nbsp;</td>}
                      <td className="px-4 py-4">&nbsp;</td>
                      <td className="px-4 py-4">&nbsp;</td>
                      <td className="px-4 py-4">&nbsp;</td>
                      <td className="px-4 py-4">&nbsp;</td>
                      <td className="px-4 py-4">&nbsp;</td>
                    </tr>
                  ))
                ];
                })()}
              </tbody>
          </table>
        </div>
      </div>


      </div>
      </div>
    </div>
  );
}
