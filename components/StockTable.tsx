import { StockItem } from '@/types/stock';

interface StockTableProps {
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
}

export default function StockTable({ items, onEdit, onDelete, showActions = true }: StockTableProps) {
  // ตรวจสอบว่า items เป็น array หรือไม่
  if (!Array.isArray(items)) {
    console.error('StockTable: items is not an array:', items);
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-500 text-lg">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        <p className="text-gray-400">กรุณาลองรีเฟรชหน้าใหม่</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-500 text-lg">ยังไม่มีข้อมูลสินค้า</p>
        <p className="text-gray-400">คลิกปุ่ม "เพิ่มสินค้าใหม่" เพื่อเริ่มต้น</p>
      </div>
    );
  }

  const calculateBalance = (received: number, issued?: number) => {
    return received - (issued || 0);
  };

  const getBalanceColor = (balance: number) => {
    if (balance <= 0) return 'text-red-600 bg-red-50';
    if (balance <= 10) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="w-full">
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">MYOB</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Model</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Part Name</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Part No.</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Rev.</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">PO No.</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">รับเข้า</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">วันที่รับ</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">จ่ายออก</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">คงเหลือ</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Invoice</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">วันที่จ่าย</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Due Date</th>
              <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">หมายเหตุ</th>
              {showActions && (
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">จัดการ</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.slice(0, 10).map((item) => {
              const balance = calculateBalance(item.receivedQty, item.issuedQty);
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-2 text-xs font-medium text-gray-900 truncate">{item.myobNumber}</td>
                  <td className="px-2 py-2 text-xs text-gray-900 truncate">{item.model}</td>
                  <td className="px-2 py-2 text-xs text-gray-900">
                    <div className="truncate" title={item.partName}>{item.partName}</div>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900 font-mono truncate">{item.partNumber}</td>
                  <td className="px-2 py-2 text-xs text-gray-900 truncate">{item.revision}</td>
                  <td className="px-2 py-2 text-xs text-gray-900 truncate">{item.poNumber}</td>
                  <td className="px-2 py-2 text-xs text-gray-900">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      {item.receivedQty.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900">
                    {new Date(item.receivedDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900">
                    {item.issuedQty ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        {item.issuedQty.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getBalanceColor(balance)}`}>
                      {balance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900 truncate">
                    {item.invoiceNumber || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900">
                    {item.issueDate ? new Date(item.issueDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900">
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-2 py-2 text-xs text-gray-900">
                    <div className="truncate" title={item.remarks || ''}>
                      {item.remarks || <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  {showActions && (
                    <td className="px-2 py-2 text-xs font-medium">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-1 py-1 rounded transition-colors"
                          title="แก้ไข"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 px-1 py-1 rounded transition-colors"
                          title="ลบ"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* สรุปข้อมูล */}
      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-gray-600">รายการทั้งหมด</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {items.reduce((sum, item) => sum + item.receivedQty, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">รับเข้าทั้งหมด</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {items.reduce((sum, item) => sum + (item.issuedQty || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">จ่ายออกทั้งหมด</div>
          </div>
        </div>
      </div>
    </div>
  );
}
