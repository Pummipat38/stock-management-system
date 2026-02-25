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
  partNumber?: string;
  partName?: string;
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
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [partModalMode, setPartModalMode] = useState<'create' | 'edit'>('create');
  const [partModalPartId, setPartModalPartId] = useState<string>('');
  const [partModalNumber, setPartModalNumber] = useState('');
  const [partModalName, setPartModalName] = useState('');

  const createEmptyRowCells = (columns: MasterPlanColumn[]) =>
    columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.id] = '';
      return acc;
    }, {});

  const partDisplayText = (p: MasterPlanPart) => {
    const number = (p.partNumber || '').trim();
    const name = (p.partName || '').trim();
    if (number && name) return `PART NO. : ${number}  PART NAME : ${name}`;
    if (number) return `PART NO. : ${number}`;
    return p.name;
  };

  const getPartColor = (index: number) => {
    const colors = [
      'bg-blue-600 hover:bg-blue-700',
      'bg-green-600 hover:bg-green-700',
      'bg-purple-600 hover:bg-purple-700',
      'bg-orange-600 hover:bg-orange-700',
      'bg-pink-600 hover:bg-pink-700',
      'bg-cyan-600 hover:bg-cyan-700',
      'bg-red-600 hover:bg-red-700',
      'bg-yellow-600 hover:bg-yellow-700',
    ];
    return colors[index % colors.length];
  };

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
              partNumber: 'DEFAULT',
              partName: '',
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
            partNumber: 'DEFAULT',
            partName: '',
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
    ...Array.from({ length: 96 }, (_, i) => ({
      id: `col_extra_${i + 1}`,
      name: `COL ${i + 1}`,
      type: 'text' as const,
    })),
  ];

  const upgradePartColumns = (part: MasterPlanPart): { part: MasterPlanPart; changed: boolean } => {
    const requiredCols = getRequiredColumns();
    const currentCols = part.columns || [];
    
    // Check if columns match required structure
    const hasAllRequired = requiredCols.every(req => 
      currentCols.some(c => c.id === req.id)
    );
    
    if (hasAllRequired && currentCols.length === requiredCols.length) {
      return { part, changed: false };
    }

    // Create a map of existing cells
    const existingCells = part.rows?.[0]?.cells || {};

    // Build new columns and migrate cell data
    const newColumns: MasterPlanColumn[] = requiredCols.map(req => {
      const existing = currentCols.find(c => c.id === req.id);
      return existing || req;
    });

    // Upgrade rows with new columns
    const newRows = (part.rows || []).map(row => {
      const newCells: Record<string, string> = {};
      for (const col of newColumns) {
        newCells[col.id] = existingCells[col.id] || '';
      }
      return { ...row, cells: newCells };
    });

    return {
      part: { ...part, columns: newColumns, rows: newRows },
      changed: true,
    };
  };

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

  // Auto-upgrade all parts to have consistent columns
  useEffect(() => {
    if (!sheetId || !sheet) return;
    
    let anyChanged = false;
    const upgradedParts = parts.map(p => {
      const result = upgradePartColumns(p);
      if (result.changed) anyChanged = true;
      return result.part;
    });
    
    if (anyChanged) {
      updateSheet(sheetId, prev => ({
        ...prev,
        parts: upgradedParts,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId, sheet?.id]);

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

  const openCreatePartModal = () => {
    setPartModalMode('create');
    setPartModalPartId('');
    setPartModalNumber('');
    setPartModalName('');
    setIsPartModalOpen(true);
  };

  const openEditPartModal = (p: MasterPlanPart) => {
    if (!isEditMode) return;
    setPartModalMode('edit');
    setPartModalPartId(p.id);
    setPartModalNumber(p.partNumber || '');
    setPartModalName(p.partName || '');
    setIsPartModalOpen(true);
  };

  const savePartFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetId || !sheet) return;

    const partNumber = partModalNumber.trim();
    const partName = partModalName.trim();
    if (!partNumber || !partName) return;

    const columns = getRequiredColumns();
    const emptyCells = createEmptyRowCells(columns);

    if (partModalMode === 'create') {
      const nextPart: MasterPlanPart = {
        id: `part_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name: partNumber,
        partNumber,
        partName,
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
    } else {
      const editId = partModalPartId;
      if (!editId) return;
      updateSheet(sheetId, prev => {
        const prevParts = Array.isArray(prev.parts) ? prev.parts : [];
        return {
          ...prev,
          parts: prevParts.map(p =>
            p.id === editId
              ? {
                  ...p,
                  name: partNumber,
                  partNumber,
                  partName,
                }
              : p
          ),
        };
      });
    }

    setIsPartModalOpen(false);
  };

  const deletePart = (p: MasterPlanPart) => {
    if (!sheetId) return;
    if (!isEditMode) return;
    const ok = window.confirm(`ต้องการลบ Part นี้ใช่ไหม?\n\n${partDisplayText(p)}`);
    if (!ok) return;

    updateSheet(sheetId, prev => {
      const prevParts = Array.isArray(prev.parts) ? prev.parts : [];
      return {
        ...prev,
        parts: prevParts.filter(x => x.id !== p.id),
      };
    });
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
                onClick={openCreatePartModal}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
              >
                ➕ ADD PART
              </button>
            </div>

            <div className="flex flex-col gap-4 items-start">
              {parts.map((p, index) => (
                <div key={p.id} className="flex gap-4 w-full max-w-[900px] items-center">
                  {/* ปุ่มลบ - แสดงตลอดเวลา */}
                  <button
                    type="button"
                    onClick={() => deletePart(p)}
                    className="px-6 py-4 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold shadow-lg transition-colors text-lg"
                    title="ลบ Part"
                  >
                    🗑 DELETE
                  </button>
                  
                  {/* ปุ่มแก้ไข - แสดงเฉพาะ Edit Mode */}
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => openEditPartModal(p)}
                      className="px-6 py-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-lg transition-colors text-lg"
                      title="แก้ไข Part"
                    >
                      ✏️ EDIT
                    </button>
                  )}
                  
                  {/* ปุ่ม Part - ใหญ่ขึ้น และมีสีแตกต่างกัน */}
                  <button
                    type="button"
                    onClick={() => openPart(p)}
                    className={`px-8 py-5 ${getPartColor(index)} text-white rounded-xl font-bold shadow-lg transition-colors text-left w-full text-xl`}
                  >
                    {partDisplayText(p)}
                  </button>
                </div>
              ))}

              {parts.length === 0 && <div className="text-gray-400 text-xl">ยังไม่มี Part number</div>}
            </div>

            <div className="mt-8">
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
            </div>
          </>
        )}

        {isPartModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 rounded-t-2xl border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {partModalMode === 'create' ? '➕ ADD PART' : '✏️ EDIT PART'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsPartModalOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={savePartFromModal} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">PART NUMBER *</label>
                  <input
                    type="text"
                    value={partModalNumber}
                    onChange={e => setPartModalNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="เช่น: 18365K77 V000"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">PART NAME *</label>
                  <input
                    type="text"
                    value={partModalName}
                    onChange={e => setPartModalName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="เช่น: WASHER,RUBBER"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setIsPartModalOpen(false)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    ❌ ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg"
                  >
                    💾 บันทึก
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
