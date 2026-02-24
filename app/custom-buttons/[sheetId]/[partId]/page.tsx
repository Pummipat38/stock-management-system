'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type MergedCell = {
  id: string;
  rowId: string;
  colId: string;
  rowSpan: number;
  colSpan: number;
};

interface MasterPlanPart {
  id: string;
  name: string;
  columns: MasterPlanColumn[];
  rows: MasterPlanRow[];
  merges?: MergedCell[];
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
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');

  const isMasterPlanSheet = (sheet: { name: string }) => {
    const normalized = (sheet.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized === 'master plan' || normalized === 'masterplan';
  };

  const isDescriptionColumn = (col: { id: string; name: string }) => {
    if (col.id === 'col_desc' || col.id === 'col_desc2') return true;
    const normalized = (col.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return normalized === 'description';
  };

  const isBaseColumnId = (id: string) =>
    id === 'col_desc' ||
    id === 'col_desc2' ||
    id === 'col_meeting' ||
    id === 'col_start' ||
    id === 'col_finish';

  const isHiddenColumnId = (id: string) => id === 'col_status' || id === 'col_remark';

  const isTimelineColumnId = (id: string) => {
    const m = /^col_extra_(\d+)$/.exec(id);
    if (!m) return false;
    const n = Number(m[1]);
    return Number.isFinite(n) && n >= 1 && n <= 96;
  };

  const getColumnWidthPx = (colId: string) => {
    if (colId === 'col_desc' || colId === 'col_desc2') return 150;
    if (colId === 'col_meeting') return 120;
    if (colId === 'col_start' || colId === 'col_finish') return 100;
    return 14;
  };

  const timelineStart = { year: 2025, monthIndex: 0 };
  const monthLabel = (monthIndex: number) =>
    ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC'][monthIndex] || '';

  const getRequiredColumns = (): MasterPlanColumn[] => [
    { id: 'col_desc', name: 'DESCRIPTION', type: 'textarea' },
    { id: 'col_desc2', name: 'DESCRIPTION', type: 'textarea' },
    { id: 'col_meeting', name: 'MEETING', type: 'textarea' },
    { id: 'col_start', name: 'START', type: 'textarea' },
    { id: 'col_finish', name: 'FINISH', type: 'textarea' },
    ...Array.from({ length: 96 }, (_, i) => ({
      id: `col_extra_${i + 1}`,
      name: `COL ${i + 1}`,
      type: 'text' as const,
    })),
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
      const insertIndex = descIndex >= 0 ? descIndex + 1 : 0;
      nextColumns = [
        ...nextColumns.slice(0, insertIndex),
        { id: 'col_desc2', name: 'DESCRIPTION', type: 'textarea' },
        ...nextColumns.slice(insertIndex),
      ];
    }

    // Remove col_doc if exists (since we're replacing it with DESCRIPTION columns)
    nextColumns = nextColumns.filter(c => c.id !== 'col_doc');

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

  const visibleColumns = useMemo(() => {
    if (!part) return [] as MasterPlanColumn[];
    return part.columns.filter(c => {
      if (isHiddenColumnId(c.id)) return false;
      return isBaseColumnId(c.id) || isTimelineColumnId(c.id);
    });
  }, [part]);

  const timelineColumns = useMemo(() => {
    return visibleColumns.filter(c => isTimelineColumnId(c.id));
  }, [visibleColumns]);

  const baseColumns = useMemo(() => {
    return visibleColumns.filter(c => isBaseColumnId(c.id));
  }, [visibleColumns]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const didAutoScrollRef = useRef(false);

  useEffect(() => {
    if (!part) return;
    if (didAutoScrollRef.current) return;
    if (!scrollRef.current) return;
    if (timelineColumns.length === 0) return;

    const baseWidth = baseColumns.reduce((sum, c) => sum + getColumnWidthPx(c.id), 0);

    scrollRef.current.scrollLeft = Math.max(0, baseWidth - 60);
    didAutoScrollRef.current = true;
  }, [part, baseColumns, timelineColumns.length]);

  const colGroupNodes = useMemo(() => {
    const nodes: React.ReactNode[] = [];

    nodes.push(<col key="cg_no" style={{ width: 56 }} />);
    for (const col of visibleColumns) {
      nodes.push(
        <col
          key={`cg_${col.id}`}
          style={{ width: isBaseColumnId(col.id) ? getColumnWidthPx(col.id) : 14 }}
        />
      );
    }

    return nodes;
  }, [visibleColumns]);

  const timelineMeta = useMemo(() => {
    if (!part || timelineColumns.length === 0) {
      return {
        yearGroups: [] as { label: string; span: number }[],
        monthGroups: [] as { label: string; span: number }[],
        weeks: [] as number[],
      };
    }

    const labels = timelineColumns.map((_, idx) => {
      const monthOffset = Math.floor(idx / 4);
      const week = (idx % 4) + 1;
      const absoluteMonth = timelineStart.monthIndex + monthOffset;
      const year = timelineStart.year + Math.floor(absoluteMonth / 12);
      const monthIndex = ((absoluteMonth % 12) + 12) % 12;

      return {
        year: year >= 2025 && year <= 2026 ? String(year) : '',
        monthKey: `${year}-${monthIndex}`,
        monthLabel: monthLabel(monthIndex),
        week,
      };
    });

    const yearGroups: { label: string; span: number }[] = [];
    for (const l of labels) {
      const last = yearGroups[yearGroups.length - 1];
      if (last && last.label === l.year) last.span += 1;
      else yearGroups.push({ label: l.year, span: 1 });
    }

    const monthGroups: { label: string; span: number }[] = [];
    for (const l of labels) {
      const last = monthGroups[monthGroups.length - 1];
      const label = l.monthLabel;
      const key = l.monthKey;
      if (last && (last as any).key === key) {
        last.span += 1;
      } else {
        const next = { label, span: 1 } as { label: string; span: number } & { key: string };
        next.key = key;
        monthGroups.push(next);
      }
    }

    const weeks = labels.map(l => l.week);
    return { yearGroups, monthGroups: monthGroups.map(({ label, span }) => ({ label, span })), weeks };
  }, [part, timelineColumns]);

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

  const visibleColIndexById = useMemo(() => {
    const m = new Map<string, number>();
    visibleColumns.forEach((c, i) => m.set(c.id, i));
    return m;
  }, [visibleColumns]);

  const rowIndexById = useMemo(() => {
    const m = new Map<string, number>();
    (part?.rows || []).forEach((r, i) => m.set(r.id, i));
    return m;
  }, [part?.rows]);

  const merges = useMemo(() => (part?.merges ? part.merges : []), [part?.merges]);

  const mergeIndex = useMemo(() => {
    const originByKey = new Map<string, MergedCell>();
    const covered = new Set<string>();

    for (const mg of merges) {
      const rowIdx = rowIndexById.get(mg.rowId);
      const colIdx = visibleColIndexById.get(mg.colId);
      if (rowIdx === undefined || colIdx === undefined) continue;
      if (mg.rowSpan < 1 || mg.colSpan < 1) continue;

      const originKey = `${mg.rowId}|${mg.colId}`;
      originByKey.set(originKey, mg);

      for (let dr = 0; dr < mg.rowSpan; dr += 1) {
        for (let dc = 0; dc < mg.colSpan; dc += 1) {
          if (dr === 0 && dc === 0) continue;
          const r = part?.rows?.[rowIdx + dr];
          const c = visibleColumns[colIdx + dc];
          if (!r || !c) continue;
          covered.add(`${r.id}|${c.id}`);
        }
      }
    }

    return { originByKey, covered };
  }, [visibleColIndexById, visibleColumns, merges, part?.rows, rowIndexById]);

  const selectedKey = selectedCell ? `${selectedCell.rowId}|${selectedCell.colId}` : null;
  const selectedMerge = selectedKey ? mergeIndex.originByKey.get(selectedKey) : undefined;
  const canMergeSelected =
    isEditMode &&
    !!selectedCell &&
    !mergeIndex.covered.has(`${selectedCell.rowId}|${selectedCell.colId}`);

  const mergeRight = () => {
    if (!part) return;
    if (!canMergeSelected) return;
    if (!selectedCell) return;

    const rowIdx = rowIndexById.get(selectedCell.rowId);
    const colIdx = visibleColIndexById.get(selectedCell.colId);
    if (rowIdx === undefined || colIdx === undefined) return;

    const currentRowSpan = selectedMerge?.rowSpan ?? 1;
    const currentColSpan = selectedMerge?.colSpan ?? 1;
    const targetColIdx = colIdx + currentColSpan;
    if (targetColIdx >= visibleColumns.length) return;

    for (let dr = 0; dr < currentRowSpan; dr += 1) {
      const r = part.rows[rowIdx + dr];
      const c = visibleColumns[targetColIdx];
      if (!r || !c) return;
      const key = `${r.id}|${c.id}`;
      if (mergeIndex.covered.has(key)) return;
      if (mergeIndex.originByKey.has(key)) return;
    }

    const next: MergedCell = selectedMerge
      ? { ...selectedMerge, colSpan: currentColSpan + 1 }
      : {
          id: `merge_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          rowId: selectedCell.rowId,
          colId: selectedCell.colId,
          rowSpan: 1,
          colSpan: 2,
        };

    const targetColId = visibleColumns[targetColIdx].id;
    updatePart(prev => {
      const prevMerges = prev.merges ? prev.merges : [];
      const nextMerges = selectedMerge
        ? prevMerges.map(m => (m.id === selectedMerge.id ? next : m))
        : [...prevMerges, next];

      return {
        ...prev,
        merges: nextMerges,
        rows: prev.rows.map((r, i) => {
          if (i < rowIdx || i >= rowIdx + currentRowSpan) return r;
          return {
            ...r,
            cells: {
              ...r.cells,
              [targetColId]: '',
            },
          };
        }),
      };
    });
  };

  const mergeDown = () => {
    if (!part) return;
    if (!canMergeSelected) return;
    if (!selectedCell) return;

    const rowIdx = rowIndexById.get(selectedCell.rowId);
    const colIdx = visibleColIndexById.get(selectedCell.colId);
    if (rowIdx === undefined || colIdx === undefined) return;

    const currentRowSpan = selectedMerge?.rowSpan ?? 1;
    const currentColSpan = selectedMerge?.colSpan ?? 1;
    const targetRowIdx = rowIdx + currentRowSpan;
    if (targetRowIdx >= part.rows.length) return;

    for (let dc = 0; dc < currentColSpan; dc += 1) {
      const r = part.rows[targetRowIdx];
      const c = visibleColumns[colIdx + dc];
      if (!r || !c) return;
      const key = `${r.id}|${c.id}`;
      if (mergeIndex.covered.has(key)) return;
      if (mergeIndex.originByKey.has(key)) return;
    }

    const next: MergedCell = selectedMerge
      ? { ...selectedMerge, rowSpan: currentRowSpan + 1 }
      : {
          id: `merge_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          rowId: selectedCell.rowId,
          colId: selectedCell.colId,
          rowSpan: 2,
          colSpan: 1,
        };

    updatePart(prev => {
      const prevMerges = prev.merges ? prev.merges : [];
      const nextMerges = selectedMerge
        ? prevMerges.map(m => (m.id === selectedMerge.id ? next : m))
        : [...prevMerges, next];

      const targetRowId = prev.rows[targetRowIdx]?.id;
      if (!targetRowId) return { ...prev, merges: nextMerges };

      const clearCols = baseColumns.slice(colIdx, colIdx + currentColSpan).map(c => c.id);
      return {
        ...prev,
        merges: nextMerges,
        rows: prev.rows.map(r => {
          if (r.id !== targetRowId) return r;
          const nextCells = { ...r.cells };
          for (const cId of clearCols) nextCells[cId] = '';
          return { ...r, cells: nextCells };
        }),
      };
    });
  };

  const unmerge = () => {
    if (!part) return;
    if (!selectedMerge) return;
    updatePart(prev => ({
      ...prev,
      merges: (prev.merges || []).filter(m => m.id !== selectedMerge.id),
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white p-2 relative">
      <div className="w-full max-w-none">
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
                type="button"
                onClick={mergeRight}
                disabled={!canMergeSelected}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                MERGE ➡️
              </button>
              <button
                type="button"
                onClick={mergeDown}
                disabled={!canMergeSelected}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                MERGE ⬇️
              </button>
              <button
                type="button"
                onClick={unmerge}
                disabled={!isEditMode || !selectedMerge}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                UNMERGE
              </button>
              <button
                onClick={addColumn}
                disabled={!isEditMode}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                ➕ เพิ่มคอลัมน์
              </button>
              <div className="flex items-center gap-1 border-l border-gray-600 pl-4">
                <span className="text-xs text-gray-400 mr-2">จัดแนว:</span>
                <button
                  onClick={() => setTextAlign('left')}
                  className={`px-3 py-3 rounded-lg font-semibold transition-colors shadow-lg ${
                    textAlign === 'left'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  ◀ ซ้าย
                </button>
                <button
                  onClick={() => setTextAlign('center')}
                  className={`px-3 py-3 rounded-lg font-semibold transition-colors shadow-lg ${
                    textAlign === 'center'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  ■ กลาง
                </button>
                <button
                  onClick={() => setTextAlign('right')}
                  className={`px-3 py-3 rounded-lg font-semibold transition-colors shadow-lg ${
                    textAlign === 'right'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  ▶ ขวา
                </button>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
              <div ref={scrollRef} className="overflow-auto max-h-[calc(100vh-260px)]">
                {timelineColumns.length > 0 && (
                  <table className="border-collapse w-max min-w-full table-fixed">
                    <colgroup>{colGroupNodes}</colgroup>
                    <thead>
                      <tr className="bg-gray-800 border-b border-gray-700">
                        <th
                          rowSpan={3}
                          className="sticky left-0 bg-gray-800 z-30 px-3 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 w-14"
                        />
                        <th colSpan={baseColumns.length} className="px-2 py-1 text-xs font-semibold text-gray-200 border-r border-gray-700" />
                        {timelineMeta.yearGroups.map((g, idx) => (
                          <th
                            key={`year_${idx}_${g.label}`}
                            colSpan={g.span}
                            className="px-1 py-0.5 text-[10px] font-semibold text-gray-100 border-r border-gray-700 text-center leading-none"
                          >
                            {g.label}
                          </th>
                        ))}
                      </tr>

                      <tr className="bg-gray-800 border-b border-gray-700">
                        <th colSpan={baseColumns.length} className="px-2 py-1 text-xs font-semibold text-gray-200 border-r border-gray-700" />
                        {timelineMeta.monthGroups.map((g, idx) => (
                          <th
                            key={`month_${idx}_${g.label}`}
                            colSpan={g.span}
                            className="px-1 py-0.5 text-[10px] font-semibold text-gray-100 border-r border-gray-700 text-center leading-none"
                          >
                            {g.label}
                          </th>
                        ))}
                      </tr>

                      <tr className="bg-gray-800 border-b border-gray-700">
                        <th colSpan={baseColumns.length} className="px-2 py-1 text-xs font-semibold text-gray-200 border-r border-gray-700" />
                        {timelineMeta.weeks.map((w, idx) => (
                          <th
                            key={`week_${idx}_${w}`}
                            className="px-0 py-0.5 text-[10px] font-semibold text-gray-100 border-r border-gray-700 text-center w-[14px] min-w-[14px] max-w-[14px] leading-none"
                          >
                            {w}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 3 }, (_, rowIdx) => (
                        <tr key={`month_big_${rowIdx}`} className="bg-gray-900 border-b border-gray-800">
                          <td className="sticky left-0 bg-gray-900 z-10 px-3 py-2 border-r border-gray-800 w-14" />
                          <td colSpan={baseColumns.length} className="px-2 py-2 border-r border-gray-800" />
                          {timelineMeta.monthGroups.map((g, idx) => (
                            <td
                              key={`month_big_cell_${rowIdx}_${idx}`}
                              colSpan={g.span}
                              className="px-0 py-3 border-r border-gray-800"
                            />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {timelineColumns.length > 0 && <div className="h-3" />}

                <table className="border-collapse w-max min-w-full table-fixed">
                  <colgroup>{colGroupNodes}</colgroup>
                  <thead>
                    <tr className="bg-gray-800 border-b border-gray-700">
                      <th className="sticky left-0 bg-gray-800 z-20 px-3 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 w-14 text-center align-middle">
                        NO.
                      </th>
                      <>
                        {/* DESCRIPTION (2 separate columns) */}
                        <th className="px-2 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 text-center align-middle">
                          DESCRIPTION
                        </th>
                        <th className="px-2 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 text-center align-middle">
                          DESCRIPTION
                        </th>
                        {/* MONTH WEEK */}
                        <th className="px-2 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 text-center align-middle">
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className="text-xs font-semibold text-gray-100">MONTH</span>
                            <span className="text-xs font-semibold text-gray-100">WEEK</span>
                          </div>
                        </th>
                        {/* START */}
                        <th className="px-2 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 text-center align-middle">
                          START
                        </th>
                        {/* FINISH */}
                        <th className="px-2 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 text-center align-middle">
                          FINISH
                        </th>
                        {/* Timeline columns - individual cells */}
                        {timelineColumns.map(col => (
                          <th
                            key={col.id}
                            className="px-1 py-0.5 text-[10px] font-semibold text-gray-100 border-r border-gray-700 text-center leading-none align-middle"
                          >
                            {col.name}
                          </th>
                        ))}
                      </>
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
                        <td className="sticky left-0 bg-gray-900 z-10 px-3 py-2 text-xs text-gray-400 border-r border-gray-800 w-14 text-center align-middle">
                          {rowIndex + 1}
                        </td>
                        <>
                          {/* DESCRIPTION (2 separate columns) */}
                          <td
                            className="px-2 py-2 border-r border-gray-800 align-middle text-center"
                            onClick={() => setSelectedCell({ rowId: row.id, colId: 'col_desc' })}
                          >
                            {isEditMode ? (
                              <textarea
                                value={row.cells['col_desc'] ?? ''}
                                disabled={!isEditMode}
                                onFocus={() => setSelectedCell({ rowId: row.id, colId: 'col_desc' })}
                                onChange={e => updateCell(row.id, 'col_desc', e.target.value)}
                                rows={2}
                                className={`w-full bg-transparent text-sm text-gray-100 focus:outline-none resize-none disabled:text-gray-300 disabled:cursor-not-allowed ${
                                  textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
                                }`}
                              />
                            ) : (
                              <div className={`flex h-full min-h-[2rem] text-sm text-gray-100 items-center ${
                                textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'
                              }`}>
                                {row.cells['col_desc']}
                              </div>
                            )}
                          </td>
                          <td
                            className="px-2 py-2 border-r border-gray-800 align-middle text-center"
                            onClick={() => setSelectedCell({ rowId: row.id, colId: 'col_desc2' })}
                          >
                            {isEditMode ? (
                              <textarea
                                value={row.cells['col_desc2'] ?? ''}
                                disabled={!isEditMode}
                                onFocus={() => setSelectedCell({ rowId: row.id, colId: 'col_desc2' })}
                                onChange={e => updateCell(row.id, 'col_desc2', e.target.value)}
                                rows={2}
                                className={`w-full bg-transparent text-sm text-gray-100 focus:outline-none resize-none disabled:text-gray-300 disabled:cursor-not-allowed ${
                                  textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
                                }`}
                              />
                            ) : (
                              <div className={`flex h-full min-h-[2rem] text-sm text-gray-100 items-center ${
                                textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'
                              }`}>
                                {row.cells['col_desc2']}
                              </div>
                            )}
                          </td>
                          {/* MONTH WEEK */}
                          <td
                            className="px-2 py-2 border-r border-gray-800 align-middle text-center"
                            onClick={() => setSelectedCell({ rowId: row.id, colId: 'col_meeting' })}
                          >
                            {isEditMode ? (
                              <textarea
                                value={row.cells['col_meeting'] ?? ''}
                                disabled={!isEditMode}
                                onFocus={() => setSelectedCell({ rowId: row.id, colId: 'col_meeting' })}
                                onChange={e => updateCell(row.id, 'col_meeting', e.target.value)}
                                rows={2}
                                className={`w-full bg-transparent text-sm text-gray-100 focus:outline-none resize-none disabled:text-gray-300 disabled:cursor-not-allowed ${
                                  textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
                                }`}
                              />
                            ) : (
                              <div className={`flex h-full min-h-[2rem] text-sm text-gray-100 items-center ${
                                textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'
                              }`}>
                                {row.cells['col_meeting']}
                              </div>
                            )}
                          </td>
                          {/* START */}
                          <td
                            className="px-2 py-2 border-r border-gray-800 align-middle text-center"
                            onClick={() => setSelectedCell({ rowId: row.id, colId: 'col_start' })}
                          >
                            {isEditMode ? (
                              <textarea
                                value={row.cells['col_start'] ?? ''}
                                disabled={!isEditMode}
                                onFocus={() => setSelectedCell({ rowId: row.id, colId: 'col_start' })}
                                onChange={e => updateCell(row.id, 'col_start', e.target.value)}
                                rows={2}
                                className={`w-full bg-transparent text-sm text-gray-100 focus:outline-none resize-none disabled:text-gray-300 disabled:cursor-not-allowed ${
                                  textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
                                }`}
                              />
                            ) : (
                              <div className={`flex h-full min-h-[2rem] text-sm text-gray-100 items-center ${
                                textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'
                              }`}>
                                {row.cells['col_start']}
                              </div>
                            )}
                          </td>
                          {/* FINISH */}
                          <td
                            className="px-2 py-2 border-r border-gray-800 align-middle text-center"
                            onClick={() => setSelectedCell({ rowId: row.id, colId: 'col_finish' })}
                          >
                            {isEditMode ? (
                              <textarea
                                value={row.cells['col_finish'] ?? ''}
                                disabled={!isEditMode}
                                onFocus={() => setSelectedCell({ rowId: row.id, colId: 'col_finish' })}
                                onChange={e => updateCell(row.id, 'col_finish', e.target.value)}
                                rows={2}
                                className={`w-full bg-transparent text-sm text-gray-100 focus:outline-none resize-none disabled:text-gray-300 disabled:cursor-not-allowed ${
                                  textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
                                }`}
                              />
                            ) : (
                              <div className={`flex h-full min-h-[2rem] text-sm text-gray-100 items-center ${
                                textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'
                              }`}>
                                {row.cells['col_finish']}
                              </div>
                            )}
                          </td>
                          {/* Timeline columns - individual cells with proper merge support */}
                          {timelineColumns.map(col => {
                            const key = `${row.id}|${col.id}`;
                            if (mergeIndex.covered.has(key)) return null;
                            const mg = mergeIndex.originByKey.get(key);
                            const isSelected = selectedKey === key;
                            
                            return (
                              <td
                                key={col.id}
                                rowSpan={mg?.rowSpan}
                                colSpan={mg?.colSpan}
                                onClick={() => setSelectedCell({ rowId: row.id, colId: col.id })}
                                className={`px-2 py-1 border-r border-gray-800 align-middle text-center ${
                                  isSelected ? 'bg-white/10 outline outline-2 outline-purple-400' : ''
                                }`}
                              >
                                {isEditMode ? (
                                  <textarea
                                    value={row.cells[col.id] ?? ''}
                                    disabled={!isEditMode}
                                    onFocus={() => setSelectedCell({ rowId: row.id, colId: col.id })}
                                    onChange={e => updateCell(row.id, col.id, e.target.value)}
                                    rows={2}
                                    className={`w-full bg-transparent text-sm text-gray-100 focus:outline-none resize-none disabled:text-gray-300 disabled:cursor-not-allowed ${
                                      textAlign === 'left' ? 'text-left' : textAlign === 'right' ? 'text-right' : 'text-center'
                                    }`}
                                  />
                                ) : (
                                  <div className={`flex h-full min-h-[2rem] text-sm text-gray-100 items-center ${
                                    textAlign === 'left' ? 'justify-start' : textAlign === 'right' ? 'justify-end' : 'justify-center'
                                  }`}>
                                    {row.cells[col.id]}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </>
                      </tr>
                    ))}

                    {part.rows.length === 0 && (
                      <tr>
                        <td colSpan={(baseColumns.length + 1)} className="px-6 py-10 text-center align-middle text-gray-400">
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
