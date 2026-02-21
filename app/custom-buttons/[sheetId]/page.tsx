'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

type StorageState = {
  sheets?: MasterPlanSheet[];
  selectedSheetId?: string;
};

export default function MasterPlanSheetPage() {
  const router = useRouter();
  const params = useParams<{ sheetId: string }>();
  const sheetId = params?.sheetId;

  const [sheets, setSheets] = useState<MasterPlanSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [newPartName, setNewPartName] = useState('');

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
      return {
        sheet: {
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
        },
        changed: true,
      };
    }

    const columns = getRequiredColumns();
    const emptyCells = createEmptyRowCells(columns);
    return {
      sheet: {
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
      },
      changed: true,
    };
  };

  const getRequiredColumns = (): MasterPlanColumn[] => [
    { id: 'col_doc', name: 'DOCUMENT', type: 'text' },
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

  const isMasterPlanSheet = (sheet: { name: string }) => {
    const normalized = (sheet.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized === 'master plan' || normalized === 'masterplan';
  };

  const loadFromStorage = () => {
    try {
      const storedSheets = localStorage.getItem('master_plan_sheets_v1');
      if (!storedSheets) return;
      const parsed = JSON.parse(storedSheets) as StorageState;
      if (Array.isArray(parsed.sheets)) {
        const filtered = parsed.sheets.filter(s => !isMasterPlanSheet(s));
        const migrated = filtered.map(s => migrateSheetToParts(s));
        const nextSheets = migrated.map(m => m.sheet);
        const changed = migrated.some(m => m.changed);
        setSheets(nextSheets);
        setSelectedSheetId(parsed.selectedSheetId || '');
        if (changed) {
          try {
            localStorage.setItem('master_plan_sheets_v1', JSON.stringify({ sheets: nextSheets, selectedSheetId: parsed.selectedSheetId || '' }));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sheet = useMemo(() => {
    if (!sheetId) return null;
    return sheets.find(s => s.id === sheetId) || null;
  }, [sheets, sheetId]);

  const parts = useMemo(() => {
    if (!sheet) return [] as MasterPlanPart[];
    return Array.isArray(sheet.parts) ? sheet.parts : [];
  }, [sheet]);

  const persistSheets = (nextSheets: MasterPlanSheet[], nextSelectedId?: string) => {
    setSheets(nextSheets);
    if (typeof nextSelectedId === 'string') setSelectedSheetId(nextSelectedId);
    try {
      const payload: StorageState = {
        sheets: nextSheets.filter(s => !isMasterPlanSheet(s)),
        selectedSheetId: typeof nextSelectedId === 'string' ? nextSelectedId : selectedSheetId,
      };
      localStorage.setItem('master_plan_sheets_v1', JSON.stringify(payload));
    } catch {
      // ignore
    }
  };

  const updateSheet = (sheetIdToUpdate: string, updater: (prev: MasterPlanSheet) => MasterPlanSheet) => {
    const nextSheets = sheets.map(s => (s.id === sheetIdToUpdate ? updater(s) : s));
    persistSheets(nextSheets, sheetIdToUpdate);
  };

  const createPart = () => {
    if (!sheetId || !sheet) return;
    if (!isEditMode) return;
    const name = newPartName.trim();
    if (!name) return;

    const columns = getRequiredColumns();
    const emptyCells = createEmptyRowCells(columns);
    const nextPart: MasterPlanPart = {
      id: `part_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name,
      columns,
      rows: [
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
      ],
    };

    updateSheet(sheetId, prev => {
      const prevParts = Array.isArray(prev.parts) ? prev.parts : [];
      return {
        ...prev,
        parts: [...prevParts, nextPart],
        columns: undefined,
        rows: undefined,
      };
    });
    setNewPartName('');
  };

  const openPart = (part: MasterPlanPart) => {
    if (!sheetId) return;
    router.push(`/custom-buttons/${sheetId}/${part.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 relative">
          <h1 className="text-3xl font-bold text-white mb-2">{sheet ? sheet.name : 'MODEL'}</h1>
          <p className="text-gray-400">เลือก Part number</p>

          <div className="absolute top-0 right-0">
            <button
              onClick={() => router.push('/custom-buttons')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>

        {!sheet && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-gray-300">
            ไม่พบ Model นี้
          </div>
        )}

        {sheet && (
          <>
            <div className="mb-6 flex gap-4 items-center flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditMode(v => !v)}
                className={
                  isEditMode
                    ? 'px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors shadow-lg'
                    : 'px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg'
                }
              >
                {isEditMode ? '✅ DONE' : '✏️ EDIT'}
              </button>

              <div className="flex items-center gap-3">
                <input
                  value={newPartName}
                  disabled={!isEditMode}
                  onChange={e => setNewPartName(e.target.value)}
                  placeholder="Part number"
                  className="w-56 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={createPart}
                  disabled={!isEditMode || !newPartName.trim()}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  ➕ ADD PART
                </button>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  {parts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openPart(p)}
                      className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold shadow-lg transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {parts.length === 0 && (
                  <div className="pt-6 text-gray-400">ยังไม่มี Part number</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
