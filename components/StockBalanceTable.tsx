import { StockItem } from '@/types/stock';

interface StockBalanceTableProps {
  items: StockItem[];
}

export default function StockBalanceTable({ items }: StockBalanceTableProps) {
  // ตรวจสอบว่า items เป็น array หรือไม่
  if (!Array.isArray(items)) {
    console.error('StockBalanceTable: items is not an array:', items);
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
        <p className="text-gray-400">ไม่พบข้อมูลสต็อกในระบบ</p>
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

  // รวม part เหมือนกันและคำนวณยอดคงเหลือรวม
  const groupedItems = items.reduce((acc, item) => {
    const key = `${item.myobNumber}-${item.model}-${item.partNumber}-${item.partName}`;
    const balance = calculateBalance(item.receivedQty, item.issuedQty);
    
    if (acc[key]) {
      acc[key].totalBalance += balance;
      acc[key].totalReceived += item.receivedQty;
      acc[key].totalIssued += (item.issuedQty || 0);
    } else {
      acc[key] = {
        myobNumber: item.myobNumber,
        model: item.model,
        partNumber: item.partNumber,
        partName: item.partName,
        totalBalance: balance,
        totalReceived: item.receivedQty,
        totalIssued: (item.issuedQty || 0)
      };
    }
    
    return acc;
  }, {} as Record<string, {
    myobNumber: string;
    model: string;
    partNumber: string;
    partName: string;
    totalBalance: number;
    totalReceived: number;
    totalIssued: number;
  }>);

  const consolidatedItems = Object.values(groupedItems).filter(item => item.totalBalance > 0);
  const partColors = [
    { text: 'text-orange-400', border: 'border-orange-400/70', bg: 'bg-orange-400/10' },
    { text: 'text-violet-300', border: 'border-violet-300/70', bg: 'bg-violet-300/10' },
    { text: 'text-cyan-300', border: 'border-cyan-300/70', bg: 'bg-cyan-300/10' },
    { text: 'text-yellow-300', border: 'border-yellow-300/70', bg: 'bg-yellow-300/10' },
    { text: 'text-pink-300', border: 'border-pink-300/70', bg: 'bg-pink-300/10' },
    { text: 'text-emerald-300', border: 'border-emerald-300/70', bg: 'bg-emerald-300/10' },
    { text: 'text-sky-300', border: 'border-sky-300/70', bg: 'bg-sky-300/10' },
    { text: 'text-fuchsia-300', border: 'border-fuchsia-300/70', bg: 'bg-fuchsia-300/10' }
  ];

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="overflow-hidden border border-white/20 rounded-lg">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-left text-lg font-semibold text-blue-100 uppercase tracking-wider">MYOB</th>
                <th className="px-6 py-4 text-left text-lg font-semibold text-indigo-100 uppercase tracking-wider">MODEL</th>
                <th className="px-6 py-4 text-left text-lg font-semibold text-emerald-100 uppercase tracking-wider">PART NUMBER</th>
                <th className="px-6 py-4 text-left text-lg font-semibold text-amber-100 uppercase tracking-wider">PART NAME</th>
                <th className="px-6 py-4 text-left text-lg font-semibold text-rose-100 uppercase tracking-wider">คงเหลือ</th>
              </tr>
            </thead>
            <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-white/10">
              {consolidatedItems.map((item, index) => {
                const rowKey = `${item.myobNumber}-${item.partNumber}-${item.model}`;
                const colorIndex = Math.abs(
                  rowKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
                ) % partColors.length;
                const rowColor = partColors[colorIndex];
                return (
                  <tr key={`${item.myobNumber}-${item.partNumber}-${index}`} className="hover:bg-white/10 transition-colors">
                    <td className={`px-6 py-4 whitespace-nowrap text-lg font-semibold ${rowColor.text}`}>{item.myobNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg">
                      <span className={`inline-flex items-center justify-center px-4 py-1 rounded-full border ${rowColor.text} ${rowColor.border} ${rowColor.bg} font-semibold`}>
                        {item.model}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-lg font-mono ${rowColor.text}`}>{item.partNumber}</td>
                    <td className={`px-6 py-4 text-lg max-w-xs ${rowColor.text}`}>
                      <div className="truncate" title={item.partName}>{item.partName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-lg">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold ${getBalanceColor(item.totalBalance)}`}>
                        {item.totalBalance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* สรุปข้อมูล */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-white">{consolidatedItems.length}</div>
              <div className="text-white/70 text-lg">รายการทั้งหมด</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-300">
                {consolidatedItems.reduce((sum, item) => sum + item.totalBalance, 0).toLocaleString()}
              </div>
              <div className="text-white/70 text-lg">คงเหลือสุทธิ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
