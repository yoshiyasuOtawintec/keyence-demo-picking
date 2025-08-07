import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import HandyContainer from '../components/HandyContainer'; // components ディレクトリからインポート
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // useNavigate をインポート
import { useAppState, Staff } from '../hooks/useAppState'; // useAppState と Staff 型をインポート

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

const LoginPage: React.FC = () => { // コンポーネント名をLoginPageに、プロップスを削除
  // APIから取得したスタッフリストを保持するstate
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  // 選択されたスタッフを保持するstate
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  // ドロップダウンの開閉状態を保持するstate
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // エラーメッセージを保持するstate
  const [error, setError] = useState<string | null>(null);
  // デバッグ用：スキャンされた値を一時的に保持
  const [scannedValueForDisplay, setScannedValueForDisplay] = useState<string | null>(null);

  const navigate = useNavigate(); // useNavigateフックを使用
  const { setCurrentUser } = useAppState(); // useAppStateからsetCurrentUserを取得

  // APIのベースURLを環境変数から取得
  // .env.local ファイルに VITE_API_BASE_URL=http://192.168.24.5:5000 を設定してください
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // コンポーネントマウント時に担当者リストをAPIから取得
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        // APIベースURLが設定されているか確認
        if (!API_BASE_URL) {
          setError('APIベースURLが設定されていません。`.env.local` ファイルを確認してください。');
          console.error('Environment variable VITE_API_BASE_URL is not set.');
          return;
        }
        // APIから担当者リストを取得
        const response = await axios.get<Staff[]>(`${API_BASE_URL}/api/tantos`);
        setAvailableStaff(response.data);
        setError(null); // 成功したらエラーをクリア
      } catch (err) {
        console.error('担当者リストの取得に失敗しました:', err);
        setError('担当者リストの取得に失敗しました。サーバーが起動しているか、CORS設定を確認してください。');
      }
    };
    fetchStaff();
  }, [API_BASE_URL]); // API_BASE_URLが変更されたら再実行

  // バーコードスキャン結果を処理するコールバック関数
  // availableStaff と navigate が変更されても関数インスタンスが安定するように useCallback を使用
  const handleScanResult = useCallback((result: { mStringData?: string }) => {
    setError(null); // 新しいスキャンの前にエラーをクリア
    setScannedValueForDisplay(null); // スキャン表示もクリア

    if (result && result.mStringData) {
      const scannedCode = result.mStringData.toString().trim(); // 空白をトリミング
      console.log('KJS Scanner Read (trimmed):', scannedCode, 'Length:', scannedCode.length);
      setScannedValueForDisplay(scannedCode); // スキャンされた値を表示用にセット

      // スキャンされたコードに一致するスタッフを availableStaff から検索
      const foundStaff = availableStaff.find(
        (staff) => staff.TANTO_CODE.trim() === scannedCode // TANTO_CODEも空白をトリミングして比較
      );

      if (foundStaff) {
        setSelectedStaff(foundStaff); // コンボボックスが選択されるように状態を更新
        setError(null); // エラーをクリア
        setScannedValueForDisplay(null); // 成功したら表示をクリア
        setCurrentUser(foundStaff); // useAppStateに担当者情報を保存
        navigate('/plan-selection'); // 計画選択画面へ遷移
      } else {
        // エラーメッセージにスキャン値と期待値を表示
        setError(
          `スキャン値: "${scannedCode}" (長さ: ${scannedCode.length})\n` +
          `無効な担当者IDがスキャンされました。`
        );
        setSelectedStaff(null); // 無効な場合は選択をクリア
      }
    } else {
      setError("バーコードの読み取りに失敗しました。");
      setSelectedStaff(null); // 失敗した場合は選択をクリア
    }
  }, [availableStaff, navigate, setCurrentUser]); // 依存配列にnavigateとsetCurrentUserを追加

  // KJSスキャナーのコールバック設定のみを行う (startRead/stopReadは呼び出さない)
  useEffect(() => {
    // window.KJS と window.KJS.Scanner が利用可能か確認
    if (typeof window !== "undefined" && window.KJS && window.KJS.Scanner) {
      try {
        // setReadCallback メソッドが存在し、関数であることを確認してから呼び出す
        if (typeof window.KJS.Scanner.setReadCallback === 'function') {
          // グローバル関数として handleScanResult を登録
          window.onScanResult = handleScanResult;
          // KJS Scanner にコールバック関数名を指定
          window.KJS.Scanner.setReadCallback("onScanResult");
          console.log("KJS Scanner callback 'onScanResult' set.");
        } else {
          console.warn("KJS.Scanner.setReadCallback is not a function. KJS library might not be fully functional on this environment.");
          setError("スキャナー機能が利用できません。PC環境ではスキャン機能は動作しません。");
        }

        // ここで startRead() および stopRead() は呼び出さない。
        // これにより、PCでのクラッシュを防ぎ、画面起動時にリーダーが反応しないようにします。
        // ハードボタンが読み取りをトリガーすると仮定します。

      } catch (e) {
        // KJS.Scanner とのインタラクション中に発生したエラーをキャッチ
        console.error("Error interacting with KJS Scanner:", e);
        setError("スキャナー機能の初期化中に問題が発生しました。PC環境ではスキャン機能は動作しません。");
      }

      // コンポーネントアンマウント時のクリーンアップ関数
      return () => {
        // グローバルコールバックを削除
        if (typeof window !== "undefined") {
          delete (window as any).onScanResult;
          console.log("KJS Scanner callback 'onScanResult' unset.");
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
      setError("KJSライブラリがロードされていません。PC環境ではスキャン機能は動作しません。");
    }
  }, [handleScanResult]); // handleScanResult を依存配列に追加

  // ドロップダウンからのスタッフ選択処理
  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
    setError(null); // 選択したらエラーをリセット
    setScannedValueForDisplay(null); // 選択したらスキャン表示もリセット
  };

  // ログインボタン押下時の処理
  const handleLogin = () => {
    // 選択された担当者で直接ログイン処理を実行
    if (selectedStaff) {
      console.log('担当者選択によるログイン実行:', selectedStaff);
      console.log('セットする担当者コード:', selectedStaff.TANTO_CODE); // ★追加: 担当者コードをログに出力
      setCurrentUser(selectedStaff); // useAppStateに担当者情報を保存
      navigate('/plan-selection'); // 計画選択画面へ遷移
    } else {
      setError('担当者を選択してください。'); // 担当者が選択されていない場合のエラー
    }
  };

  // 読み取りテストボタン押下時の処理
  const handleScanTest = () => {
    // 読み取りテスト画面への遷移
    navigate('/scan-test'); // 仮のルート名、必要に応じて変更してください
  };

  return (
    <HandyContainer>
      {/* カスタムヘッダー */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          {/* ロゴの表示 */}
          <img
            src="/KEYENCE_PICKUP_DEMO/LOGO.png" // publicディレクトリからの相対パス
            alt="KEYENCE LOGO"
            className="h-8 mr-3" // ロゴの高さとマージンを調整
          />
          <div>
            <h1 className="text-xl font-bold">Keyenceシステム</h1>
            <p className="text-sm opacity-90">ピッキングシステム</p>
          </div>
        </div>
      </div>

      {/* コンテンツエリア：上下のパディングを増やして中央に近づける */}
      <div className="p-6 space-y-6 py-20">

        {/* 担当者選択セクション */}
        <div className="space-y-4">
          <label className="handy-text-medium text-foreground block">
            担当者選択
          </label>

          <div className="relative">
            {/* 担当者選択ドロップダウンのボタン */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="handy-input w-full flex items-center justify-between bg-white"
            >
              <span className={selectedStaff ? 'text-foreground' : 'text-muted-foreground'}>
                {/* 選択されたスタッフ名とコードを表示、またはプレースホルダーを表示 */}
                {selectedStaff ? `${selectedStaff.TANTO_NAME} (${selectedStaff.TANTO_CODE})` : '担当者を選択...'}
              </span>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* ドロップダウンメニュー */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-primary rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {/* 担当者データのロード状態とエラー表示 */}
                {availableStaff.length === 0 && !error ? (
                  <div className="px-4 py-3 text-gray-500">担当者データを読み込み中...</div>
                ) : error && availableStaff.length === 0 ? ( // 担当者データがない場合のエラー表示
                  <div className="px-4 py-3 text-red-500">エラー: {error}</div>
                ) : (
                  // 担当者リストの表示
                  availableStaff.map((staff) => (
                    <button
                      key={staff.TANTO_CODE}
                      onClick={() => handleStaffSelect(staff)}
                      className="w-full px-4 py-3 text-left hover:bg-primary/5 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                    >
                      <div className="handy-text-medium text-foreground">
                        {staff.TANTO_NAME}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {staff.TANTO_CODE}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {/* ドロップダウンが閉じているときのエラー表示 */}
          {error && !isDropdownOpen && (
            <p className="text-red-500 text-sm mt-2 text-center whitespace-pre-wrap">
              {error}
            </p>
          )}
          {scannedValueForDisplay && ( // デバッグ用：スキャンされた値を表示
            <div className="text-blue-500 text-xs mt-1 text-center">
              スキャン値: {scannedValueForDisplay}
            </div>
          )}
        </div>

        {/* ログインボタン */}
        <button
          onClick={handleLogin}
          // 担当者が選択されていないか、担当者データがない場合はボタンを無効化
          disabled={!selectedStaff || availableStaff.length === 0}
          className={`handy-button ${
            !selectedStaff || availableStaff.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : ''
          } mb-4`}
        >
          ログイン
        </button>

        {/* 読み取りテストボタンを追加 */}
        <button
          onClick={handleScanTest}
          className="handy-button bg-blue-500 hover:bg-blue-600 text-white"
        >
          読み取りテスト
        </button>
      </div>
    </HandyContainer>
  );
};

export default LoginPage;
