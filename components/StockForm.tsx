import { useState, useEffect } from 'react';

export interface StockItemFormData {
  myobNumber: string;
  model: string;
  partName: string;
  partNumber: string;
  revision: string;
  poNumber: string;
  receivedQty: number;
  receivedDate: string;
  issuedQty?: number;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  remarks?: string;
}

interface StockFormProps {
  initialData?: StockItemFormData;
  onSubmit: (data: StockItemFormData) => void;
  onCancel: () => void;
}

export default function StockForm({ initialData, onSubmit, onCancel }: StockFormProps) {
  const [formData, setFormData] = useState<StockItemFormData>({
    myobNumber: '',
    model: '',
    partName: '',
    partNumber: '',
    revision: '',
    poNumber: '',
    receivedQty: 0,
    receivedDate: new Date().toISOString().split('T')[0],
    issuedQty: 0,
    invoiceNumber: '',
    issueDate: '',
    dueDate: '',
    remarks: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        receivedDate: initialData.receivedDate ? new Date(initialData.receivedDate).toISOString().split('T')[0] : '',
        issueDate: initialData.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.endsWith('Qty') ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ข้อมูลพื้นฐาน */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 ข้อมูลพื้นฐาน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลข MYOB *</label>
            <input
              type="text"
              name="myobNumber"
              value={formData.myobNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
            <input
              type="text"
              name="partName"
              value={formData.partName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Part Number *</label>
            <input
              type="text"
              name="partNumber"
              value={formData.partNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
            <input
              type="text"
              name="revision"
              value={formData.revision}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลข PO *</label>
            <input
              type="text"
              name="poNumber"
              value={formData.poNumber}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* ข้อมูลการรับเข้า */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📥 ข้อมูลการรับเข้า</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่รับเข้า *</label>
            <input
              type="number"
              name="receivedQty"
              value={formData.receivedQty}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่รับเข้า *</label>
            <input
              type="date"
              name="receivedDate"
              value={formData.receivedDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* ข้อมูลการจ่ายออก */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📤 ข้อมูลการจ่ายออก</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่จ่ายออก</label>
            <input
              type="number"
              name="issuedQty"
              value={formData.issuedQty || ''}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลข Invoice ออก</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่จ่ายออก</label>
            <input
              type="date"
              name="issueDate"
              value={formData.issueDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due ที่ส่ง</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="ใส่หมายเหตุเพิ่มเติม..."
          />
        </div>
      </div>

      {/* ปุ่มควบคุม */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          ❌ ยกเลิก
        </button>
        <button
          type="submit"
          className="px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {initialData ? '💾 อัปเดต' : '💾 บันทึก'}
        </button>
      </div>
    </form>
  );
}
