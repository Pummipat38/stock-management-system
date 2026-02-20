-- Create custom_buttons table
CREATE TABLE IF NOT EXISTS "custom_buttons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_buttons_pkey" PRIMARY KEY ("id")
);

-- Create custom_button_data table
CREATE TABLE IF NOT EXISTS "custom_button_data" (
    "id" TEXT NOT NULL,
    "buttonId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'text',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_button_data_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraint
ALTER TABLE "custom_button_data" ADD CONSTRAINT "custom_button_data_buttonId_fkey" FOREIGN KEY ("buttonId") REFERENCES "custom_buttons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
