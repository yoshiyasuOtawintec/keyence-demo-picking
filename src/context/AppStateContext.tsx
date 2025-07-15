import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import axios from 'axios';

// 型定義
export type Staff = {
  TANTO_CODE: string;
  TANTO_NAME: string;
};

export type PlanDetail = {
  ID: number;
  ROW_NO: number;
  HINSYU?: string;
  ITEM_TITLE?: string;
  ITEM_NAME: string;
  TANA_NO?: string;
  READ_DATA?: string;
  QTY_TYPE?: number;
  DETAIL_QTY: number;
  READ_QTY: number;
  isCompleted?: boolean;
  COMMENT?: string;
  ALERT_MSG?: string;
  REMARK?: string;
};

export type PlanData = {
  ID: number;
  NOHIN_DATE: string;
  HINBAN: string;
  QTY: number;
  PLAN_STATUS: 0 | 1 | 2;
  START_DTM: string | null;
  END_DTM: string | null;
  CSV_FILE: string | null;
  CREATE_DTM: string;
  CREATE_TANTO_CODE: string;
  CREATE_TANTO_NAME: string;
  UPDATE_DTM: string;
  UPDATE_TANTO_CODE: string;
  UPDATE_TANTO_NAME: string;
  START_TANTO_CODE: string | null;
  START_TANTO_NAME: string | null;
  details: PlanDetail[];
};

export type ScanResult = {
  mStringData?: string;
};

// AppStateContext の値の型定義
export interface AppStateContextValue {
  currentUser: Staff | null;
  selectedPlan: PlanData | null;
  currentDetailIndex: number;
  scanResult: ScanResult | null;
  isLoaded: boolean;

  setCurrentUser: (user: Staff | null) => void;
  setSelectedPlan: (plan: PlanData | null) => void;
  setCurrentDetailIndex: (index: number) => void;
  setScanResult: (result: ScanResult | null) => void;
  updatePlanDetailQuantity: (detailId: number, rowNo: number, scannedBarcode: string) => Promise<boolean>;
  clearAppState: () => void;
}

// Context の作成
export const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

// localStorage のキー
const LOCAL_STORAGE_KEY_CURRENT_USER = 'picking-app-current-user';
const LOCAL_STORAGE_KEY_SELECTED_PLAN = 'picking-app-selected-plan';

// APIのベースURLを環境変数から取得
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  // ★修正1: localStorage から初期状態を読み込む
  const [currentUser, setCurrentUserState] = useState<Staff | null>(() => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_USER);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse currentUser from localStorage", e);
      return null;
    }
  });

  const [selectedPlan, setSelectedPlanState] = useState<PlanData | null>(() => {
    try {
      const storedPlan = localStorage.getItem(LOCAL_STORAGE_KEY_SELECTED_PLAN);
      return storedPlan ? JSON.parse(storedPlan) : null;
    } catch (e) {
      console.error("Failed to parse selectedPlan from localStorage", e);
      return null;
    }
  });
  
  const [currentDetailIndex, setCurrentDetailIndexState] = useState<number>(0);
  const [scanResult, setScanResultState] = useState<ScanResult | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // ★修正2: currentUser が変更されたら localStorage に保存
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      console.log('AppStateContext: localStorage に currentUser を保存しました:', currentUser);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
      console.log('AppStateContext: localStorage から currentUser を削除しました。');
    }
    // selectedPlan の状態もここで同期的に保存することで、currentUser と selectedPlan の整合性を保つ
    // ただし、selectedPlan の変更は setSelectedPlan で別途トリガーされるため、ここでは不要な場合も。
    // 今回は setSelectedPlan が localStorage 保存を担うため、ここでは省略。
  }, [currentUser]);

  // ★修正3: selectedPlan が変更されたら localStorage に保存
  useEffect(() => {
    if (selectedPlan) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SELECTED_PLAN, JSON.stringify(selectedPlan));
      console.log('AppStateContext: localStorage に selectedPlan を保存しました:', selectedPlan);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_SELECTED_PLAN);
      console.log('AppStateContext: localStorage から selectedPlan を削除しました。');
    }
  }, [selectedPlan]);

  // 初期ロード完了フラグの設定
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 状態変更時に localStorage に保存するラッパー関数
  const setCurrentUser = useCallback((user: Staff | null) => {
    setCurrentUserState(user);
    // currentUser の変更は上記の useEffect で localStorage に保存される
  }, []); // selectedPlan は依存配列から削除。currentUser の useEffect が単独で管理。

  const setSelectedPlan = useCallback((plan: PlanData | null) => {
    setSelectedPlanState(plan);
    setCurrentDetailIndexState(0); // プランがセットされたらインデックスをリセット
    // selectedPlan の変更は上記の useEffect で localStorage に保存される
  }, []); // currentUser は依存配列から削除。selectedPlan の useEffect が単独で管理。

  const setCurrentDetailIndex = useCallback((index: number) => {
    setCurrentDetailIndexState(index);
    console.log('AppStateContext: setCurrentDetailIndex が呼び出されました。新しいインデックス:', index);
  }, []);

  const setScanResult = useCallback((result: ScanResult | null) => {
    setScanResultState(result);
    console.log('AppStateContext: setScanResult が呼び出されました。新しいスキャン結果:', result);
  }, []);

  // 明細数量更新用のアクション (各スキャン後にDBを更新)
  const updatePlanDetailQuantity = useCallback(async (detailId: number, rowNo: number, scannedBarcode: string): Promise<boolean> => {
    console.log('AppStateContext: updatePlanDetailQuantity が呼び出されました。');
    let updatedLocally = false;
    let newPlanForStateAndApi: PlanData | null = null;

    const currentPlan = selectedPlan; 

    if (!currentPlan) {
      console.warn('AppStateContext: selectedPlan が null のため、数量を更新できません。');
      return false;
    }

    const tempNewPlan = { ...currentPlan };
    const detailIndex = tempNewPlan.details.findIndex(
      d => d.ID === detailId && d.ROW_NO === rowNo
    );

    if (detailIndex !== -1) {
      const newDetails = [...tempNewPlan.details];
      const detail = { ...newDetails[detailIndex] };

      if (detail.READ_QTY < detail.DETAIL_QTY) {
        detail.READ_QTY += 1;
        detail.isCompleted = detail.READ_QTY >= detail.DETAIL_QTY;
        newDetails[detailIndex] = detail;

        tempNewPlan.details = newDetails;

        // UPDATE_DTM はフロントエンドの時刻を形式的に送る（DB側でGETDATE()利用）
        // ただし、PUTリクエストのペイロードには含める必要があるので、ISO文字列で設定
        tempNewPlan.UPDATE_DTM = new Date().toISOString(); 
        tempNewPlan.UPDATE_TANTO_CODE = currentUser?.TANTO_CODE || tempNewPlan.UPDATE_TANTO_CODE;
        tempNewPlan.UPDATE_TANTO_NAME = currentUser?.TANTO_NAME || tempNewPlan.UPDATE_TANTO_NAME;

        // ★修正4: START_DTMとSTART_TANTO_CODEの初回設定ロジック
        // PLAN_STATUSが「作業待ち」(0)の場合のみ「作業中」(1)に遷移
        if (tempNewPlan.PLAN_STATUS === 0) { 
            tempNewPlan.PLAN_STATUS = 1; 
            // START_DTMはDB側でGETDATE()を設定するため、フロントからはnullを送信
            tempNewPlan.START_DTM = null; 
            // START_TANTO_CODEはDB側で設定されるが、フロントエンドのstateにも反映するため設定
            tempNewPlan.START_TANTO_CODE = currentUser?.TANTO_CODE || null; 
            tempNewPlan.START_TANTO_NAME = currentUser?.TANTO_NAME || null; 
        }

        const allDetailsCompleted = newDetails.every(d => d.isCompleted);
        if (allDetailsCompleted) {
            tempNewPlan.PLAN_STATUS = 2; // 準備完了
            // END_DTMはDB側でGETDATE()を設定するため、フロントからはnullを送信
            tempNewPlan.END_DTM = null; 
        }
        updatedLocally = true;
        newPlanForStateAndApi = tempNewPlan;
        console.log('AppStateContext: 明細数量がローカルで更新されました。新しい計画データ:', newPlanForStateAndApi);
      } else {
        console.log('AppStateContext: 明細数量はローカルで更新されませんでした（既に完了）。');
      }
    } else {
      console.log('AppStateContext: 明細が見つかりませんでした。');
    }

    if (newPlanForStateAndApi) {
      setSelectedPlanState(newPlanForStateAndApi);
      // localStorageへの保存はsetSelectedPlanStateのuseEffectで処理される
    }

    if (updatedLocally && newPlanForStateAndApi && API_BASE_URL) {
      try {
        console.log('AppStateContext: APIへのPUTリクエスト送信中。ペイロード:', JSON.stringify(newPlanForStateAndApi, null, 2));
        // APIに送信するデータは、localStorageに保存された最新のselectedPlanStateを使用
        await axios.put(`${API_BASE_URL}/api/plans/${newPlanForStateAndApi.ID}`, newPlanForStateAndApi);
        console.log('AppStateContext: データベースが正常に更新されました。');
        return true;
      } catch (error) {
        console.error('AppStateContext: データベース更新に失敗しました:', error);
        if (axios.isAxiosError(error) && error.response) {
            console.error('API Response Status:', error.response.status);
            console.error('API Response Data:', error.response.data);
        }
        return false;
      }
    } else if (!API_BASE_URL) {
      console.error('AppStateContext: API_BASE_URLが設定されていないため、データベース更新をスキップしました。');
      return false;
    } else {
        console.log('AppStateContext: API更新条件を満たしませんでした。updatedLocally:', updatedLocally, 'newPlanForStateAndApi:', newPlanForStateAndApi);
        return updatedLocally;
    }
  }, [currentUser, selectedPlan]); // 依存配列に currentUser と selectedPlan を含める

  const clearAppState = useCallback(() => {
    console.log('AppStateContext: clearAppState が呼び出されました。');
    setCurrentUserState(null);
    setSelectedPlanState(null);
    setCurrentDetailIndexState(0);
    setScanResultState(null);
    // ★修正5: localStorage から両方のキーを削除
    localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEY_SELECTED_PLAN);
    console.log('AppStateContext: localStorage から状態を削除しました。');
  }, []);

  const contextValue = {
    currentUser,
    selectedPlan,
    currentDetailIndex,
    scanResult,
    isLoaded,
    setCurrentUser,
    setSelectedPlan,
    setCurrentDetailIndex,
    setScanResult,
    updatePlanDetailQuantity,
    clearAppState,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};