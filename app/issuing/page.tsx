'use client';

import { useState, useEffect } from 'react';
import { StockItem } from '@/types/stock';

interface IssuingFormData {
  stockItemId: string;
  issuedQty: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  event?: string;
  supplier?: string;
  customer?: string;
  withdrawalNumber?: string; // เลขใบเบิก
  remarks?: string;
  isNGItem?: boolean; // เพิ่มฟิลด์สำหรับระบุว่าเป็นงาน NG หรือไม่
  ngProblem?: string; // ปัญหาของชิ้นงาน (สำหรับ NG)
}

interface BulkIssuingPartData {
  stockItemId: string;
  issuedQty: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  event?: string;
  supplier?: string;
  customer?: string;
  withdrawalNumber?: string;
  remarks?: string;
  isNGItem?: boolean; // เพิ่มฟิลด์สำหรับระบุว่าเป็นงาน NG หรือไม่
  ngProblem?: string; // ปัญหาของชิ้นงาน (สำหรับ NG)
}

interface BulkIssuingFormData {
  parts: BulkIssuingPartData[];
}

export default function IssuingPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [availableItems, setAvailableItems] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [bulkSharedInvoice, setBulkSharedInvoice] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedDeleteKeys, setSelectedDeleteKeys] = useState<string[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailGroupKey, setDetailGroupKey] = useState<string | null>(null);
  const [allowEditOlder, setAllowEditOlder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 13;

  const isEditAllowed = (item: StockItem) => {
    if (!item.issueDate) return false;
    const issueTime = new Date(item.issueDate).getTime();
    if (Number.isNaN(issueTime)) return false;
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    return Date.now() - issueTime <= twoDaysMs;
  };

  const normalizeGroupToken = (value?: string) =>
    (value || '')
      .toString()
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[\u2010-\u2015\u2212]/g, '-')
      .replace(/\s+/g, '')
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, '');
  const getGroupKey = (item: StockItem) => `${normalizeGroupToken(item.myobNumber)}||${normalizeGroupToken(item.partNumber)}`;
  const sortStockItems = (items: StockItem[]) =>
    [...items].sort((a, b) => {
      const myobCompare = a.myobNumber.localeCompare(b.myobNumber, 'en', { numeric: true, sensitivity: 'base' });
      if (myobCompare !== 0) return myobCompare;
      const partCompare = a.partNumber.localeCompare(b.partNumber, 'en', { numeric: true, sensitivity: 'base' });
      if (partCompare !== 0) return partCompare;
      return a.model.localeCompare(b.model, 'en', { numeric: true, sensitivity: 'base' });
    });

  const renderRemarksLines = (remarks?: string) => {
    const parts = (remarks || '')
      .split(/\s*\/\s*|\n|\r/)
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return <span className="text-gray-400">-</span>;
    }

    return (
      <div className="space-y-1">
        {parts.map((part, index) => (
          <div key={`${part}-${index}`}>{part}</div>
        ))}
      </div>
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedDeleteKeys.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการลบ');
      return;
    }

    const itemsToDelete = stockItems.filter(item =>
      selectedDeleteKeys.includes(getGroupKey(item)) &&
      item.issuedQty && item.issuedQty > 0
    );
    for (const item of itemsToDelete) {
      await handleDeleteItem(item);
    }
    setSelectedDeleteKeys([]);
    setIsDeleteMode(false);
  };

  const handleEditSelected = () => {
    if (selectedDeleteKeys.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการแก้ไข');
      return;
    }
    if (selectedDeleteKeys.length > 1) {
      alert('กรุณาเลือกเพียง 1 รายการเพื่อแก้ไข');
      return;
    }

    const targetKey = selectedDeleteKeys[0];
    const groupItems = stockItems
      .filter(item => getGroupKey(item) === targetKey && item.issuedQty && item.issuedQty > 0)
      .sort((a, b) => new Date(b.issueDate || b.createdAt).getTime() - new Date(a.issueDate || a.createdAt).getTime());
    const representative = groupItems[0];

    if (!representative) {
      alert('ไม่พบรายการที่เลือก');
      return;
    }
    if (!isEditAllowed(representative) && !allowEditOlder) {
      alert('รายการนี้เกินเวลาแก้ไข (2 วัน)');
      return;
    }
    handleEditIssue(representative);
  };

  const toggleDeleteSelection = (groupKey: string) => {
    setSelectedDeleteKeys(prev =>
      prev.includes(groupKey) ? prev.filter(key => key !== groupKey) : [...prev, groupKey]
    );
  };

  const detailGroupItems = detailGroupKey
    ? stockItems.filter(item => getGroupKey(item) === detailGroupKey)
    : [];

  // Handle mouse wheel scrolling
  useEffect(() => {
    const handleWheel = (event: Event) => {
      const wheelEvent = event as WheelEvent;
      const issuedItems = filteredItems.filter(item => item.issuedQty && item.issuedQty > 0);
      const groupedMap = new Map<string, StockItem[]>();
      issuedItems.forEach(item => {
        const key = getGroupKey(item);
        const group = groupedMap.get(key) || [];
        group.push(item);
        groupedMap.set(key, group);
      });
      const totalPages = Math.ceil(groupedMap.size / itemsPerPage);
      
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

    const tableContainer = document.querySelector('.issuing-table-container');
    if (tableContainer) {
      tableContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => tableContainer.removeEventListener('wheel', handleWheel);
    }
  }, [filteredItems, itemsPerPage]);


  const [formData, setFormData] = useState<IssuingFormData>({
    stockItemId: '',
    issuedQty: 0,
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    event: '',
    supplier: '',
    customer: '',
    withdrawalNumber: '',
    remarks: '',
    isNGItem: false,
    ngProblem: '',
  });

  const [bulkFormData, setBulkFormData] = useState<BulkIssuingFormData>({
    parts: [
      {
        stockItemId: '',
        issuedQty: 0,
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        event: '',
        supplier: '',
        customer: '',
        withdrawalNumber: '',
        remarks: '',
        isNGItem: false,
        ngProblem: '',
      }
    ]
  });

  const fetchStockItems = async () => {
    try {
      const response = await fetch('/api/stock');
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let message = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้';
        try {
          const parsed = JSON.parse(text) as { error?: string; details?: string };
          message = parsed?.details ? `${parsed.error || 'Error'}: ${parsed.details}` : parsed?.error || message;
        } catch {
          message = text || message;
        }
        alert(message);
        setStockItems([]);
        setFilteredItems([]);
        setAvailableItems([]);
        return;
      }

      const data = await response.json();
      setStockItems(data);
      setFilteredItems(data);

      const getBalanceForData = (item: StockItem, items: StockItem[]) => {
        const targetKey = getGroupKey(item);
        const sameItemGroup = items.filter(stock => getGroupKey(stock) === targetKey);

        const totalReceived = sameItemGroup
          .filter(stock => stock.receivedQty > 0)
          .reduce((sum, stock) => sum + stock.receivedQty, 0);

        const totalIssued = sameItemGroup
          .filter(stock => stock.issuedQty && stock.issuedQty > 0)
          .reduce((sum, stock) => sum + (stock.issuedQty || 0), 0);

        return totalReceived - totalIssued;
      };

      // กรองเฉพาะรายการรับเข้า (receivedQty > 0) และมีสต็อกคงเหลือรวมมากกว่า 0 (รวม part เดียวกัน)
      const availableMap = new Map<string, { item: StockItem; models: Set<string> }>();
      data.forEach((item: StockItem) => {
        if (item.receivedQty > 0 && getBalanceForData(item, data) > 0) {
          const key = getGroupKey(item);
          const existing = availableMap.get(key);
          if (existing) {
            if (item.model) existing.models.add(item.model);
          } else {
            availableMap.set(key, { item, models: new Set(item.model ? [item.model] : []) });
          }
        }
      });

      const availableItemsGrouped = Array.from(availableMap.values()).map(({ item, models }) => {
        const modelsText = Array.from(models)
          .map(model => (model || '').trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }))
          .join(', ');
        return {
          ...item,
          model: modelsText || item.model,
        };
      });

      setAvailableItems(sortStockItems(availableItemsGrouped));
    } catch (error) {
      console.error('Error fetching stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeSearchText = (value?: string) =>
    (value || '').toString().toLowerCase().replace(/[\s-]+/g, '');

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
          normalizeSearchText(item.poNumber).includes(search) ||
          normalizeSearchText(item.invoiceNumber).includes(search) ||
          normalizeSearchText(item.customer).includes(search) ||
          normalizeSearchText(item.supplier).includes(search) ||
          normalizeSearchText(item.event).includes(search) ||
          normalizeSearchText(item.withdrawalNumber).includes(search)
        );
      });
      setFilteredItems(filtered);
    }
  }, [searchTerm, stockItems]);

  useEffect(() => {
    fetchStockItems();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'stockItemId') {
      const item = availableItems.find(item => item.id === value);
      setSelectedItem(item || null);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'issuedQty' ? Number(value) : value,
    }));
  };

  const sortedAvailableItems = sortStockItems(availableItems);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      alert('กรุณาเลือกสินค้าที่ต้องการจ่ายออก');
      return;
    }

    // คำนวณสต็อกคงเหลือรวมของ MYOB + Part Number เดียวกัน
    const selectedKey = getGroupKey(selectedItem);
    const sameItemGroupForCheck = stockItems.filter(item =>
      getGroupKey(item) === selectedKey &&
      (item.receivedQty - (item.issuedQty || 0)) > 0
    );
    
    const totalAvailableQty = sameItemGroupForCheck.reduce((sum, item) => 
      sum + (item.receivedQty - (item.issuedQty || 0)), 0
    );

    if (formData.issuedQty > totalAvailableQty) {
      alert(`จำนวนที่จ่ายออกเกินสต็อกคงเหลือรวม (คงเหลือรวม: ${totalAvailableQty})`);
      return;
    }

    try {
      // หา MYOB + Part Number เดียวกันที่มีสต็อกคงเหลือ (FIFO - First In First Out)
      const sameItemGroup = stockItems
        .filter(item =>
          getGroupKey(item) === selectedKey &&
          (item.receivedQty - (item.issuedQty || 0)) > 0
        )
        .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

      let remainingQtyToIssue = formData.issuedQty;
      const updatePromises = [];

      // ตัดสต็อกจาก MYOB + Part Number เดียวกันตามลำดับ FIFO
      for (const item of sameItemGroup) {
        if (remainingQtyToIssue <= 0) break;

        const availableInThisItem = item.receivedQty - (item.issuedQty || 0);
        const qtyToIssueFromThisItem = Math.min(remainingQtyToIssue, availableInThisItem);

        if (qtyToIssueFromThisItem > 0) {
          // สร้างรายการจ่ายออกสำหรับ item นี้
          const issueRecord = {
            myobNumber: item.myobNumber,
            model: item.model,
            partName: item.partName,
            partNumber: item.partNumber,
            revision: item.revision,
            poNumber: item.poNumber,
            receivedQty: 0, // รายการจ่ายออก
            receivedDate: item.receivedDate,
            supplier: formData.supplier || item.supplier,
            issuedQty: qtyToIssueFromThisItem,
            invoiceNumber: formData.invoiceNumber,
            issueDate: formData.issueDate,
            dueDate: formData.dueDate || undefined,
            customer: formData.customer || '',
            event: formData.event || item.event,
            withdrawalNumber: formData.withdrawalNumber || '',
            remarks: formData.remarks || item.remarks,
            isNGItem: formData.isNGItem || false,
            ngProblem: formData.ngProblem || '',
          };

          // สร้างรายการจ่ายออกใหม่
          const createPromise = fetch('/api/stock', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(issueRecord),
          });

          updatePromises.push(createPromise);

          // ถ้าเป็นงาน NG ให้บันทึกไปหน้า NG ด้วย
          if (formData.isNGItem) {
            const ngRecord = {
              myobNumber: item.myobNumber,
              model: item.model,
              partName: item.partName,
              partNumber: item.partNumber,
              revision: item.revision || '',
              poNumber: item.poNumber || '',
              receivedDate: item.receivedDate,
              supplier: formData.supplier || item.supplier,
              issuedQty: qtyToIssueFromThisItem,
              invoiceNumber: formData.invoiceNumber || '',
              issueDate: formData.issueDate,
              customer: formData.customer || '',
              event: formData.event || item.event || '',
              withdrawalNumber: formData.withdrawalNumber || '',
              ngProblem: formData.ngProblem || '',
              remarks: formData.remarks || '',
            };

            // บันทึกไปหน้า NG
            const ngPromise = fetch('/api/ng-items', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(ngRecord),
            });

            updatePromises.push(ngPromise);
          }
          remainingQtyToIssue -= qtyToIssueFromThisItem;
        }
      }

      // รอให้ทุก API call เสร็จ
      const responses = await Promise.all(updatePromises);
      const allSuccess = responses.every((response: Response) => response.ok);

      if (allSuccess) {
        const successMessage = formData.isNGItem 
          ? 'ตัดสต็อกและบันทึกการจ่ายออกสำเร็จ! ข้อมูลงาน NG ถูกบันทึกไปหน้า NG อัตโนมัติแล้ว'
          : 'ตัดสต็อกและบันทึกการจ่ายออกสำเร็จ!';
        
        console.log(successMessage);
        alert(successMessage);
        
        setIsFormOpen(false);
        setSelectedItem(null);
        setFormData({
          stockItemId: '',
          issuedQty: 0,
          invoiceNumber: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          event: '',
          supplier: '',
          customer: '',
          withdrawalNumber: '',
          remarks: '',
          isNGItem: false,
          ngProblem: '',
        });
        fetchStockItems();
      } else {
        console.error('บางรายการไม่สามารถบันทึกได้');
        alert('เกิดข้อผิดพลาดในการบันทึกบางรายการ');
      }
    } catch (error) {
      console.error('Error saving issuing data:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error);
    }
  };

  const handleEditIssue = (item: StockItem) => {
    setEditingItem(item);
    setSelectedItem(item);
    setFormData({
      stockItemId: item.id,
      issuedQty: item.issuedQty || 0,
      invoiceNumber: item.invoiceNumber || '',
      issueDate: item.issueDate ? new Date(item.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
      event: item.event || '',
      supplier: item.supplier || '',
      customer: item.customer || '',
      withdrawalNumber: item.withdrawalNumber || '',
      remarks: item.remarks || '',
      isNGItem: (item as any).isNGItem || false,
      ngProblem: (item as any).ngProblem || '',
    });
    setIsFormOpen(true);
  };

  const handleUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem || formData.issuedQty <= 0) {
      alert('กรุณาระบุจำนวนที่จ่ายออก');
      return;
    }

    try {
      const response = await fetch(`/api/stock/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          stockItemId: editingItem.id,
        }),
      });

      if (response.ok) {
        await fetchStockItems();
        setIsFormOpen(false);
        setEditingItem(null);
        setSelectedItem(null);
        setFormData({
          stockItemId: '',
          issuedQty: 0,
          invoiceNumber: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          event: '',
          supplier: '',
          customer: '',
          withdrawalNumber: '',
          remarks: '',
        });
        alert('แก้ไขข้อมูลสำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || formData.issuedQty <= 0) {
      alert('กรุณาเลือก Part และระบุจำนวนที่จ่ายออก');
      return;
    }

    const availableQty = getBalance(selectedItem);
    if (formData.issuedQty > availableQty) {
      alert(`จำนวนที่จ่ายออกเกินจำนวนคงเหลือ (คงเหลือ: ${availableQty})`);
      return;
    }

    // ตรวจสอบข้อมูลซ้ำก่อนจ่ายออก
    const normalizedInvoice = (formData.invoiceNumber || '').toLowerCase().trim();
    const normalizedPartName = selectedItem.partName.toLowerCase().trim();
    const normalizedPartNumber = selectedItem.partNumber.toLowerCase().trim();
    const issuedQty = formData.issuedQty;

    const duplicates = stockItems.filter(item => {
      if (!item.issuedQty || item.issuedQty <= 0) return false;
      
      const itemInvoice = (item.invoiceNumber || '').toLowerCase().trim();
      const itemPartName = item.partName.toLowerCase().trim();
      const itemPartNumber = item.partNumber.toLowerCase().trim();
      const itemQty = item.issuedQty;

      // ตรวจสอบว่ามีข้อมูลซ้ำกัน (invoice + part name + part number + จำนวน)
      return (
        itemInvoice === normalizedInvoice &&
        itemPartName === normalizedPartName &&
        itemPartNumber === normalizedPartNumber &&
        itemQty === issuedQty
      );
    });

    if (duplicates.length > 0) {
      const duplicateInfo = duplicates.map(item => 
        `MYOB: ${item.myobNumber}, Part: ${item.partNumber}, จำนวน: ${item.issuedQty}, วันที่: ${new Date(item.issueDate || item.createdAt).toLocaleDateString('th-TH')}`
      ).join('\n');
      
      const confirmMessage = `พบข้อมูลจ่ายออกซ้ำ ${duplicates.length} รายการ:\n\n${duplicateInfo}\n\nต้องการจ่ายออกซ้ำหรือไม่?`;
      const confirmed = confirm(confirmMessage);
      
      if (!confirmed) {
        return;
      }
    }

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `/api/stock/${editingItem.id}` : '/api/stock';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          stockItemId: selectedItem.id,
        }),
      });

      if (response.ok) {
        await fetchStockItems();
        setIsFormOpen(false);
        setSelectedItem(null);
        setFormData({
          stockItemId: '',
          issuedQty: 0,
          invoiceNumber: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          event: '',
          supplier: '',
          customer: '',
          withdrawalNumber: '',
          remarks: '',
        });
        alert(editingItem ? 'แก้ไขข้อมูลสำเร็จ' : 'บันทึกข้อมูลสำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const addBulkPart = () => {
    setBulkFormData(prev => ({
      ...prev,
      parts: [...prev.parts, {
        stockItemId: '',
        issuedQty: 0,
        invoiceNumber: bulkSharedInvoice,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        event: '',
        supplier: '',
        customer: '',
        withdrawalNumber: '',
        remarks: '',
        isNGItem: false,
        ngProblem: '',
      }]
    }));
  };

  const removeBulkPart = (index: number) => {
    if (bulkFormData.parts.length > 1) {
      setBulkFormData(prev => ({
        ...prev,
        parts: prev.parts.filter((_, i) => i !== index)
      }));
    }
  };

  const updateBulkPart = (
    index: number,
    field: keyof BulkIssuingPartData,
    value: string | number | boolean
  ) => {
    setBulkFormData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all parts
    for (let i = 0; i < bulkFormData.parts.length; i++) {
      const part = bulkFormData.parts[i];
      if (!part.stockItemId || part.issuedQty <= 0) {
        alert(`กรุณาเลือก Part และระบุจำนวนที่จ่ายออกสำหรับรายการที่ ${i + 1}`);
        return;
      }

      if (!part.isNGItem && !part.invoiceNumber) {
        alert(`กรุณาระบุเลขที่ใบเบิก/Invoice สำหรับรายการที่ ${i + 1}`);
        return;
      }

      if (part.isNGItem && !(part.ngProblem || '').trim()) {
        alert(`กรุณาระบุปัญหาของชิ้นงาน (NG) สำหรับรายการที่ ${i + 1}`);
        return;
      }

      const stockItem = availableItems.find(item => item.id === part.stockItemId);
      if (!stockItem) {
        alert(`ไม่พบข้อมูล Part สำหรับรายการที่ ${i + 1}`);
        return;
      }

      const availableQty = getBalance(stockItem);
      if (part.issuedQty > availableQty) {
        alert(`จำนวนที่จ่ายออกเกินจำนวนคงเหลือสำหรับรายการที่ ${i + 1} (คงเหลือ: ${availableQty})`);
        return;
      }
    }

    try {
      const updatePromises: Promise<Response>[] = [];

      for (const part of bulkFormData.parts) {
        const baseItem = stockItems.find(item => item.id === part.stockItemId);
        if (!baseItem) {
          throw new Error('ไม่พบข้อมูล Part');
        }

        const sameItemGroup = stockItems
          .filter(item =>
            getGroupKey(item) === getGroupKey(baseItem) &&
            (item.receivedQty - (item.issuedQty || 0)) > 0
          )
          .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

        let remainingQtyToIssue = part.issuedQty;

        for (const item of sameItemGroup) {
          if (remainingQtyToIssue <= 0) break;

          const availableInThisItem = item.receivedQty - (item.issuedQty || 0);
          const qtyToIssueFromThisItem = Math.min(remainingQtyToIssue, availableInThisItem);

          if (qtyToIssueFromThisItem > 0) {
            const issueRecord = {
              myobNumber: item.myobNumber,
              model: item.model,
              partName: item.partName,
              partNumber: item.partNumber,
              revision: item.revision,
              poNumber: item.poNumber,
              receivedQty: 0,
              receivedDate: item.receivedDate,
              supplier: part.supplier || baseItem.supplier,
              issuedQty: qtyToIssueFromThisItem,
              invoiceNumber: part.invoiceNumber,
              issueDate: part.issueDate,
              dueDate: part.dueDate || undefined,
              customer: part.customer || '',
              event: part.event || item.event,
              withdrawalNumber: part.withdrawalNumber || '',
              remarks: part.remarks || item.remarks,
              isNGItem: part.isNGItem || false,
              ngProblem: part.ngProblem || '',
            };

            updatePromises.push(
              fetch('/api/stock', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(issueRecord),
              })
            );

            if (part.isNGItem) {
              const ngRecord = {
                myobNumber: item.myobNumber,
                model: item.model,
                partName: item.partName,
                partNumber: item.partNumber,
                revision: item.revision || '',
                poNumber: item.poNumber || '',
                receivedDate: item.receivedDate,
                supplier: part.supplier || baseItem.supplier || '',
                issuedQty: qtyToIssueFromThisItem,
                invoiceNumber: part.invoiceNumber || '',
                issueDate: part.issueDate,
                customer: part.customer || '',
                event: part.event || item.event || '',
                withdrawalNumber: part.withdrawalNumber || '',
                ngProblem: part.ngProblem || '',
                remarks: part.remarks || '',
              };

              updatePromises.push(
                fetch('/api/ng-items', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(ngRecord),
                })
              );
            }

            remainingQtyToIssue -= qtyToIssueFromThisItem;
          }
        }

        if (remainingQtyToIssue > 0) {
          throw new Error('งานคงเหลือไม่พอ');
        }
      }

      const responses = await Promise.all(updatePromises);
      const allSuccess = responses.every(response => response.ok);

      if (!allSuccess) {
        throw new Error('Failed to save parts');
      }

      await fetchStockItems();
      setIsBulkFormOpen(false);
      setBulkFormData({
        parts: [{
          stockItemId: '',
          issuedQty: 0,
          invoiceNumber: '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: '',
          event: '',
          supplier: '',
          customer: '',
          withdrawalNumber: '',
          remarks: '',
          isNGItem: false,
          ngProblem: '',
        }]
      });
      alert('บันทึกข้อมูลการจ่ายออกหลาย Part สำเร็จ');
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDeleteItem = async (item: StockItem) => {
    const isIssueRecord = item.receivedQty === 0 && item.issuedQty && item.issuedQty > 0;
    const isReceiveRecord = item.receivedQty > 0;

    let confirmMessage = '';
    if (isIssueRecord) {
      confirmMessage = `ต้องการลบรายการจ่ายออกนี้หรือไม่?\n\n` +
        `Part: ${item.partName}\n` +
        `จำนวนจ่าย: ${item.issuedQty}\n` +
        `Invoice: ${item.invoiceNumber}\n\n` +
        `การลบจะลบรายการนี้และคืนยอดไปยังรายการรับเข้า`;
    } else if (isReceiveRecord) {
      const hasIssuedQty = item.issuedQty && item.issuedQty > 0;
      confirmMessage = `ต้องการลบรายการรับเข้านี้หรือไม่?\n\n` +
        `Part: ${item.partName}\n` +
        `จำนวนรับเข้า: ${item.receivedQty}\n` +
        `จำนวนจ่ายออกแล้ว: ${item.issuedQty || 0}\n` +
        `PO Number: ${item.poNumber}\n\n` +
        (hasIssuedQty ? 
          `⚠️ รายการนี้มีการจ่ายออกแล้ว ${item.issuedQty} ชิ้น\nการลบจะลบรายการจ่ายออกที่เกี่ยวข้องด้วย` :
          `การลบจะลบรายการนี้ออกจากระบบ`);
    } else {
      confirmMessage = `ต้องการลบรายการนี้หรือไม่?\n\nPart: ${item.partName}`;
    }

    const confirmDelete = confirm(confirmMessage);
    if (!confirmDelete) return;

    try {
      if (isIssueRecord) {
        // ลบรายการจ่ายออก - ลบรายการแต่คืนยอดไปรายการรับเข้า
        const targetKey = getGroupKey(item);
        const originalItems = stockItems
          .filter(originalItem =>
            getGroupKey(originalItem) === targetKey &&
            originalItem.receivedQty > 0 &&
            originalItem.id !== item.id
          )
          .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

        if (originalItems.length === 0) {
          // ถ้าไม่มีรายการรับเข้า ก็ลบได้เลย
          const response = await fetch(`/api/stock/${item.id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            alert('ลบรายการจ่ายออกสำเร็จ!');
            fetchStockItems();
          } else {
            alert('เกิดข้อผิดพลาดในการลบรายการจ่ายออก');
          }
          return;
        }

        // คืนยอดไปยังรายการรับเข้า (FIFO)
        let remainingQtyToReturn = item.issuedQty || 0;
        const updatePromises = [];

        for (const originalItem of originalItems) {
          if (remainingQtyToReturn <= 0) break;

          const currentIssuedQty = originalItem.issuedQty || 0;
          const qtyToReturnToThisItem = Math.min(remainingQtyToReturn, currentIssuedQty);

          if (qtyToReturnToThisItem > 0) {
            const updatePromise = fetch(`/api/stock/${originalItem.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...originalItem,
                issuedQty: currentIssuedQty - qtyToReturnToThisItem,
              }),
            });

            updatePromises.push(updatePromise);
            remainingQtyToReturn -= qtyToReturnToThisItem;
          }
        }

        // ลบรายการจ่ายออก
        const deletePromise = fetch(`/api/stock/${item.id}`, {
          method: 'DELETE',
        });

        updatePromises.push(deletePromise);

        // รอให้ทุก API call เสร็จ
        const responses = await Promise.all(updatePromises);
        const allSuccess = responses.every(response => response.ok);

        if (allSuccess) {
          alert('ลบรายการจ่ายออกและคืนยอดสำเร็จ!');
          fetchStockItems();
        } else {
          alert('เกิดข้อผิดพลาดในการลบรายการ');
        }

      } else if (isReceiveRecord) {
        // ลบรายการรับเข้า - ต้องลบรายการจ่ายออกที่เกี่ยวข้องด้วย
        const targetKey = getGroupKey(item);
        const relatedIssueRecords = stockItems.filter(relatedItem =>
          getGroupKey(relatedItem) === targetKey &&
          relatedItem.receivedQty === 0 &&
          relatedItem.issuedQty && relatedItem.issuedQty > 0 &&
          relatedItem.id !== item.id
        );

        const deletePromises = [];

        // ลบรายการจ่ายออกที่เกี่ยวข้อง
        for (const issueRecord of relatedIssueRecords) {
          const deleteIssuePromise = fetch(`/api/stock/${issueRecord.id}`, {
            method: 'DELETE',
          });
          deletePromises.push(deleteIssuePromise);
        }

        // ลบรายการรับเข้าหลัก
        const deleteMainPromise = fetch(`/api/stock/${item.id}`, {
          method: 'DELETE',
        });
        deletePromises.push(deleteMainPromise);

        // รอให้ทุก API call เสร็จ
        const responses = await Promise.all(deletePromises);
        const allSuccess = responses.every(response => response.ok);

        if (allSuccess) {
          const deletedCount = relatedIssueRecords.length + 1;
          alert(`ลบรายการสำเร็จ! (ลบทั้งหมด ${deletedCount} รายการ)`);
          fetchStockItems();
        } else {
          alert('เกิดข้อผิดพลาดในการลบรายการ');
        }

      } else {
        // ลบรายการอื่นๆ
        const response = await fetch(`/api/stock/${item.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('ลบรายการสำเร็จ!');
          fetchStockItems();
        } else {
          alert('เกิดข้อผิดพลาดในการลบรายการ');
        }
      }

    } catch (error) {
      console.error('Error deleting item:', error);
      alert('เกิดข้อผิดพลาดในการลบ: ' + error);
    }
  };

  const getBalance = (item: StockItem) => {
    // คำนวณยอดคงเหลือจากสต็อกของ MYOB + Part Number เดียวกัน (แยกกัน)
    const targetKey = getGroupKey(item);
    const sameItemGroup = stockItems.filter(stock => getGroupKey(stock) === targetKey);
    
    const totalReceived = sameItemGroup
      .filter(stock => stock.receivedQty > 0)
      .reduce((sum, stock) => sum + stock.receivedQty, 0);
    
    const totalIssued = sameItemGroup
      .filter(stock => stock.issuedQty && stock.issuedQty > 0)
      .reduce((sum, stock) => sum + (stock.issuedQty || 0), 0);
    
    return totalReceived - totalIssued;
  };

  const getBalanceColor = (balance: number) => {
    if (balance <= 0) return 'text-red-600 bg-red-50';
    if (balance <= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gray-800/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gray-700/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gray-900/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-8 py-4 sm:py-8 relative z-10 max-w-[95%]">
        {/* Header with Back Button */}
        <div className="mb-6 sm:mb-8 relative">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
            📤 ISSUING
            <div className="text-lg sm:text-2xl font-normal text-white/70 mt-2">
              (จ่ายงานออก)
            </div>
          </h1>
          
          {/* Back Button - responsive positioning */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 sm:px-12 py-2 sm:py-6 rounded-lg text-sm sm:text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({
                stockItemId: '',
                issuedQty: 0,
                invoiceNumber: '',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: '',
                event: '',
                supplier: '',
                customer: '',
                withdrawalNumber: '',
                remarks: '',
              });
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
          >
            📝 บันทึกการจ่ายออกใหม่
          </button>
          <button
            onClick={() => {
              setIsBulkFormOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
          >
            📦 บันทึกการจ่ายออกหลาย Part
          </button>
          <button
            onClick={() => {
              setIsDeleteMode(prev => !prev);
              setSelectedDeleteKeys([]);
            }}
            className={`${
              isDeleteMode 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            } px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto`}
          >
            {isDeleteMode ? '✕ ยกเลิก' : '🗑️ ลบ'}
          </button>
          <button
            type="button"
            onClick={() => setAllowEditOlder(prev => !prev)}
            className={`${
              allowEditOlder ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-white/10 hover:bg-white/20'
            } text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto border border-white/30`}
          >
            🔓 แก้ไขเกิน 2 วัน: {allowEditOlder ? 'ON' : 'OFF'}
          </button>
          {isDeleteMode && (
            <button
              onClick={handleEditSelected}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
            >
              ✏️ แก้ไขที่เลือก ({selectedDeleteKeys.length})
            </button>
          )}
          {isDeleteMode && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base w-full sm:w-auto"
            >
              🗑️ ลบที่เลือก ({selectedDeleteKeys.length})
            </button>
          )}
        </div>

      {/* Search Box */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="ค้นหา MYOB, Model, Part Name, Part Number, PO Number, Invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-white/70">
            พบ {filteredItems.length} รายการจากทั้งหมด {stockItems.length} รายการ
          </p>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {editingItem ? '✏️ แก้ไขข้อมูลการจ่ายออก' : '📤 บันทึกการจ่ายออกใหม่'}
            </h2>
            
            <form onSubmit={editingItem ? handleUpdateIssue : handleIssueSubmit} className="space-y-6">
              {/* เลือกสินค้า */}
              {!editingItem && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 เลือกสินค้า</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สินค้าที่มีสต็อกคงเหลือ *</label>
                    <select
                      name="stockItemId"
                      value={formData.stockItemId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">-- เลือกสินค้า --</option>
                      {sortedAvailableItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.myobNumber} - {item.partName} (คงเหลือ: {getBalance(item)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedItem && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">ข้อมูลสินค้าที่เลือก:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Model:</strong> {selectedItem.model}</div>
                        <div><strong>Part Number:</strong> {selectedItem.partNumber}</div>
                        <div><strong>รับเข้า:</strong> {(() => {
                          const sameItemGroup = stockItems.filter(stock => 
                            stock.myobNumber === selectedItem.myobNumber &&
                            stock.partNumber === selectedItem.partNumber && 
                            stock.receivedQty > 0
                          );
                          return sameItemGroup.reduce((sum, stock) => sum + stock.receivedQty, 0);
                        })()}</div>
                        <div><strong>จ่ายออกแล้ว:</strong> {(() => {
                          const sameItemGroup = stockItems.filter(stock => 
                            stock.myobNumber === selectedItem.myobNumber &&
                            stock.partNumber === selectedItem.partNumber && 
                            stock.issuedQty && stock.issuedQty > 0
                          );
                          return sameItemGroup.reduce((sum, stock) => sum + (stock.issuedQty || 0), 0);
                        })()}</div>
                        <div className="col-span-2">
                          <strong>คงเหลือ:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getBalanceColor(getBalance(selectedItem))}`}>
                            {getBalance(selectedItem)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* แสดงรายการจ่ายออกและปุ่มลบรายการซ้ำ */}
                  {selectedItem && (() => {
                    const issuedItems = stockItems.filter(item => 
                      item.myobNumber === selectedItem.myobNumber &&
                      item.partNumber === selectedItem.partNumber && 
                      item.issuedQty && item.issuedQty > 0
                    ).sort((a, b) => new Date(b.issueDate || b.createdAt).getTime() - new Date(a.issueDate || a.createdAt).getTime());

                    if (issuedItems.length <= 1) return null;

                    return (
                      <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-orange-800 mb-2">
                          รายการจ่ายออก ({issuedItems.length} รายการ)
                        </h4>
                        <div className="text-xs text-orange-600 mb-3">
                          พบรายการจ่ายออกซ้ำ สามารถลบรายการเก่าเพื่อปรับสต๊อก
                        </div>
                        <button
                          onClick={async () => {
                            const confirmMessage = `ต้องการลบรายการจ่ายออกซ้ำทั้งหมด ${issuedItems.length - 1} รายการหรือไม่?\n(จะเหลือไว้เฉพาะรายการล่าสุด)\n\nสต๊อกจะเพิ่มจาก ${getBalance(selectedItem)} เป็น ${getBalance(selectedItem) + issuedItems.slice(1).reduce((sum, item) => sum + (item.issuedQty || 0), 0)}`;
                            if (confirm(confirmMessage)) {
                              // ลบรายการเก่าทั้งหมด เหลือไว้แค่รายการล่าสุด
                              const itemsToDelete = issuedItems.slice(1);
                              
                              try {
                                let deletedCount = 0;
                                for (const item of itemsToDelete) {
                                  const response = await fetch(`/api/stock/${item.id}`, { method: 'DELETE' });
                                  if (response.ok) {
                                    deletedCount++;
                                  }
                                }
                                
                                await fetchStockItems();
                                alert(`ลบรายการจ่ายออกซ้ำ ${deletedCount} รายการเรียบร้อยแล้ว`);
                              } catch (error) {
                                console.error('Error deleting items:', error);
                                alert('เกิดข้อผิดพลาดในการลบรายการ กรุณาลองใหม่');
                              }
                            }
                          }}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          🗑️ ลบรายการจ่ายออกซ้ำ ({issuedItems.length - 1} รายการ)
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ตัวเลือกประเภทงาน */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทงาน *</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isNGItem"
                      value="false"
                      checked={!formData.isNGItem}
                      onChange={(e) => setFormData({...formData, isNGItem: false, ngProblem: ''})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">งานตัดออกปกติ</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isNGItem"
                      value="true"
                      checked={formData.isNGItem === true}
                      onChange={(e) => setFormData({...formData, isNGItem: true})}
                      className="mr-2"
                    />
                    <span className="text-sm text-red-700 font-medium">งานตัดออกเป็นงาน NG</span>
                  </label>
                </div>
              </div>

              {/* ข้อมูลการจ่ายออก - แสดงเมื่อเลือกงานปกติ */}
              {!formData.isNGItem && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📤 ข้อมูลการจ่ายออก</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่จ่ายออก *</label>
                      <input
                        type="number"
                        name="issuedQty"
                        value={formData.issuedQty}
                        onChange={handleChange}
                        min="0"
                        max={selectedItem && !editingItem ? getBalance(selectedItem) : undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                      {selectedItem && !editingItem && (
                        <p className="text-xs text-gray-500 mt-1">สูงสุด: {getBalance(selectedItem)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เลข Invoice ออก *</label>
                      <input
                        type="text"
                        name="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันที่จ่ายออก *</label>
                      <input
                        type="date"
                        name="issueDate"
                        value={formData.issueDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due ที่ส่ง</label>
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                      <input
                        type="text"
                        name="event"
                        value={formData.event || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="ชื่อ Event หรือโครงการ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <input
                        type="text"
                        name="supplier"
                        value={formData.supplier || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="ชื่อผู้จำหน่าย/ซัพพลายเออร์"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                      <input
                        type="text"
                        name="customer"
                        value={formData.customer || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="ชื่อลูกค้า"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เลขใบเบิก</label>
                      <input
                        type="text"
                        name="withdrawalNumber"
                        value={formData.withdrawalNumber || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="หมายเลขใบเบิกสินค้า"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ข้อมูลงาน NG - แสดงเมื่อเลือกงาน NG */}
              {formData.isNGItem && (
                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium mr-3">
                      NG
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">🚫 ข้อมูลงาน NG</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เลข INVOICE (ถ้ามี)</label>
                      <input
                        type="text"
                        name="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="หมายเลข Invoice"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนชิ้นงาน *</label>
                      <input
                        type="number"
                        name="issuedQty"
                        value={formData.issuedQty}
                        onChange={handleChange}
                        min="0"
                        max={selectedItem && !editingItem ? getBalance(selectedItem) : undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                        placeholder="จำนวนชิ้น"
                      />
                      {selectedItem && !editingItem && (
                        <p className="text-xs text-gray-500 mt-1">สูงสุด: {getBalance(selectedItem)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันที่บันทึก *</label>
                      <input
                        type="date"
                        name="issueDate"
                        value={formData.issueDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <input
                        type="text"
                        name="supplier"
                        value={formData.supplier || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="ชื่อผู้จำหน่าย/ซัพพลายเออร์"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                      <input
                        type="text"
                        name="customer"
                        value={formData.customer || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="ชื่อลูกค้า"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-red-700 mb-1">ปัญหาของชิ้นงาน *</label>
                      <textarea
                        name="ngProblem"
                        value={formData.ngProblem || ''}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="อธิบายปัญหาที่พบในชิ้นงาน..."
                        required={formData.isNGItem}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* หมายเหตุ */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 หมายเหตุ</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="ใส่หมายเหตุเพิ่มเติม..."
                  />
                </div>
              </div>

              {/* ปุ่มควบคุม */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingItem(null);
                    setSelectedItem(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  ❌ ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  {editingItem ? '💾 อัปเดต' : '💾 บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ตารางแสดงรายการจ่ายออก */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm flex issuing-table-container overflow-hidden border border-white/20">
        <div className="flex-1 min-w-0">
          <div className="p-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white">รายการการจ่ายออกทั้งหมด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200" style={{minWidth: '1400px', tableLayout: 'fixed'}}>
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider" style={{width: '80px'}}>MYOB</th>
                  <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider" style={{width: '100px'}}>MODEL</th>
                  <th className="px-6 py-3 text-left text-lg font-medium text-white/70 uppercase tracking-wider" style={{width: '120px'}}>PART NUMBER</th>
                  <th className="px-6 py-3 text-left text-lg font-medium text-white/70 uppercase tracking-wider" style={{width: '160px'}}>PART NAME</th>
                  <th className="px-6 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider" style={{width: '120px'}}>CUSTOMER</th>
                  <th className="px-3 py-3 text-center text-sm text-white/70 uppercase tracking-wider" style={{width: '80px'}}>จัดการ</th>
                  {isDeleteMode && (
                    <th className="px-3 py-3 text-center text-lg font-medium text-white/70 uppercase tracking-wider" style={{width: '60px'}}>
                      เลือก
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(() => {
                  const issuedItems = filteredItems.filter(item => item.issuedQty && item.issuedQty > 0);
                  const groupedMap = new Map<string, StockItem[]>();
                  issuedItems.forEach(item => {
                    const key = getGroupKey(item);
                    const group = groupedMap.get(key) || [];
                    group.push(item);
                    groupedMap.set(key, group);
                  });

                  const groupedItems = Array.from(groupedMap.entries())
                    .map(([key, items]) => {
                      const totalIssued = items.reduce((sum, item) => sum + (item.issuedQty || 0), 0);
                      const totalReceived = stockItems
                        .filter(stock => getGroupKey(stock) === key && stock.receivedQty > 0)
                        .reduce((sum, stock) => sum + stock.receivedQty, 0);

                      const modelSet = new Set(
                        stockItems
                          .filter(stock => getGroupKey(stock) === key)
                          .map(stock => stock.model)
                          .filter(Boolean)
                      );
                      const modelsText = Array.from(modelSet)
                        .map(model => (model || '').trim())
                        .filter(Boolean)
                        .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }))
                        .join(', ');

                      const latestIssueItem = items
                        .slice()
                        .sort((a, b) => new Date(b.issueDate || b.createdAt).getTime() - new Date(a.issueDate || a.createdAt).getTime())[0];

                      return {
                        key,
                        items,
                        totalIssued,
                        totalReceived,
                        latestIssueItem,
                        modelsText,
                        latestIssueDate: latestIssueItem.issueDate || latestIssueItem.createdAt,
                      };
                    })
                    .sort((a, b) => {
                      if (a.latestIssueItem.myobNumber !== b.latestIssueItem.myobNumber) {
                        return a.latestIssueItem.myobNumber.localeCompare(b.latestIssueItem.myobNumber);
                      }
                      if (a.latestIssueItem.partNumber !== b.latestIssueItem.partNumber) {
                        return a.latestIssueItem.partNumber.localeCompare(b.latestIssueItem.partNumber);
                      }
                      return new Date(a.latestIssueDate).getTime() - new Date(b.latestIssueDate).getTime();
                    });

                  const totalItems = groupedItems.length;
                  const totalPages = Math.ceil(totalItems / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentItems = groupedItems.slice(startIndex, endIndex);

                  // สร้าง empty rows เพื่อให้ตารางมีความสูงคงที่
                  const emptyRowsCount = Math.max(0, itemsPerPage - currentItems.length);
                  const emptyRows = Array(emptyRowsCount).fill(null);

                  return [
                    ...currentItems.map((group, index) => {
                      const representative = group.latestIssueItem;
                      const partKey = group.key;
                      const isNewPart = index === 0 || partKey !== currentItems[index - 1].key;
                      const actualBalance = group.totalReceived - group.totalIssued;

                      const partColors = [
                        'text-green-400',
                        'text-blue-400',
                        'text-purple-400',
                        'text-yellow-400',
                        'text-teal-400',
                        'text-orange-400',
                        'text-cyan-400'
                      ];
                      const colorIndex = Math.abs(partKey.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % partColors.length;
                      const partColor = partColors[colorIndex];

                      return (
                        <tr key={`${partKey}-${index}`} className={`hover:bg-white/5 transition-colors ${isNewPart ? 'border-t-2 border-blue-400/50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-center" style={{width: '80px'}}>
                            <div className={`truncate ${partColor}`}>{representative.myobNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xl text-center" style={{width: '100px'}}>
                            <span className={`inline-flex items-center justify-center w-44 px-3 py-1 rounded-full text-base font-bold border-2 ${partColor} ${partColor.replace('text-', 'bg-')}/10 ${partColor.replace('text-', 'border-')}/50`}>
                              <span className="truncate" title={group.modelsText || representative.model}>
                                {group.modelsText || representative.model}
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-left" style={{width: '120px'}}>
                            <div className="truncate text-white" title={representative.partNumber}>
                              {representative.partNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xl font-bold text-left" style={{width: '160px'}}>
                            <div className="truncate text-white" title={representative.partName}>
                              {representative.partName}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-xl text-left" style={{width: '120px'}}>
                            <div className="text-xl text-white truncate" title={representative.customer}>
                              {representative.customer || '-'}
                            </div>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-center" style={{width: '80px'}}>
                            <div className="flex space-x-1 justify-center">
                              {(isEditAllowed(representative) || allowEditOlder) && (
                                <button
                                  onClick={() => handleEditIssue(representative)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                  title="แก้ไข"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          </td>
                          {isDeleteMode && (
                            <td className="px-3 py-4 whitespace-nowrap text-center" style={{width: '60px'}}>
                              <input
                                type="checkbox"
                                checked={selectedDeleteKeys.includes(partKey)}
                                onChange={() => toggleDeleteSelection(partKey)}
                                className="h-5 w-5 text-red-600 border-gray-300 rounded cursor-pointer"
                              />
                            </td>
                          )}
                        </tr>
                      );
                    }),
                  ...emptyRows.map((_, index) => (
                    <tr key={`empty-${index}`} className="h-16">
                      <td className="px-4 py-4 w-20">&nbsp;</td>
                      <td className="px-4 py-4 w-24">&nbsp;</td>
                      <td className="px-4 py-4 w-32">&nbsp;</td>
                      <td className="px-4 py-4 w-40">&nbsp;</td>
                      <td className="px-4 py-4 w-24">&nbsp;</td>
                      <td className="px-4 py-4 w-20">&nbsp;</td>
                      {isDeleteMode && <td className="px-4 py-4 w-16">&nbsp;</td>}
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
        
        {/* Bulk Issuing Form Modal */}
        {isBulkFormOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        📦 บันทึกการจ่ายออกหลาย Part
      </h2>
      
      <form onSubmit={handleBulkSubmit} className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🧾 ใส่เลข Invoice ให้ทุก Part (ถ้ามี)</h3>
          <input
            type="text"
            value={bulkSharedInvoice}
            onChange={(e) => {
              const value = e.target.value;
              setBulkSharedInvoice(value);
              setBulkFormData(prev => ({
                ...prev,
                parts: prev.parts.map(part => ({
                  ...part,
                  invoiceNumber: value
                }))
              }));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="เช่น INV-2026-001"
          />
          <p className="text-xs text-gray-500 mt-2">กรอกครั้งเดียว ระบบจะใส่ให้ทุก Part อัตโนมัติ (ยังแก้แต่ละ Part แยกได้)</p>
        </div>
        {/* Parts List */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🔧 รายการ Parts</h3>
            <button
              type="button"
              onClick={addBulkPart}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              + เพิ่ม Part
            </button>
          </div>

          <div className="space-y-6">
            {bulkFormData.parts.map((part, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-medium text-gray-700">Part #{index + 1}</h4>
                  {bulkFormData.parts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBulkPart(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      ลบ
                    </button>
                  )}
                </div>
                
                {/* Part Selection and Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">เลือก Part *</label>
                    <select
                      value={part.stockItemId}
                      onChange={(e) => updateBulkPart(index, 'stockItemId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    >
                      <option value="">-- เลือก Part --</option>
                      {sortedAvailableItems.filter(item => getBalance(item) > 0).map((item) => {
                        const availableQty = getBalance(item);
                        return (
                          <option key={item.id} value={item.id}>
                            {item.myobNumber} | {item.partNumber} | {item.partName} | {item.model} (คงเหลือ: {availableQty})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่จ่าย *</label>
                    <input
                      type="number"
                      value={part.issuedQty}
                      onChange={(e) => updateBulkPart(index, 'issuedQty', Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทงาน *</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`bulkIsNGItem-${index}`}
                        value="false"
                        checked={!part.isNGItem}
                        onChange={() => {
                          updateBulkPart(index, 'isNGItem', false);
                          updateBulkPart(index, 'ngProblem', '');
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">งานตัดออกปกติ</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name={`bulkIsNGItem-${index}`}
                        value="true"
                        checked={part.isNGItem === true}
                        onChange={() => updateBulkPart(index, 'isNGItem', true)}
                        className="mr-2"
                      />
                      <span className="text-sm text-red-700 font-medium">งานตัดออกเป็นงาน NG</span>
                    </label>
                  </div>
                </div>

                {/* Show available quantity for selected part */}
                {part.stockItemId && (
                  <div className="mt-2 text-sm text-gray-600">
                    {(() => {
                      const selectedItem = availableItems.find(item => item.id === part.stockItemId);
                      if (selectedItem) {
                        const availableQty = getBalance(selectedItem);
                        return `สต็อกคงเหลือ: ${availableQty} ชิ้น`;
                      }
                      return '';
                    })()}
                  </div>
                )}

                {/* Individual Part Details */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="text-md font-semibold text-gray-800 mb-3">📋 ข้อมูลสำหรับ Part นี้</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        INVOICE {!part.isNGItem ? '*' : '(ถ้ามี)'}
                      </label>
                      <input
                        type="text"
                        value={part.invoiceNumber}
                        onChange={(e) => updateBulkPart(index, 'invoiceNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required={!part.isNGItem}
                      />
                    </div>
            
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันที่จ่าย *</label>
                      <input
                        type="date"
                        value={part.issueDate}
                        onChange={(e) => updateBulkPart(index, 'issueDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">due ที่ต้องจัดส่ง</label>
                      <input
                        type="date"
                        value={part.dueDate}
                        onChange={(e) => updateBulkPart(index, 'dueDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                      <input
                        type="text"
                        value={part.event}
                        onChange={(e) => updateBulkPart(index, 'event', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <input
                        type="text"
                        value={part.supplier}
                        onChange={(e) => updateBulkPart(index, 'supplier', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                      <input
                        type="text"
                        value={part.customer}
                        onChange={(e) => updateBulkPart(index, 'customer', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เลขใบเบิก</label>
                      <input
                        type="text"
                        value={part.withdrawalNumber}
                        onChange={(e) => updateBulkPart(index, 'withdrawalNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                      <textarea
                        value={part.remarks}
                        onChange={(e) => updateBulkPart(index, 'remarks', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                  </div>

                  {part.isNGItem && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-red-700 mb-1">ปัญหาของชิ้นงาน (NG) *</label>
                      <textarea
                        value={part.ngProblem || ''}
                        onChange={(e) => updateBulkPart(index, 'ngProblem', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                        required={part.isNGItem}
                        placeholder="อธิบายปัญหาที่พบในชิ้นงาน..."
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => setIsBulkFormOpen(false)}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            บันทึกทั้งหมด
          </button>
        </div>
      </form>
    </div>
  </div>
      )}

      {isDetailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">🔍 รายละเอียดรับเข้า/จ่ายออก</h2>
                {(() => {
                  const headerItem = detailGroupItems[0];
                  const modelsText = Array.from(
                    new Set(
                      stockItems
                        .filter(item => (detailGroupKey ? getGroupKey(item) === detailGroupKey : false))
                        .map(item => item.model)
                        .filter(Boolean)
                    )
                  )
                    .map(model => (model || '').trim())
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' }))
                    .join(', ');

                  if (!headerItem) return null;

                  return (
                    <div className="mt-2 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold">MYOB:</span> {headerItem.myobNumber || '-'}
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="font-semibold">PART NUMBER:</span> {headerItem.partNumber || '-'}
                      </div>
                      <div>
                        <span className="font-semibold">PART NAME:</span> {headerItem.partName || '-'}
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="font-semibold">MODEL:</span> {modelsText || headerItem.model || '-'}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 text-lg"
              >
                ปิด
              </button>
            </div>

            {/* ช่องค้นหารหัสสินค้า - ทำให้ใหญ่และเด่น */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-lg">
              <div className="flex items-center gap-4">
                <label className="text-lg font-bold text-blue-800">🔍 รหัสสินค้า:</label>
                <input
                  type="text"
                  placeholder="พิมพ์รหัสสินค้าที่ต้องการค้นหา..."
                  className="flex-1 px-4 py-3 text-lg border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
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
                    const input = document.querySelector('input[placeholder="พิมพ์รหัสสินค้าที่ต้องการค้นหา..."]') as HTMLInputElement;
                    const searchValue = input?.value.trim();
                    if (searchValue) {
                      const foundItem = stockItems.find(item => 
                        item.partNumber.toLowerCase().includes(searchValue.toLowerCase())
                      );
                      if (foundItem) {
                        setDetailGroupKey(getGroupKey(foundItem));
                        if (input) input.value = '';
                      } else {
                        alert('ไม่พบรหัสสินค้านี้');
                      }
                    }
                  }}
                  className="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  ค้นหา
                </button>
              </div>
              <p className="mt-3 text-sm text-blue-700 font-medium">💡 พิมพ์รหัสสินค้าแล้วกด Enter หรือคลิกปุ่มค้นหา เพื่อดูรายละเอียดสินค้าชิ้นอื่น</p>
            </div>

            <div className="space-y-6">
              {(() => {
                const receivedItems = detailGroupItems
                  .filter(item => item.receivedQty > 0)
                  .slice()
                  .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());
                const issuedItems = detailGroupItems
                  .filter(item => item.issuedQty && item.issuedQty > 0)
                  .slice()
                  .sort((a, b) => new Date(a.issueDate || a.createdAt).getTime() - new Date(b.issueDate || b.createdAt).getTime());
                const totalReceived = receivedItems.reduce((sum, item) => sum + item.receivedQty, 0);
                const totalIssued = issuedItems.reduce((sum, item) => sum + (item.issuedQty || 0), 0);
                const balance = totalReceived - totalIssued;
                const latestIssue = issuedItems[issuedItems.length - 1];

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <div className="text-xs text-blue-600">ก่อนจ่าย</div>
                        <div className="text-lg font-bold text-blue-700">{totalReceived}</div>
                        <div className="text-xs text-blue-500">รับเข้า {receivedItems.length} ครั้ง</div>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <div className="text-xs text-red-600">จำนวนจ่าย</div>
                        <div className="text-lg font-bold text-red-700">{totalIssued}</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <div className="text-xs text-green-600">คงเหลือ</div>
                        <div className="text-lg font-bold text-green-700">{balance}</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                        <div className="text-xs text-purple-600">วันที่จ่ายล่าสุด</div>
                        <div className="text-lg font-bold text-purple-700">
                          {latestIssue?.issueDate ? new Date(latestIssue.issueDate).toLocaleDateString('th-TH') : '-'}
                        </div>
                      </div>
                    </div>

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
                      </tr>
                    </thead>
                    <tbody>
                      {receivedItems.map(item => (
                          <tr key={item.id} className="border-t">
                            <td className="py-3 px-4">{item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('th-TH') : '-'}</td>
                            <td className="py-3 px-4">{item.poNumber || '-'}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                {item.receivedQty}
                              </span>
                            </td>
                            <td className="py-3 px-4">{item.supplier || '-'}</td>
                            <td className="py-3 px-4">{renderRemarksLines(item.remarks)}</td>
                          </tr>
                        ))}
                      {receivedItems.length === 0 && (
                        <tr>
                          <td className="py-3 px-4 text-gray-500" colSpan={5}>ไม่มีข้อมูลรับเข้า</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 font-semibold text-gray-800">รายการจ่ายออก</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white">
                      <tr className="text-gray-500">
                        <th className="py-3 px-4">วันที่จ่ายออก</th>
                        <th className="py-3 px-4">Invoice/ใบเบิก</th>
                        <th className="py-3 px-4">จำนวนจ่าย</th>
                        <th className="py-3 px-4">ลูกค้า</th>
                        <th className="py-3 px-4">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issuedItems.map(item => (
                          <tr key={item.id} className="border-t">
                            <td className="py-3 px-4">{item.issueDate ? new Date(item.issueDate).toLocaleDateString('th-TH') : '-'}</td>
                            <td className="py-3 px-4">{item.invoiceNumber || item.withdrawalNumber || '-'}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                {item.issuedQty}
                              </span>
                            </td>
                            <td className="py-3 px-4">{item.customer || '-'}</td>
                            <td className="py-3 px-4">{renderRemarksLines(item.remarks)}</td>
                          </tr>
                        ))}
                      {issuedItems.length === 0 && (
                        <tr>
                          <td className="py-3 px-4 text-gray-500" colSpan={5}>ไม่มีข้อมูลจ่ายออก</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}
      </div>
          </div>
        </div>
      )}

        </div>
    );
}
