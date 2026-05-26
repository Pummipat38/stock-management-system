'use client';

import { useEffect } from 'react';

export default function ClearMasterPlanStorage() {
  useEffect(() => {
    try {
      localStorage.removeItem('master_plan_sheets_v1');
      localStorage.removeItem('master_plan_sheet_v1');
    } catch {
      // ignore
    }
  }, []);

  return null;
}
