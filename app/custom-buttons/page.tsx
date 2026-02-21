'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface MasterPlanColumn {
  id: string;
  name: string;
  type: 'text' | 'textarea';
}

interface MasterPlanRow {
  id: string;
  cells: Record<string, string>;
}

interface MasterPlanPart {
  id: string;
  name: string;
  columns: MasterPlanColumn[];
  rows: MasterPlanRow[];
}

interface MasterPlanSheet {
  id: string;
  name: string;
  parts?: MasterPlanPart[];
  columns?: MasterPlanColumn[];
  rows?: MasterPlanRow[];
}

export default function CustomButtonsPage() {
  const [masterPlanSheets, setMasterPlanSheets] = useState<MasterPlanSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [isCreateSheetModalOpen, setIsCreateSheetModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');

  const router = useRouter();

  const createDefaultColumns = (): MasterPlanColumn[] => {
    const docColId = 'col_doc';
    return [
      { id: docColId, name: 'DOCUMENT', type: 'text' },
      { id: 'col_desc', name: 'DESCRIPTION', type: 'textarea' },
      { id: 'col_desc2', name: 'DESCRIPTION', type: 'textarea' },
      { id: 'col_meeting', name: 'MEETING', type: 'text' },
      { id: 'col_start', name: 'START', type: 'text' },
      { id: 'col_finish', name: 'FINISH', type: 'text' },
      { id: 'col_status', name: 'STATUS', type: 'text' },
      { id: 'col_remark', name: 'REMARK', type: 'textarea' },
      { id: 'col_extra_1', name: 'COL 1', type: 'text' },
      { id: 'col_extra_2', name: 'COL 2', type: 'text' },
      { id: 'col_extra_3', name: 'COL 3', type: 'text' },
      { id: 'col_extra_4', name: 'COL 4', type: 'text' },
      { id: 'col_extra_5', name: 'COL 5', type: 'text' },
      { id: 'col_extra_6', name: 'COL 6', type: 'text' },
      { id: 'col_extra_7', name: 'COL 7', type: 'text' },
      { id: 'col_extra_8', name: 'COL 8', type: 'text' },
      { id: 'col_extra_9', name: 'COL 9', type: 'text' },
      { id: 'col_extra_10', name: 'COL 10', type: 'text' },
    ];
  };

  const createEmptyRowCells = (columns: MasterPlanColumn[]) =>
    columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.id] = '';
      return acc;
    }, {});

  const migrateSheetToParts = (sheet: MasterPlanSheet): { sheet: MasterPlanSheet; changed: boolean } => {
    if (Array.isArray(sheet.parts) && sheet.parts.length > 0) {
      return { sheet, changed: false };
    }

    const legacyColumns = Array.isArray(sheet.columns) ? sheet.columns : null;
    const legacyRows = Array.isArray(sheet.rows) ? sheet.rows : null;

    if (legacyColumns && legacyRows) {
      const migrated: MasterPlanSheet = {
        id: sheet.id,
        name: sheet.name,
        parts: [
          {
            id: 'part_default',
            name: 'DEFAULT',
            columns: legacyColumns,
            rows: legacyRows,
          },
        ],
      };
      return { sheet: migrated, changed: true };
    }

    const columns = createDefaultColumns();
    const emptyCells = createEmptyRowCells(columns);
    const migrated: MasterPlanSheet = {
      id: sheet.id,
      name: sheet.name,
      parts: [
        {
          id: 'part_default',
          name: 'DEFAULT',
          columns,
          rows: [
            { id: 'row_1', cells: { ...emptyCells } },
            { id: 'row_2', cells: { ...emptyCells } },
            { id: 'row_3', cells: { ...emptyCells } },
          ],
        },
      ],
    };
    return { sheet: migrated, changed: true };
  };

  const isMasterPlanSheet = (sheet: { name: string }) => {
    const normalized = (sheet.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized === 'master plan' || normalized === 'masterplan';
  };

  useEffect(() => {
    try {
      const storedSheets = localStorage.getItem('master_plan_sheets_v1');
      if (storedSheets) {
        const parsed = JSON.parse(storedSheets) as {
          sheets?: MasterPlanSheet[];
          selectedSheetId?: string;
        };
        if (Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
          const filteredSheets = parsed.sheets.filter(s => !isMasterPlanSheet(s));
          const migrated = filteredSheets.map(s => migrateSheetToParts(s));
          const nextSheets = migrated.map(m => m.sheet);
          const changed = migrated.some(m => m.changed);
          if (filteredSheets.length > 0) {
            const nextSelectedId =
              nextSheets.some(s => s.id === parsed.selectedSheetId)
                ? (parsed.selectedSheetId as string)
                : nextSheets[0].id;
            setMasterPlanSheets(nextSheets);
            setSelectedSheetId(nextSelectedId);

            if (changed) {
              try {
                localStorage.setItem('master_plan_sheets_v1', JSON.stringify({ sheets: nextSheets, selectedSheetId: nextSelectedId }));
              } catch {
                // ignore
              }
            }
            return;
          }
        }
      }

      const storedLegacy = localStorage.getItem('master_plan_sheet_v1');
      if (storedLegacy) {
        const legacy = JSON.parse(storedLegacy) as {
          columns?: MasterPlanColumn[];
          rows?: MasterPlanRow[];
        };
        if (Array.isArray(legacy.columns) && Array.isArray(legacy.rows)) {
          // ignore legacy single-sheet data so it won't recreate MASTER PLAN button
        }
      }
    } catch {
      // ignore
    }

    const defaultColumns = createDefaultColumns();
    const emptyCells = createEmptyRowCells(defaultColumns);
    const defaultPart: MasterPlanPart = {
      id: `part_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: 'DEFAULT',
      columns: defaultColumns,
      rows: [
        { id: 'row_1', cells: { ...emptyCells } },
        { id: 'row_2', cells: { ...emptyCells } },
        { id: 'row_3', cells: { ...emptyCells } },
      ],
    };
    const defaultSheet: MasterPlanSheet = {
      id: 'sheet_default',
      name: 'MODEL',
      parts: [defaultPart],
    };
    setMasterPlanSheets([defaultSheet]);
    setSelectedSheetId(defaultSheet.id);
  }, []);

  useEffect(() => {
    if (masterPlanSheets.length === 0) return;
    try {
      localStorage.setItem(
        'master_plan_sheets_v1',
        JSON.stringify({ sheets: masterPlanSheets.filter(s => !isMasterPlanSheet(s)), selectedSheetId })
      );
    } catch {
      // ignore
    }
  }, [masterPlanSheets, selectedSheetId]);

  const openCreateSheetModal = () => {
    setNewSheetName('');
    setIsCreateSheetModalOpen(true);
  };

  const openSheetTable = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    router.push(`/custom-buttons/${sheetId}`);
  };

  const createSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSheetName.trim();
    if (!name) return;

    const columns = createDefaultColumns();
    const emptyCells = createEmptyRowCells(columns);
    const defaultPart: MasterPlanPart = {
      id: `part_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: 'DEFAULT',
      columns,
      rows: [
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
      ],
    };
    const newSheet: MasterPlanSheet = {
      id: `sheet_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name,
      parts: [defaultPart],
    };

    setMasterPlanSheets(prev => [...prev, newSheet]);
    setSelectedSheetId(newSheet.id);
    setIsCreateSheetModalOpen(false);
    router.push(`/custom-buttons/${newSheet.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative">
          <h1 className="text-3xl font-bold text-white mb-2">📝 MASTER PLAN</h1>
          <p className="text-gray-400">จัดการเอกสารและสถานะ Part ตามที่กำหนด</p>

          {/* Back Button - positioned absolute top right */}
          <div className="absolute top-0 right-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={openCreateSheetModal}
            className="px-8 py-4 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xl font-bold transition-colors flex items-center gap-3 shadow-lg"
          >
            ➕ ADD MODEL
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          {masterPlanSheets.filter(s => !isMasterPlanSheet(s)).map(sheet => (
            <button
              key={sheet.id}
              onClick={() => openSheetTable(sheet.id)}
              className={
                sheet.id === selectedSheetId
                  ? 'px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg transition-colors'
                  : 'px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold shadow-lg transition-colors'
              }
            >
              {sheet.name}
            </button>
          ))}
        </div>

        {isCreateSheetModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 rounded-t-2xl border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">➕ ADD MODEL</h2>
                  <button
                    onClick={() => setIsCreateSheetModalOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={createSheet} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ชื่อ Model *</label>
                  <input
                    type="text"
                    value={newSheetName}
                    onChange={(e) => setNewSheetName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="กรอกชื่อ (เช่น: K4LF)"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsCreateSheetModalOpen(false)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ❌ ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    💾 สร้าง
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
