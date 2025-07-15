import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import HandyContainer from '../components/HandyContainer'; // components ディレクトリからインポート
import { useNavigate } from 'react-router-dom'; // useNavigate をインポート
import { useAppState, Staff, PlanData, PlanDetail } from '../hooks/useAppState'; // useAppState と型をインポート
import axios from 'axios'; // axios をインポート

// KJSライブラリの型定義をグローバルスコープに宣言
declare global {
  interface Window {
    KJS?: {
      Scanner?: {
        setReadCallback: (callbackName: string) => void;
        startRead: () => number; // 戻り値は以前のコードに基づく
        stopRead?: () => number; // スキャナー停止用のオプションメソッドを追加
      };
    };
    // グローバルコールバック関数を定義
    onScanResult?: (result: { mStringData?: string }) => void;
  }
}

const PickingPage: React.FC = () => { // コンポーネント名をPickingPageに、プロップスを削除
  const navigate = useNavigate(); // useNavigateフックを使用
  const {
    selectedPlan,
    currentUser,
    currentDetailIndex,
    setCurrentDetailIndex,
    updatePlanDetailQuantity, // 明細の数量更新アクション
    setSelectedPlan, // 計画完了時にselectedPlanをクリアするため
  } = useAppState();

  const [scanError, setScanError] = useState<string | null>(null); // スキャンエラーメッセージ用
  const [scannedValueForDisplay, setScannedValueForDisplay] = useState<string | null>(null); // デバッグ用：スキャンされた値を保持

  // APIのベースURLを環境変数から取得
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // selectedPlan または currentUser が存在しない場合は、計画選択画面へリダイレクト
  // App.tsx のルーティングで処理されるが、念のためここでもガード
  useEffect(() => {
    if (!selectedPlan || !currentUser) {
      console.warn("PickingPage: selectedPlan or currentUser is missing. Redirecting to plan selection.");
      navigate('/plan-selection');
    }
  }, [selectedPlan, currentUser, navigate]);


  // selectedPlan が null の場合は、読み込み中またはエラー状態を示す
  if (!selectedPlan || !currentUser) {
    return (
      <HandyContainer>
        <div className="p-4 text-center text-red-500">
          エラー: 計画データまたは担当者情報が取得できませんでした。
          <button
            onClick={() => navigate('/plan-selection')}
            className="mt-4 w-full bg-gray-400 text-white py-2 rounded-lg font-medium text-sm"
          >
            計画選択画面に戻る
          </button>
        </div>
      </HandyContainer>
    );
  }

  // selectedPlan が存在する場合のみ、以下のロジックを実行
  const currentDetail = selectedPlan.details[currentDetailIndex];
  // const completedCount = selectedPlan.details.filter(d => d.isCompleted).length; // 使用しないためコメントアウトまたは削除可能
  // const totalCount = selectedPlan.details.length; // 使用しないためコメントアウトまたは削除可能

  // 全ての明細が完了しているかどうかの判定
  const allDetailsCompleted = useMemo(() => {
    return selectedPlan.details.every(detail => detail.isCompleted);
  }, [selectedPlan.details]);


  // 自動的に次の未完了明細に移動
  useEffect(() => {
    const nextIncompleteIndex = selectedPlan.details.findIndex(
      (detail, index) => index >= currentDetailIndex && !detail.isCompleted
    );
    
    if (nextIncompleteIndex !== -1 && nextIncompleteIndex !== currentDetailIndex) {
      setCurrentDetailIndex(nextIncompleteIndex);
      setScannedValueForDisplay(null); // 次の品目に移動したらスキャン状態をリセット
      setScanError(null); // エラーもリセット
    }
  }, [selectedPlan.details, currentDetailIndex, setCurrentDetailIndex]);

  // KJSスキャナーからのバーコード読み取り結果を処理するコールバック関数
  const handleKjsScanResult = useCallback(async (result: { mStringData?: string }) => {
    setScanError(null); // 新しいスキャンの前にエラーをクリア
    setScannedValueForDisplay(null); // スキャン表示もクリア

    if (result && result.mStringData) {
      const scannedBarcode = result.mStringData.toString().trim(); // 空白をトリミング
      console.log('KJS Scanner Read (trimmed):', scannedBarcode, 'Length:', scannedBarcode.length);
      setScannedValueForDisplay(scannedBarcode); // スキャンされた値を表示用にセット

      const targetReadData = currentDetail.READ_DATA?.trim(); // READ_DATAも空白をトリミング
      console.log('Current Detail READ_DATA (trimmed):', targetReadData, 'Length:', targetReadData?.length);


      // 現在の品目のREAD_DATAと照合
      if (targetReadData && scannedBarcode === targetReadData) {
        console.log('Comparison result:', true); // 比較結果をログに出力
        console.log('バーコード照合成功 (READ_DATA):', scannedBarcode);

        // 読み取り済数量が指示数量に達していない場合のみカウントアップ
        if (currentDetail.READ_QTY < currentDetail.DETAIL_QTY) {
          // useAppState のアクションを呼び出して状態を更新
          // detailId は number 型に修正されたため、currentDetail.ID も number であることを確認
          const updated = await updatePlanDetailQuantity(currentDetail.ID, currentDetail.ROW_NO, scannedBarcode);
          
          if (updated) {
            setScannedValueForDisplay(null); // 成功したら表示をクリア
            // 数量が更新された後、自動的に次の未完了明細に移動するロジックはuseEffectで処理される
          } else {
            setScanError('数量の更新に失敗しました。（DB更新失敗の可能性）');
          }
        } else {
          setScanError('この品目は既に完了しています。');
        }
      } else {
        console.log('Comparison result:', false); // 比較結果をログに出力
        // READ_DATAが存在しない場合もエラーとするか、別のメッセージを出すか検討
        if (!targetReadData) {
          setScanError('現在の品目には照合番号 (READ_DATA) が設定されていません。');
          console.warn('Current detail READ_DATA is missing or empty:', currentDetail.READ_DATA); // READ_DATAが欠落している場合のログ
        } else {
          // エラーメッセージにスキャン値と期待値を表示
          setScanError(
            `スキャン値: "${scannedBarcode}" (長さ: ${scannedBarcode.length})\n` +
            `照合番号: "${targetReadData}" (長さ: ${targetReadData.length})\n` +
            `一致しません。`
          );
        }
      }
    } else {
      setScanError('バーコードの読み取りに失敗しました。');
    }
  }, [currentDetail, currentDetailIndex, updatePlanDetailQuantity]);

  // KJSスキャナーのコールバック設定のみを行う (startRead/stopReadは呼び出さない)
  useEffect(() => {
    // window.KJS と window.KJS.Scanner が利用可能か確認
    if (typeof window !== "undefined" && window.KJS && window.KJS.Scanner) {
      try {
        // setReadCallback メソッドが存在し、関数であることを確認してから呼び出す
        if (typeof window.KJS.Scanner.setReadCallback === 'function') {
          // グローバル関数として handleKjsScanResult を登録
          window.onScanResult = handleKjsScanResult;
          window.KJS.Scanner.setReadCallback("onScanResult");
          console.log("KJS Scanner callback 'onScanResult' set for PickingPage.");
        } else {
          console.warn("KJS.Scanner.setReadCallback is not a function. KJS library might not be fully functional on this environment.");
          setScanError("スキャナー機能が利用できません。PC環境ではスキャン機能は動作しません。");
        }

        // ここで startRead() および stopRead() は呼び出さない。
        // これにより、PCでのクラッシュを防ぎ、画面起動時にリーダーが反応しないようにします。
        // ハードボタンが読み取りをトリガーすると仮定します。

      } catch (e) {
        // KJS.Scanner とのインタラクション中に発生したエラーをキャッチ
        console.error("Error interacting with KJS Scanner on PickingPage:", e);
        setScanError("スキャナー機能の初期化中に問題が発生しました。PC環境ではスキャン機能は動作しません。");
      }

      // コンポーネントアンマウント時のクリーンアップ関数
      return () => {
        // グローバルコールバックを削除
        if (typeof window !== "undefined") {
          delete (window as any).onScanResult;
          console.log("KJS Scanner callback 'onScanResult' unset for PickingPage.");
          // stopRead メソッドが存在し、関数であることを確認してから呼び出す
          if (window.KJS?.Scanner?.stopRead && typeof window.KJS.Scanner.stopRead === 'function') {
            try {
              window.KJS.Scanner.stopRead(); // アプリケーション終了時にスキャナーを停止
              console.log("KJS Scanner stopped.");
            } catch (e) {
              console.warn("Error stopping KJS Scanner on cleanup:", e);
            }
          }
        }
      };
    } else {
      // window.KJS または window.KJS.Scanner が見つからない場合
      console.warn("KJSライブラリがロードされていないか、Scannerオブジェクトが見つかりません。スキャンはデバイスでのみ動作します。");
      setScanError("KJSライブラリがロードされていません。PC環境ではスキャン機能は動作しません。");
    }
  }, [handleKjsScanResult]);

  // ピッキング完了時のハンドラ
  const handlePickingComplete = async () => {
    const currentPlan = selectedPlan; 
    if (!currentPlan || !currentUser) return;

    // 最終的な計画ステータスと日時を確定
    const currentSystemDtm = new Date().toISOString();

    // ★修正点1: START_DTMがnullの場合のみ現在時刻を設定
    const startDtmToUse = currentPlan.START_DTM === null ? currentSystemDtm : currentPlan.START_DTM;

    // ★修正点2: START_TANTO_CODEをcurrentUser.TANTO_CODEに設定
    //          ただし、selectedPlan.START_TANTO_CODEがnullの場合のみ
    const startTantoCodeToUse = currentPlan.START_TANTO_CODE === null ? currentUser.TANTO_CODE : currentPlan.START_TANTO_CODE;

    const updatedPlanForCompletion: PlanData = {
      ...currentPlan,
      PLAN_STATUS: 2, // 作業完了に設定
      START_DTM: startDtmToUse, // ★修正点1適用
      END_DTM: currentSystemDtm, // 終了日時を現在時刻に設定
      UPDATE_DTM: currentSystemDtm, // 更新日時も現在時刻に設定
      UPDATE_TANTO_CODE: currentUser.TANTO_CODE, // ログイン中の担当者コード
      UPDATE_TANTO_NAME: currentUser.TANTO_NAME, // ログイン中の担当者名
      START_TANTO_CODE: startTantoCodeToUse, // ★修正点2適用
      // details 配列は currentPlan の最新の状態をそのまま使用
    };

    try {
      if (!API_BASE_URL) {
        setScanError('APIベースURLが設定されていません。`.env.local` ファイルを確認してください。');
        console.error('Environment variable VITE_API_BASE_URL is not set.');
        return;
      }
      console.log('APIへのPUTリクエスト送信中。ピッキング完了ペイロード:', JSON.stringify(updatedPlanForCompletion, null, 2));
      await axios.put(`${API_BASE_URL}/api/plans/${updatedPlanForCompletion.ID}`, updatedPlanForCompletion);
      console.log('データベースが正常に更新されました（ピッキング完了）。');
      setSelectedPlan(null);
      navigate('/plan-selection');
    } catch (err) {
      console.error('計画データの更新に失敗しました（ピッキング完了）:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.error('API Response Error:', err.response.data);
        setScanError(`計画データの更新に失敗しました: ${err.response.data || err.message}`);
      } else {
        setScanError(`計画データの更新に失敗しました: ${err.message}`);
      }
    }
  };

  // 計画選択画面に戻るハンドラ
  const handleBackToPlanSelection = () => {
    navigate('/plan-selection');
  };

  // 資材タイトルでグループ化
  const groupedDetails = useMemo(() => {
    if (!selectedPlan) return {};
    return selectedPlan.details.reduce((groups, detail, index) => {
      const title = detail.ITEM_TITLE || 'その他';
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push({ ...detail, originalIndex: index });
      return groups;
    }, {} as Record<string, (PlanDetail & { originalIndex: number })[]>);
  }, [selectedPlan]);

  // デバッグ用: バーコードスキャンをシミュレートする関数
  // const simulateScan = async () => { // async に変更
  //   if (currentDetail && currentDetail.READ_DATA) {
  //     await handleKjsScanResult({ mStringData: currentDetail.READ_DATA });
  //   } else {
  //     setScanError('シミュレートする照合番号が見つかりません。');
  //   }
  // };

  return (
    <HandyContainer>
      {/* カスタムヘッダー（コメントアウト済み） */}
      {/* <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <img
            src="/LOGO.png" // publicディレクトリからの相対パス
            alt="NAKAYAMA LOGO"
            className="h-8 mr-3" // ロゴの高さとマージンを調整
          />
          <div>
            <h1 className="text-xl font-bold"></h1>
            <p className="text-sm opacity-90">ピッキングシステム</p>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{currentUser.TANTO_NAME}</span>
          </div>
        )}
      </div> */}

      <div className="p-4 space-y-4">
        {/* 計画データ情報 */}
        <div className="handy-card bg-primary/5 border-l-4 border-l-primary">
          <div className="handy-text-medium text-foreground mb-2">
            品番: {selectedPlan.HINBAN}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex justify-between items-center">
              <div>日付: {selectedPlan.NOHIN_DATE}</div>
              <div>数量: {selectedPlan.QTY}</div>
            </div>
          </div>
        </div>

        {/* デバッグ用ボタン（コメントアウト済み） */}
        {/* <button
          onClick={simulateScan}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-medium text-sm mb-4"
        >
          デバッグ: 現在の品目をスキャン
        </button> */}

        {/* 現在ピッキング中の明細 */}
        <div className="handy-card border-2 border-primary">
          {/* ★ここを修正: 「現在の品目」と担当者名を横並びに */}
          <div className="handy-text-large text-primary mb-2 flex justify-between items-center">
            <span>現在の品目</span>
            {currentUser && (
              <span className="text-sm font-medium text-right">{currentUser.TANTO_NAME}</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="handy-text-medium text-foreground">
              {currentDetail.ITEM_NAME}
            </div>
            {currentDetail.READ_DATA && (
              <div className="text-sm text-muted-foreground">
                照合番号: {currentDetail.READ_DATA}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              指示数量: {currentDetail.DETAIL_QTY} |
              完了: {currentDetail.READ_QTY} |
              残り: {currentDetail.DETAIL_QTY - currentDetail.READ_QTY}
            </div>

            {/* コメント・注意事項 */}
            {(currentDetail.COMMENT || currentDetail.ALERT_MSG || currentDetail.REMARK) && (
              <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-l-yellow-400">
                {currentDetail.ALERT_MSG && (
                  <div className="text-red-600 font-medium text-sm">
                    ⚠️ {currentDetail.ALERT_MSG}
                  </div>
                )}
                {currentDetail.COMMENT && (
                  <div className="text-orange-600 text-sm">
                    💬 {currentDetail.COMMENT}
                  </div>
                )}
                {currentDetail.REMARK && (
                  <div className="text-blue-600 text-sm">
                    📝 {currentDetail.REMARK}
                  </div>
                )}
              </div>
            )}
            {/* スキャンエラーメッセージの表示 */}
            {scanError && (
              <div className="text-red-500 text-sm mt-2 text-center whitespace-pre-wrap">
                {scanError}
              </div>
            )}
            {scannedValueForDisplay && ( // デバッグ用：スキャンされた値を表示
              <div className="text-blue-500 text-xs mt-1 text-center">
                スキャン値: {scannedValueForDisplay}
              </div>
            )}
          </div>
        </div>

        {/* 明細一覧 */}
        <div className="handy-card">
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {Object.entries(groupedDetails).map(([materialTitle, details]) => (
              <div key={materialTitle}>
                <div className="font-medium text-sm text-primary mb-2">
                  {materialTitle}
                </div>
                {details.map((detail) => (
                  <div
                    key={`${detail.ID}-${detail.ROW_NO}`}
                    className={`p-2 rounded border text-sm ${
                      detail.originalIndex === currentDetailIndex
                        ? 'bg-primary/10 border-primary'
                        : detail.isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {detail.ITEM_NAME}
                      </span>
                      {detail.READ_DATA && (
                        <span className="text-muted-foreground text-xs ml-2">
                          ({detail.READ_DATA})
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        detail.isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {detail.READ_QTY}/{detail.DETAIL_QTY}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setCurrentDetailIndex(Math.max(0, currentDetailIndex - 1))}
            disabled={currentDetailIndex === 0}
            className="w-fit px-4 py-1 bg-gray-500 text-white rounded-lg font-medium disabled:opacity-50 text-sm"
          >
            <ChevronUp className="inline w-4 h-4 mr-1" />
            前へ
          </button>
          <button
            onClick={() => setCurrentDetailIndex(Math.min(selectedPlan.details.length - 1, currentDetailIndex + 1))}
            disabled={currentDetailIndex === selectedPlan.details.length - 1}
            className="w-fit px-4 py-1 bg-gray-500 text-white rounded-lg font-medium disabled:opacity-50 text-sm"
          >
            次へ
            <ChevronDown className="inline w-4 h-4 ml-1" />
          </button>
        </div>

        {/* 完了ボタン */}
        <div className="flex justify-between gap-2">
          <button
            onClick={handleBackToPlanSelection}
            className="w-fit px-4 py-2 bg-gray-400 text-white rounded-lg font-medium text-sm"
          >
            戻る
          </button>
          <button
            onClick={handlePickingComplete}
            disabled={!allDetailsCompleted} // 全て完了していないと無効化
            className="w-fit px-4 py-2 handy-button bg-green-600 hover:bg-green-700 text-sm disabled:bg-gray-500 disabled:cursor-not-allowed" // 無効時のスタイルを追加
          >
            ピッキング完了
          </button>
        </div>
      </div>
    </HandyContainer>
  );
};

export default PickingPage;