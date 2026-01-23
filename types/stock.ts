export interface StockItem {
  id: string;
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
  issuedQty?: number;
  invoiceNumber?: string;
  issueDate?: string;
  dueDate?: string;
  event?: string;
  withdrawalNumber?: string; // เลขใบเบิก
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}
