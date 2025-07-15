// types/index.ts (または該当する型定義ファイル)

// DBのM_TANTOテーブルに合わせたStaff型
export interface Staff {
  TANTO_CODE: string; // id を TANTO_CODE に変更
  TANTO_NAME: string; // name を TANTO_NAME に変更
  // department はM_TANTOになければ削除
  // department?: string; 
}

// DBのT_PLANテーブルに合わせたPlanData型
export interface PlanData {
  ID: number; // id を ID (number) に変更
  HINBAN: string; // planNumber を HINBAN に変更
  NOHIN_DATE: string; // date を NOHIN_DATE に変更
  QTY: number; // 新しく QTY を追加
  UPDATE_TANTO_CODE: string; // staffId を UPDATE_TANTO_CODE に変更
  UPDATE_TANTO_NAME: string; // staffName を UPDATE_TANTO_NAME に変更
  PLAN_STATUS: 0 | 1 | 2; // status を PLAN_STATUS に変更
  START_TANTO_CODE?: string | null; // ★追加
  START_TANTO_NAME?: string | null; // ★追加
  details: PlanDetail[];
  CREATE_DTM: string; // createdAt を CREATE_DTM に変更
  UPDATE_DTM: string; // updatedAt を UPDATE_DTM に変更
}

// DBのT_PLAN_DETAILテーブルに合わせたPlanDetail型
export interface PlanDetail {
  ID: number; // id を ID (number) に変更
  ROW_NO: number; // ★複合キーとして追加★
  HINBAN: string; // itemCode を HINBAN に変更
  ITEM_NAME: string; // itemName を ITEM_NAME に変更
  DETAIL_QTY: number; // requiredQuantity を DETAIL_QTY に変更
  READ_QTY: number; // completedQuantity を READ_QTY に変更
  ITEM_TITLE?: string; // materialTitle を ITEM_TITLE に変更
  COMMENT?: string; // comment を COMMENT に変更
  ALERT_MSG?: string; // warning を ALERT_MSG に変更
  REMARK?: string; // note を REMARK に変更
  isCompleted: boolean; // アプリケーションロジックで必要なので保持
  READ_DATA?: string; // barcode を READ_DATA に変更
}

// ScanResult はアプリケーション固有の型なので変更なし
export interface ScanResult {
  code: string;
  timestamp: Date;
  isValid: boolean;
}

// AppState もselectedPlan内のプロパティ名を変更
export interface AppState {
  currentUser: Staff | null;
  selectedPlan: PlanData | null;
  currentDetailIndex: number;
  scanResult: ScanResult | null;
}