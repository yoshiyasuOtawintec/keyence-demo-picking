import React, { useState, useEffect, useMemo } from 'react'; // useCallback を削除
import { ChevronDown, ChevronUp, LogOut, Search, Calendar, RefreshCcw, XCircle } from 'lucide-react';
import HandyContainer from '../components/HandyContainer'; // components ディレクトリからインポート
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // useNavigate をインポート
import { useAppState, Staff } from '../hooks/useAppState'; // useAppState と型をインポート
// PlanData の型定義が useAppState からインポートされていることを前提としますが、
// ここに直接記述されていないため、もし必要であれば追加してください。
// 例: export type PlanData = {...};

// 型定義（元のコードにPLAN_MSGがないため追加します）
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
  PLAN_MSG: string | null; // ★追加：PLAN_MSG
  details: PlanDetail[];
};


const PlanSelectionPage: React.FC = () => {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  const [dateFilter, setDateFilter] = useState(getTodayDate());
  const [itemCodeFilter, setItemCodeFilter] = useState('');
  // 修正: hasSearched ステートを削除
  // const [hasSearched, setHasSearched] = useState(true); 
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { currentUser, setSelectedPlan, clearAppState } = useAppState();

  useEffect(() => {
    if (!currentUser) {
      console.warn("PlanSelectionPage: currentUser is missing. Redirecting to login.");
      navigate('/');
    }
  }, [currentUser, navigate]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 計画データを取得する関数 (useCallback を削除し、通常の関数として定義)
  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API_BASE_URL) {
        setError('APIベースURLが設定されていません。`.env.local` ファイルを確認してください。');
        console.error('Environment variable VITE_API_BASE_URL is not set.');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      // 関数内で直接最新のステート値を使用
      if (dateFilter) {
        queryParams.append('deliveryDate', dateFilter);
      }
      if (itemCodeFilter) {
        queryParams.append('productCode', itemCodeFilter);
      }

      const response = await axios.get<PlanData[]>(`${API_BASE_URL}/api/plans?${queryParams.toString()}`);
      
      setPlans(response.data); 
      setError(null);
    } catch (err) {
      console.error('計画データの取得に失敗しました:', err);
      setError('計画データの取得に失敗しました。サーバーが起動しているか、CORS設定を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  // 初期ロード時に一度だけデータをフェッチする useEffect
  // 依存配列を空にすることで、コンポーネントのマウント時に一度だけ実行される
  useEffect(() => {
    fetchPlans();
  }, []); // 空の依存配列

  // フィルタリング処理をuseMemoでメモ化
  const filteredPlans = useMemo(() => {
    // PLAN_STATUSが2（作業完了）の計画は表示しない
    return plans.filter(plan => plan.PLAN_STATUS === 0 || plan.PLAN_STATUS === 1);
  }, [plans]);

  // 計画行の展開/折りたたみハンドラ (今回は使用しないが、コードは残す)
  const togglePlanDetails = (planId: number) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  };

  // 検索ボタンクリックハンドラ
  const handleSearch = () => {
    // 検索ボタンが押されたときにのみ fetchPlans を呼び出す
    fetchPlans();
  };

  // クリアボタンクリックハンドラ
  const handleClearSearch = () => {
    setDateFilter(getTodayDate()); // 日付を今日の日付に戻す
    setItemCodeFilter('');
    setPlans([]); // データをクリア
    // 修正: hasSearched は削除
    // setHasSearched(false); 
    setExpandedPlanId(null); // 展開状態もリセット
    // クリアボタン押下後、再度今日のデータを表示したい場合は、ここで fetchPlans() を呼び出してください。
    // 例: fetchPlans();
  };

  // 計画選択時のハンドラ
  const handlePlanSelect = (plan: PlanData) => {
    setSelectedPlan(plan); // useAppStateに選択された計画を保存
    navigate('/picking'); // ピッキング画面へ遷移
  };

  // ログアウト時のハンドラ
  const handleLogout = () => {
    clearAppState(); // アプリケーションの状態をクリア
    navigate('/'); // ログイン画面へ遷移
  };

  const getStatusDisplay = (status: 0 | 1 | 2) => {
    switch (status) {
      case 0: return { text: '作業待ち', className: 'bg-yellow-200 text-yellow-800' };
      case 1: return { text: '作業中', className: 'bg-blue-200 text-blue-800' };
      case 2: return { text: '作業完了', className: 'bg-green-200 text-green-800' };
      default: return { text: '不明', className: 'bg-gray-200 text-gray-800' };
    }
  };

  // ★追加：PLAN_MSG の内容に応じてスタイルを返す関数
  const getPlanMessageStyle = (message: string | null | undefined) => {
    if (!message) {
      return ''; // メッセージがない場合はスタイルなし
    }
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes('急ぎ') || lowerCaseMessage.includes('urgent')) {
      return 'bg-red-100 text-red-800 border border-red-300 rounded-md px-1 py-0.5'; // 赤系の背景
    }
    if (lowerCaseMessage.includes('注意喚起') || lowerCaseMessage.includes('alert') || lowerCaseMessage.includes('warning')) {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md px-1 py-0.5'; // 黄系の背景
    }
    // その他のメッセージ
    return 'bg-gray-100 text-gray-700 border border-gray-200 rounded-md px-1 py-0.5'; // デフォルトの背景
  };


  // ローディング中の表示
  if (loading) {
    return (
      <HandyContainer>
        <div className="p-2 text-center text-gray-500">
          計画データを読み込み中...
        </div>
      </HandyContainer>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <HandyContainer>
        <div className="p-2 text-center text-red-500">
          エラー: {error}
          <button
            onClick={handleSearch} // エラー時に再試行ボタンで検索を実行
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center"
          >
            <RefreshCcw className="mr-2" size={16} /> 再試行
          </button>
        </div>
      </HandyContainer>
    );
  }

  return (
    <HandyContainer>
      <div className="p-2 space-y-2">
        {/* 検索フィルタ */}
        <div className="handy-card space-y-2">
          <div className="flex justify-between items-center mb-1">
            <h2 className="handy-text-medium text-foreground">データ検索</h2>
            {/* 担当者名のみをここに表示し、ログアウトボタンは削除 */}
            {currentUser && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">{currentUser.TANTO_NAME}</span>
              </div>
            )}
          </div>
          
          {/* 日付検索 */}
          <div className="flex items-center space-x-2"> 
            <label htmlFor="dateFilter" className="text-sm font-medium text-foreground w-1/4">日付</label> 
            <div className="relative flex-1">
              <input
                type="date"
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="handy-input pl-8 w-full py-1 text-sm rounded-md" 
              />
              <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* 品番検索 */}
          <div className="flex items-center space-x-2">
            <label htmlFor="itemCodeFilter" className="text-sm font-medium text-foreground w-1/4">品番</label>
            <div className="relative flex-1">
              <input
                type="text"
                id="itemCodeFilter"
                value={itemCodeFilter}
                onChange={(e) => setItemCodeFilter(e.target.value)}
                placeholder="品番を入力"
                className="handy-input pl-8 w-full py-1 text-sm rounded-md" 
                inputMode="none" // ★追加: ソフトウェアキーボードを抑制
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* ボタンを2列に配置 */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 bg-primary text-primary-foreground py-1.5 rounded-lg text-sm" 
            >
              検索
            </button>

            <button
              onClick={handleClearSearch}
              className="flex-1 bg-secondary text-secondary-foreground py-1.5 rounded-lg text-sm flex items-center justify-center"
            >
              <XCircle className="mr-1" size={16} /> クリア
            </button>
          </div>
        </div>

        {/* 計画データ一覧 */}
        <div className="space-y-1.5">
          <h2 className="handy-text-medium text-foreground">
            計画データ一覧 ({filteredPlans.length}件)
          </h2>
          
          {filteredPlans.length === 0 ? (
            <div className="handy-card text-center text-muted-foreground py-2 text-sm">
              該当する計画データがありません
            </div>
          ) : (
            filteredPlans.map((plan) => {
              const statusInfo = getStatusDisplay(plan.PLAN_STATUS); 
              // 各明細の完了状態を計算し、完了した明細の数をカウント
              const completedItems = plan.details.filter(d => d.DETAIL_QTY === d.READ_QTY).length;
              const totalItems = plan.details.length;
              
              return (
                <div
                  key={plan.ID} // key を div に移動
                  onClick={() => handlePlanSelect(plan)} 
                  className="handy-card hover:bg-accent/5 cursor-pointer border-l-4 border-l-primary p-2"
                  data-lov-id={plan.ID} // data-lov-id は div に残す
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="handy-text-medium text-foreground text-sm">
                        {plan.HINBAN}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {plan.NOHIN_DATE} | {plan.START_TANTO_NAME || '担当者不明'}
                      </div>
                      {/* ★追加：PLAN_MSG の表示とスタイル適用 */}
                      {plan.PLAN_MSG && (
                        <div className={`text-xs mt-0.5 p-0.5 ${getPlanMessageStyle(plan.PLAN_MSG)}`}>
                          メッセージ: {plan.PLAN_MSG}
                        </div>
                      )}
                    </div>
                    <span className={`px-1 py-0.5 rounded text-xs font-medium ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-muted-foreground">
                      進捗: {completedItems}/{totalItems} 品目
                    </span>
                    <div className="progress-bar w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="progress-fill h-full bg-primary rounded-full"
                        style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-gray-500 text-white py-2 rounded-lg font-medium text-sm" 
        >
          ログアウト
        </button>
      </div>
    </HandyContainer>
  );
};

export default PlanSelectionPage;