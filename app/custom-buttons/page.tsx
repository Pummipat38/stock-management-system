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

export default function CustomButtonsPage() {
  const [masterPlanColumns, setMasterPlanColumns] = useState<MasterPlanColumn[]>([]);
  const [masterPlanRows, setMasterPlanRows] = useState<MasterPlanRow[]>([]);

  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('master_plan_sheet_v1');
      if (stored) {
        const parsed = JSON.parse(stored) as {
          columns?: MasterPlanColumn[];
          rows?: MasterPlanRow[];
        };
        if (Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
          setMasterPlanColumns(parsed.columns);
          setMasterPlanRows(parsed.rows);
          return;
        }
      }
    } catch {
      // ignore
    }

    const docColId = 'col_doc';
    const defaultColumns: MasterPlanColumn[] = [
      { id: docColId, name: 'DOCUMENT', type: 'text' },
      { id: 'col_desc', name: 'DESCRIPTION', type: 'textarea' },
      { id: 'col_meeting', name: 'MEETING', type: 'text' },
      { id: 'col_start', name: 'START', type: 'text' },
      { id: 'col_finish', name: 'FINISH', type: 'text' },
      { id: 'col_status', name: 'STATUS', type: 'text' },
      { id: 'col_remark', name: 'REMARK', type: 'textarea' },
    ];

    const emptyCells = defaultColumns.reduce<Record<string, string>>((acc, col) => {
      acc[col.id] = '';
      return acc;
    }, {});

    setMasterPlanColumns(defaultColumns);
    setMasterPlanRows([
      { id: 'row_1', cells: { ...emptyCells } },
      { id: 'row_2', cells: { ...emptyCells } },
      { id: 'row_3', cells: { ...emptyCells } },
    ]);
  }, []);

  useEffect(() => {
    if (masterPlanColumns.length === 0) return;
    try {
      localStorage.setItem(
        'master_plan_sheet_v1',
        JSON.stringify({ columns: masterPlanColumns, rows: masterPlanRows })
      );
    } catch {
      // ignore
    }
  }, [masterPlanColumns, masterPlanRows]);

  const addMasterPlanRow = () => {
    const emptyCells = masterPlanColumns.reduce<Record<string, string>>((acc, col) => {
      acc[col.id] = '';
      return acc;
    }, {});
    setMasterPlanRows(prev => [
      ...prev,
      { id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`, cells: emptyCells },
    ]);
  };

  const addMasterPlanColumn = () => {
    const newId = `col_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const nextCol: MasterPlanColumn = {
      id: newId,
      name: `COL ${masterPlanColumns.length + 1}`,
      type: 'text',
    };
    setMasterPlanColumns(prev => [...prev, nextCol]);
    setMasterPlanRows(prev =>
      prev.map(row => ({
        ...row,
        cells: {
          ...row.cells,
          [newId]: '',
        },
      }))
    );
  };

  const updateMasterPlanColumnName = (colId: string, name: string) => {
    setMasterPlanColumns(prev => prev.map(col => (col.id === colId ? { ...col, name } : col)));
  };

  const updateMasterPlanCell = (rowId: string, colId: string, value: string) => {
    setMasterPlanRows(prev =>
      prev.map(row =>
        row.id === rowId
          ? {
              ...row,
              cells: {
                ...row.cells,
                [colId]: value,
              },
            }
          : row
      )
    );
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
            onClick={addMasterPlanRow}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
          >
            ➕ เพิ่มแถว
          </button>
          <button
            onClick={addMasterPlanColumn}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
          >
            ➕ เพิ่มคอลัมน์
          </button>
        </div>

        {/* Buttons Grid */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 border-b border-gray-700">
                  <th className="sticky left-0 bg-gray-800 z-20 px-3 py-2 text-xs font-semibold text-gray-200 border-r border-gray-700 w-14">
                    #
                  </th>
                  {masterPlanColumns.map(col => (
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
                {masterPlanRows.map((row, rowIndex) => (
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
                    {masterPlanColumns.map(col => (
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

                {masterPlanRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={masterPlanColumns.length + 1}
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
  );
}
