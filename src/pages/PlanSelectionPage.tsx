import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, LogOut, Search, Calendar, RefreshCcw, XCircle } from 'lucide-react';
import HandyContainer from '../components/HandyContainer'; // components ディレクトリからインポート
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // useNavigate をインポート
import { useAppState, Staff, PlanData } from '../hooks/useAppState'; // useAppState と型をインポート

const PlanSelectionPage: React.FC = () => { // コンポーネント名をPlanSelectionPageに、プロップスを削除
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  const [dateFilter, setDateFilter] = useState(getTodayDate());
  const [itemCodeFilter, setItemCodeFilter] = useState('');
  // 修正点: hasSearched の初期値を true に変更
  const [hasSearched, setHasSearched] = useState(true); // 初期状態で検索済みとみなす
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);

  const navigate = useNavigate(); // useNavigateフックを使用
  const { currentUser, setSelectedPlan, clearAppState } = useAppState(); // useAppStateから必要な状態とアクションを取得

  // currentUserがnullの場合はログイン画面へリダイレクト
  // App.tsxのルーティングで処理されるが、コンポーネント内でも念のためガード
  useEffect(() => {
    if (!currentUser) {
      console.warn("PlanSelectionPage: currentUser is missing. Redirecting to login.");
      navigate('/');
    }
  }, [currentUser, navigate]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 計画データを取得する関数
  const fetchPlans = useCallback(async () => {
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
      if (dateFilter) {
        queryParams.append('deliveryDate', dateFilter);
      }
      if (itemCodeFilter) {
        queryParams.append('productCode', itemCodeFilter);
      }

      const response = await axios.get<PlanData[]>(`${API_BASE_URL}/api/plans?${queryParams.toString()}`);
      
      // ★修正: フロントエンドでのソート処理を削除。バックエンドのソート順をそのまま使用します。
      setPlans(response.data); 
      setError(null);
    } catch (err) {
      console.error('計画データの取得に失敗しました:', err);
      setError('計画データの取得に失敗しました。サーバーが起動しているか、CORS設定を確認してください。');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, dateFilter, itemCodeFilter]); // 検索条件が変更されたら関数を再生成

  // 検索トリガー用のuseEffect: hasSearchedがtrueの場合のみデータをフェッチ
  useEffect(() => {
    // 修正点: hasSearched が true の場合は常に fetchPlans を呼び出す
    // 初期ロード時に hasSearched が true なので、ここでデータがフェッチされます
    if (hasSearched) {
      fetchPlans();
    } else {
      // hasSearched が false になった場合（クリアボタン押下時など）
      setLoading(false);
      setPlans([]);
    }
  }, [hasSearched, fetchPlans]); // hasSearched または fetchPlans が変更されたら実行

  // フィルタリング処理をuseMemoでメモ化
  const filteredPlans = useMemo(() => {
    // PLAN_STATUSが2（作業完了）の計画は表示しない
    return plans.filter(plan => plan.PLAN_STATUS === 0 || plan.PLAN_STATUS === 1);
  }, [plans]); // plansが変更された時のみ再計算

  // 計画行の展開/折りたたみハンドラ (今回は使用しないが、コードは残す)
  const togglePlanDetails = (planId: number) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  };

  // 検索ボタンクリックハンドラ
  const handleSearch = () => {
    setHasSearched(true); // 検索が実行されたことをマーク
    // fetchPlans は useEffect によって呼び出される
  };

  // クリアボタンクリックハンドラ
  const handleClearSearch = () => {
    setDateFilter(getTodayDate()); // 日付を今日の日付に戻す
    setItemCodeFilter('');
    setPlans([]); // データをクリア
    setHasSearched(false); // 検索状態をリセットし、初期メッセージを表示
    setExpandedPlanId(null); // 展開状態もリセット
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
            onClick={fetchPlans}
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
          
          {/* 修正点: hasSearched の条件を削除し、常に filteredPlans の内容に基づいて表示を決定 */}
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
                        {plan.NOHIN_DATE} | {plan.START_TANTO_NAME || '担当者不明'} {/* ★修正点: UPDATE_TANTO_NAME を START_TANTO_NAME に変更 */}
                      </div>
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
