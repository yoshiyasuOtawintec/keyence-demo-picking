import { useContext } from 'react';
// AppStateContext から AppStateContext と AppStateContextValue をインポート
import { AppStateContext, Staff, PlanData, PlanDetail, ScanResult } from '@/context/AppStateContext';

// useAppState フック (Context を利用するためのフック)
// このフックは、AppStateContext.tsx で定義された Context から値を取得します。
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    // AppStateProvider の外で useAppState が呼び出された場合にエラーをスロー
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// 以前の useAppState.ts にあった型定義は AppStateContext.tsx に移動したため、
// ここではエクスポートしません。代わりに AppStateContext.tsx からインポートします。
export type { Staff, PlanData, PlanDetail, ScanResult };
