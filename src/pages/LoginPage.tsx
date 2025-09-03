import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import HandyContainer from '../components/HandyContainer';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAppState, Staff } from '../hooks/useAppState';

// KJSライブラリの型定義をグローバルスコープに宣言
declare global {
  interface Window {
    KJS?: {
      Scanner?: {
        setReadCallback: (callbackName: string) => void;
        startRead: () => number;
        stopRead?: () => number;
      };
    };
    // グローバルコールバック関数を定義
    onScanResult?: (result: { mStringData?: string }) => void;
  }
}

const LoginPage: React.FC = () => {
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedValueForDisplay, setScannedValueForDisplay] = useState<string | null>(null);

  const navigate = useNavigate();
  const { setCurrentUser } = useAppState();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        if (!API_BASE_URL) {
          setError('APIベースURLが設定されていません。`.env.local` ファイルを確認してください。');
          console.error('Environment variable VITE_API_BASE_URL is not set.');
          return;
        }
        const response = await axios.get<Staff[]>(`${API_BASE_URL}/api/tantos`);
        setAvailableStaff(response.data);
        setError(null);
      } catch (err) {
        console.error('担当者リストの取得に失敗しました:', err);
        setError('担当者リストの取得に失敗しました。サーバーが起動しているか、CORS設定を確認してください。');
      }
    };
    fetchStaff();
  }, [API_BASE_URL]);

  const handleScanResult = useCallback((result: { mStringData?: string }) => {
    setError(null);
    setScannedValueForDisplay(null);

    if (result && result.mStringData) {
      const scannedCode = result.mStringData.toString().trim();
      console.log('KJS Scanner Read (trimmed):', scannedCode, 'Length:', scannedCode.length);
      setScannedValueForDisplay(scannedCode);

      const foundStaff = availableStaff.find(
        (staff) => staff.TANTO_CODE.trim() === scannedCode
      );

      if (foundStaff) {
        setSelectedStaff(foundStaff);
        setError(null);
        setScannedValueForDisplay(null);
        setCurrentUser(foundStaff);
        navigate('/menu');
      } else {
        setError(
          `スキャン値: "${scannedCode}" (長さ: ${scannedCode.length})\n` +
          `無効な担当者IDがスキャンされました。`
        );
        setSelectedStaff(null);
      }
    } else {
      setError("バーコードの読み取りに失敗しました。");
      setSelectedStaff(null);
    }
  }, [availableStaff, navigate, setCurrentUser]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.KJS && window.KJS.Scanner) {
      try {
        if (typeof window.KJS.Scanner.setReadCallback === 'function') {
          window.onScanResult = handleScanResult;
          window.KJS.Scanner.setReadCallback("onScanResult");
          console.log("KJS Scanner callback 'onScanResult' set.");
        } else {
          console.warn("KJS.Scanner.setReadCallback is not a function. KJS library might not be fully functional on this environment.");
          setError("スキャナー機能が利用できません。PC環境ではスキャン機能は動作しません。");
        }

      } catch (e) {
        console.error("Error interacting with KJS Scanner:", e);
        setError("スキャナー機能の初期化中に問題が発生しました。PC環境ではスキャン機能は動作しません。");
      }

      return () => {
        if (typeof window !== "undefined") {
          delete (window as any).onScanResult;
          console.log("KJS Scanner callback 'onScanResult' unset.");
          if (window.KJS?.Scanner?.stopRead && typeof window.KJS.Scanner.stopRead === 'function') {
            try {
              window.KJS.Scanner.stopRead();
              console.log("KJS Scanner stopped.");
            } catch (e) {
              console.warn("Error stopping KJS Scanner on cleanup:", e);
            }
          }
        }
      };
    } else {
      console.warn("KJSライブラリがロードされていないか、Scannerオブジェクトが見つかりません。スキャンはデバイスでのみ動作します。");
      setError("KJSライブラリがロードされていません。PC環境ではスキャン機能は動作しません。");
    }
  }, [handleScanResult]);

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
    setError(null);
    setScannedValueForDisplay(null);
  };

  const handleLogin = () => {
    if (selectedStaff) {
      console.log('担当者選択によるログイン実行:', selectedStaff);
      console.log('セットする担当者コード:', selectedStaff.TANTO_CODE);
      setCurrentUser(selectedStaff);
      navigate('/menu');
    } else {
      setError('担当者を選択してください。');
    }
  };

  return (
    <HandyContainer>
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <img
            src="/KEYENCE_PICKUP_DEMO/LOGO.png"
            alt="KEYENCE LOGO"
            className="h-8 mr-3"
          />
          <div>
            <h1 className="text-xl font-bold">Keyenceシステム</h1>
            <p className="text-sm opacity-90">ピッキングシステム</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 py-20">
        <div className="space-y-4">
          <label className="handy-text-medium text-foreground block">
            担当者選択
          </label>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="handy-input w-full flex items-center justify-between bg-white"
            >
              <span className={selectedStaff ? 'text-foreground' : 'text-muted-foreground'}>
                {selectedStaff ? `${selectedStaff.TANTO_NAME} (${selectedStaff.TANTO_CODE})` : '担当者を選択...'}
              </span>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-primary rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {availableStaff.length === 0 && !error ? (
                  <div className="px-4 py-3 text-gray-500">担当者データを読み込み中...</div>
                ) : error && availableStaff.length === 0 ? (
                  <div className="px-4 py-3 text-red-500">エラー: {error}</div>
                ) : (
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
          {error && !isDropdownOpen && (
            <p className="text-red-500 text-sm mt-2 text-center whitespace-pre-wrap">
              {error}
            </p>
          )}
          {scannedValueForDisplay && (
            <div className="text-blue-500 text-xs mt-1 text-center">
              スキャン値: {scannedValueForDisplay}
            </div>
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={!selectedStaff || availableStaff.length === 0}
          className={`handy-button ${
            !selectedStaff || availableStaff.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : ''
          } mb-4`}
        >
          ログイン
        </button>
      </div>
    </HandyContainer>
  );
};

export default LoginPage;