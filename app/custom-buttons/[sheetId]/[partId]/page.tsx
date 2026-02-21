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

export default function MasterPlanPartPage() {
  const router = useRouter();
  const params = useParams<{ sheetId: string; partId: string }>();
  const sheetId = params?.sheetId;
  const partId = params?.partId;

  const [sheets, setSheets] = useState<MasterPlanSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);

  const isMasterPlanSheet = (sheet: { name: string }) => {
    const normalized = (sheet.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized === 'master plan' || normalized === 'masterplan';
  };

  const isDescriptionColumn = (col: { id: string; name: string }) => {
    if (col.id === 'col_desc' || col.id === 'col_desc2') return true;
    const normalized = (col.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized === 'description';
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

  const migrateSheetToParts = (sheet: MasterPlanSheet): { sheet: MasterPlanSheet; changed: boolean } => {
    if (Array.isArray(sheet.parts) && sheet.parts.length > 0) return { sheet, changed: false };

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

  const createEmptyRowCells = (columns: MasterPlanColumn[]) =>
    columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.id] = '';
      return acc;
    }, {});

  const upgradePartToWide = (prev: MasterPlanPart) => {
    const required = getRequiredColumns();

    const prevById = new Map(prev.columns.map(c => [c.id, c] as const));
    const prevHasDesc2 = prevById.has('col_desc2');

    let nextColumns = prev.columns;
    if (!prevHasDesc2) {
      const descIndex = nextColumns.findIndex(c => c.id === 'col_desc');
      const insertIndex = descIndex >= 0 ? descIndex + 1 : 1;
      nextColumns = [
        ...nextColumns.slice(0, insertIndex),
        { id: 'col_desc2', name: 'DESCRIPTION', type: 'textarea' },
        ...nextColumns.slice(insertIndex),
      ];
    }

    const nextById = new Set(nextColumns.map(c => c.id));
    const missingRequired = required.filter(c => !nextById.has(c.id));
    if (missingRequired.length > 0) {
      nextColumns = [...nextColumns, ...missingRequired];
    }

    const ensureCells = (row: MasterPlanRow): MasterPlanRow => {
      let nextCells: Record<string, string> | null = null;
      for (const col of nextColumns) {
        if (row.cells[col.id] === undefined) {
          if (!nextCells) nextCells = { ...row.cells };
          nextCells[col.id] = '';
        }
      }
      return nextCells ? { ...row, cells: nextCells } : row;
    };

    const nextRows = prev.rows.map(ensureCells);

    const changed =
      nextColumns.length !== prev.columns.length ||
      nextColumns.some((c, idx) => prev.columns[idx]?.id !== c.id) ||
      nextRows.some((r, idx) => r.cells !== prev.rows[idx]?.cells);

    return {
      changed,
      part: changed ? { ...prev, columns: nextColumns, rows: nextRows } : prev,
    };
  };

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
          persistSheets(nextSheets, parsed.selectedSheetId || '');
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

  const part = useMemo(() => {
    if (!sheet) return null;
    const parts = Array.isArray(sheet.parts) ? sheet.parts : [];
    return parts.find(p => p.id === partId) || null;
  }, [sheet, partId]);

  useEffect(() => {
    if (!sheetId || !partId) return;
    if (!sheet) return;
    if (!part) return;

    const upgraded = upgradePartToWide(part);
    if (!upgraded.changed) return;

    const nextSheets = sheets.map(s => {
      if (s.id !== sheetId) return s;
      const parts = Array.isArray(s.parts) ? s.parts : [];
      const nextParts = parts.map(p => (p.id === partId ? upgraded.part : p));
      return { ...s, parts: nextParts };
    });

    persistSheets(nextSheets, sheetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId, partId, sheets]);

  const updatePart = (updater: (prev: MasterPlanPart) => MasterPlanPart) => {
    if (!sheetId || !sheet || !partId || !part) return;
    const nextSheets = sheets.map(s => {
      if (s.id !== sheetId) return s;
      const parts = Array.isArray(s.parts) ? s.parts : [];
      const nextParts = parts.map(p => (p.id === partId ? updater(p) : p));
      return { ...s, parts: nextParts };
    });
    persistSheets(nextSheets, sheetId);
  };

  const addRow = () => {
    if (!part) return;
    if (!isEditMode) return;
    const emptyCells = createEmptyRowCells(part.columns);
    const newRow: MasterPlanRow = {
      id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      cells: emptyCells,
    };

    updatePart(prev => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const addColumn = () => {
    if (!part) return;
    if (!isEditMode) return;
    const newId = `col_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const nextCol: MasterPlanColumn = {
      id: newId,
      name: `COL ${part.columns.length + 1}`,
      type: 'text',
    };

    updatePart(prev => ({
      ...prev,
      columns: [...prev.columns, nextCol],
      rows: prev.rows.map(r => ({
        ...r,
        cells: {
          ...r.cells,
          [newId]: '',
        },
      })),
    }));
  };

  const updateColumnName = (colId: string, name: string) => {
    if (!isEditMode) return;
    updatePart(prev => ({
      ...prev,
      columns: prev.columns.map(c => (c.id === colId ? { ...c, name } : c)),
    }));
  };

  const updateCell = (rowId: string, colId: string, value: string) => {
    if (!isEditMode) return;
    updatePart(prev => ({
      ...prev,
      rows: prev.rows.map(r =>
        r.id === rowId
          ? {
              ...r,
              cells: {
                ...r.cells,
                [colId]: value,
              },
            }
          : r
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 relative">
          <h1 className="text-3xl font-bold text-white mb-2">{sheet ? sheet.name : 'MODEL'} / {part ? part.name : 'PART'}</h1>
          <p className="text-gray-400">ตารางข้อมูล</p>

          <div className="absolute top-0 right-0">
            <button
              onClick={() => (sheetId ? router.push(`/custom-buttons/${sheetId}`) : router.push('/custom-buttons'))}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-12 py-6 rounded-lg text-2xl font-bold shadow-lg transition-all duration-200 border border-white/30 hover:border-white/50 hover:shadow-xl"
            >
              ← BACK
            </button>
          </div>
        </div>

        {(!sheet || !part) && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 text-gray-300">
            ไม่พบข้อมูล
          </div>
        )}

        {sheet && part && (
          <>
            <div className="mb-6 flex gap-4">
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
              <button
                onClick={addRow}
                disabled={!isEditMode}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                ➕ เพิ่มแถว
              </button>
              <button
                onClick={addColumn}
                disabled={!isEditMode}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                ➕ เพิ่มคอลัมน์
              </button>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-800 border-b border-gray-700">
                      <th className="sticky left-0 bg-gray-800 z-20 px-3 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 w-14">
                        NO.
                      </th>
                      {(() => {
                        const nodes: React.ReactNode[] = [];
                        for (let i = 0; i < part.columns.length; i += 1) {
                          const col = part.columns[i];
                          const next = part.columns[i + 1];
                          if (isDescriptionColumn(col) && next && isDescriptionColumn(next)) {
                            nodes.push(
                              <th
                                key={`desc_group_${col.id}_${next.id}`}
                                colSpan={2}
                                className="px-2 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 min-w-[360px]"
                              >
                                DESCRIPTION
                              </th>
                            );
                            i += 1;
                            continue;
                          }

                          nodes.push(
                            <th
                              key={col.id}
                              className="px-2 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 min-w-[180px]"
                            >
                              <input
                                value={col.name}
                                disabled={!isEditMode}
                                onChange={e => updateColumnName(col.id, e.target.value)}
                                className="w-full bg-transparent text-gray-100 focus:outline-none disabled:text-gray-300 disabled:cursor-not-allowed"
                              />
                            </th>
                          );
                        }
                        return nodes;
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {part.rows.map((row, rowIndex) => (
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
                        {part.columns.map(col => (
                          <td key={col.id} className="px-2 py-2 border-r border-gray-800 align-top">
                            {col.type === 'textarea' ? (
                              <textarea
                                value={row.cells[col.id] ?? ''}
                                disabled={!isEditMode}
                                onChange={e => updateCell(row.id, col.id, e.target.value)}
                                rows={2}
                                className="w-full min-w-[180px] bg-transparent text-sm text-gray-100 focus:outline-none resize-none disabled:text-gray-300 disabled:cursor-not-allowed"
                              />
                            ) : (
                              <input
                                value={row.cells[col.id] ?? ''}
                                disabled={!isEditMode}
                                onChange={e => updateCell(row.id, col.id, e.target.value)}
                                className="w-full min-w-[180px] bg-transparent text-sm text-gray-100 focus:outline-none disabled:text-gray-300 disabled:cursor-not-allowed"
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}

                    {part.rows.length === 0 && (
                      <tr>
                        <td colSpan={part.columns.length + 1} className="px-6 py-10 text-center text-gray-400">
                          ยังไม่มีข้อมูล
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
