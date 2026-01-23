-- CreateTable
CREATE TABLE "stock_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "myobNumber" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "receivedQty" INTEGER NOT NULL,
    "receivedDate" DATETIME NOT NULL,
    "issuedQty" INTEGER,
    "invoiceNumber" TEXT,
    "issueDate" DATETIME,
    "dueDate" DATETIME,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
