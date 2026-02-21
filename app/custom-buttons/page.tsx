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

interface MasterPlanSheet {
  id: string;
  name: string;
  columns: MasterPlanColumn[];
  rows: MasterPlanRow[];
}

export default function CustomButtonsPage() {
  const [masterPlanSheets, setMasterPlanSheets] = useState<MasterPlanSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [isCreateSheetModalOpen, setIsCreateSheetModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [isSheetTableModalOpen, setIsSheetTableModalOpen] = useState(false);

  const router = useRouter();

  const createDefaultColumns = (): MasterPlanColumn[] => {
    const docColId = 'col_doc';
    return [
      { id: docColId, name: 'DOCUMENT', type: 'text' },
      { id: 'col_desc', name: 'DESCRIPTION', type: 'textarea' },
      { id: 'col_meeting', name: 'MEETING', type: 'text' },
      { id: 'col_start', name: 'START', type: 'text' },
      { id: 'col_finish', name: 'FINISH', type: 'text' },
      { id: 'col_status', name: 'STATUS', type: 'text' },
      { id: 'col_remark', name: 'REMARK', type: 'textarea' },
    ];
  };

  const createEmptyRowCells = (columns: MasterPlanColumn[]) =>
    columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.id] = '';
      return acc;
    }, {});

  useEffect(() => {
    try {
      const storedSheets = localStorage.getItem('master_plan_sheets_v1');
      if (storedSheets) {
        const parsed = JSON.parse(storedSheets) as {
          sheets?: MasterPlanSheet[];
          selectedSheetId?: string;
        };
        if (Array.isArray(parsed.sheets) && parsed.sheets.length > 0) {
          setMasterPlanSheets(parsed.sheets);
          setSelectedSheetId(parsed.selectedSheetId || parsed.sheets[0].id);
          return;
        }
      }

      const storedLegacy = localStorage.getItem('master_plan_sheet_v1');
      if (storedLegacy) {
        const legacy = JSON.parse(storedLegacy) as {
          columns?: MasterPlanColumn[];
          rows?: MasterPlanRow[];
        };
        if (Array.isArray(legacy.columns) && Array.isArray(legacy.rows)) {
          const migratedSheet: MasterPlanSheet = {
            id: 'sheet_migrated',
            name: 'MASTER PLAN',
            columns: legacy.columns,
            rows: legacy.rows,
          };
          setMasterPlanSheets([migratedSheet]);
          setSelectedSheetId(migratedSheet.id);
          return;
        }
      }
    } catch {
      // ignore
    }

    const defaultColumns = createDefaultColumns();
    const emptyCells = createEmptyRowCells(defaultColumns);
    const defaultSheet: MasterPlanSheet = {
      id: 'sheet_default',
      name: 'MODEL',
      columns: defaultColumns,
      rows: [
        { id: 'row_1', cells: { ...emptyCells } },
        { id: 'row_2', cells: { ...emptyCells } },
        { id: 'row_3', cells: { ...emptyCells } },
      ],
    };
    setMasterPlanSheets([defaultSheet]);
    setSelectedSheetId(defaultSheet.id);
  }, []);

  useEffect(() => {
    if (masterPlanSheets.length === 0) return;
    try {
      localStorage.setItem(
        'master_plan_sheets_v1',
        JSON.stringify({ sheets: masterPlanSheets, selectedSheetId })
      );
    } catch {
      // ignore
    }
  }, [masterPlanSheets, selectedSheetId]);

  const selectedSheet = masterPlanSheets.find(s => s.id === selectedSheetId) || null;

  const addMasterPlanRow = () => {
    if (!selectedSheet) return;
    const emptyCells = createEmptyRowCells(selectedSheet.columns);
    const newRow: MasterPlanRow = {
      id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      cells: emptyCells,
    };
    setMasterPlanSheets(prev =>
      prev.map(sheet =>
        sheet.id === selectedSheet.id
          ? { ...sheet, rows: [...sheet.rows, newRow] }
          : sheet
      )
    );
  };

  const addMasterPlanColumn = () => {
    if (!selectedSheet) return;
    const newId = `col_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const nextCol: MasterPlanColumn = {
      id: newId,
      name: `COL ${selectedSheet.columns.length + 1}`,
      type: 'text',
    };
    setMasterPlanSheets(prev =>
      prev.map(sheet => {
        if (sheet.id !== selectedSheet.id) return sheet;
        return {
          ...sheet,
          columns: [...sheet.columns, nextCol],
          rows: sheet.rows.map(row => ({
            ...row,
            cells: {
              ...row.cells,
              [newId]: '',
            },
          })),
        };
      })
    );
  };

  const updateMasterPlanColumnName = (colId: string, name: string) => {
    if (!selectedSheet) return;
    setMasterPlanSheets(prev =>
      prev.map(sheet =>
        sheet.id === selectedSheet.id
          ? {
              ...sheet,
              columns: sheet.columns.map(col => (col.id === colId ? { ...col, name } : col)),
            }
          : sheet
      )
    );
  };

  const updateMasterPlanCell = (rowId: string, colId: string, value: string) => {
    if (!selectedSheet) return;
    setMasterPlanSheets(prev =>
      prev.map(sheet => {
        if (sheet.id !== selectedSheet.id) return sheet;
        return {
          ...sheet,
          rows: sheet.rows.map(row =>
            row.id === rowId
              ? {
                  ...row,
                  cells: {
                    ...row.cells,
                    [colId]: value,
                  },
                }
              : row
          ),
        };
      })
    );
  };

  const openCreateSheetModal = () => {
    setNewSheetName('');
    setIsCreateSheetModalOpen(true);
  };

  const openSheetTable = (sheetId: string) => {
    setSelectedSheetId(sheetId);
    setIsSheetTableModalOpen(true);
  };

  const createSheet = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSheetName.trim();
    if (!name) return;

    const columns = createDefaultColumns();
    const emptyCells = createEmptyRowCells(columns);
    const newSheet: MasterPlanSheet = {
      id: `sheet_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name,
      columns,
      rows: [
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
        { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: { ...emptyCells } },
      ],
    };

    setMasterPlanSheets(prev => [...prev, newSheet]);
    setSelectedSheetId(newSheet.id);
    setIsCreateSheetModalOpen(false);
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
          {masterPlanSheets.map(sheet => (
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

        {isSheetTableModalOpen && selectedSheet && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">📋 {selectedSheet.name}</h2>
                  <button
                    onClick={() => setIsSheetTableModalOpen(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4 flex gap-3">
                  <button
                    onClick={addMasterPlanRow}
                    className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
                  >
                    ➕ เพิ่มแถว
                  </button>
                  <button
                    onClick={addMasterPlanColumn}
                    className="px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors shadow-lg"
                  >
                    ➕ เพิ่มคอลัมน์
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-800 border-b border-gray-700">
                        <th className="sticky left-0 bg-gray-800 z-20 px-3 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 w-14">
                          #
                        </th>
                        {(selectedSheet.columns || []).map(col => (
                          <th
                            key={col.id}
                            className="px-2 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 min-w-[180px]"
                          >
                            <input
                              value={col.name}
                              onChange={e => updateMasterPlanColumnName(col.id, e.target.value)}
                              className="w-full bg-transparent text-gray-100 focus:outline-none"
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedSheet.rows || []).map((row, rowIndex) => (
                        <tr
                          key={row.id}
                          className={
                            rowIndex % 2 === 0
                              ? 'bg-gray-900/60 border-b border-gray-800'
                              : 'bg-gray-900 border-b border-gray-800'
                          }
                        >
                          <td className="sticky left-0 bg-gray-900 z-10 px-3 py-2 text-xs text-gray-400 border-r border-gray-800 w-14">
                            {rowIndex + 1}
                          </td>
                          {(selectedSheet.columns || []).map(col => (
                            <td key={col.id} className="px-2 py-2 border-r border-gray-800 align-top">
                              {col.type === 'textarea' ? (
                                <textarea
                                  value={row.cells[col.id] ?? ''}
                                  onChange={e => updateMasterPlanCell(row.id, col.id, e.target.value)}
                                  rows={2}
                                  className="w-full min-w-[180px] bg-transparent text-sm text-gray-100 focus:outline-none resize-none"
                                />
                              ) : (
                                <input
                                  value={row.cells[col.id] ?? ''}
                                  onChange={e => updateMasterPlanCell(row.id, col.id, e.target.value)}
                                  className="w-full min-w-[180px] bg-transparent text-sm text-gray-100 focus:outline-none"
                                />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {(selectedSheet.rows || []).length === 0 && (
                        <tr>
                          <td
                            colSpan={(selectedSheet.columns || []).length + 1}
                            className="px-6 py-10 text-center text-gray-400"
                          >
                            ยังไม่มีข้อมูล
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

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
