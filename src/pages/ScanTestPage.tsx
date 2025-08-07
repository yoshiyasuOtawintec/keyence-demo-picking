import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HandyContainer from '../components/HandyContainer';

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
    onScanResult?: (result: { mStringData?: string }) => void;
  }
}

// -----------------------------------------------------------
// GS1-128パース関数をコンポーネント外部に定義
// -----------------------------------------------------------
function parseGs1Code(gs1Code: string) {
  const aiDefinitions = {
    "01": 14, // GTIN (固定長)
    "17": 6,  // 賞味期限 (固定長)
    "10": 0,  // ロット番号 (可変長)
    "21": 0,  // シリアル番号 (可変長)
    "30": 0   // 数量 (可変長)
  };

  const parsedData: { [key: string]: string } = {};
  let currentIndex = 0;
  
  let availableAiKeys = Object.keys(aiDefinitions);
  const FNC1 = String.fromCharCode(29); 

  while (currentIndex < gs1Code.length) {
      let currentAi = null;
      for (const key of availableAiKeys) {
          if (gs1Code.substring(currentIndex, currentIndex + key.length) === key) {
              currentAi = key;
              break;
          }
      }
      if (!currentAi) {
          break;
      }
      availableAiKeys = availableAiKeys.filter(key => key !== currentAi);
      currentIndex += currentAi.length;
      let dataValue;
      const dataLength = aiDefinitions[currentAi];
      
      if (dataLength > 0) {
          dataValue = gs1Code.substring(currentIndex, currentIndex + dataLength);
          currentIndex += dataLength;
      } else {
          let nextIndex = gs1Code.length;
          const fnc1Index = gs1Code.indexOf(FNC1, currentIndex);
          if (fnc1Index !== -1 && fnc1Index < nextIndex) {
              nextIndex = fnc1Index;
          }
          for (const key of availableAiKeys) {
              const tempIndex = gs1Code.indexOf(key, currentIndex);
              if (tempIndex !== -1 && tempIndex < nextIndex) {
                  nextIndex = tempIndex;
              }
          }
          dataValue = gs1Code.substring(currentIndex, nextIndex);
          currentIndex = nextIndex;
          if (gs1Code[currentIndex] === FNC1) {
              currentIndex++;
          }
      }
      parsedData[currentAi] = dataValue;
  }
  return parsedData;
}
// -----------------------------------------------------------


const ScanTestPage: React.FC = () => {
  const navigate = useNavigate();

  const [barcodeType, setBarcodeType] = useState<'normal' | 'gs1'>('normal');

  const [currentScannedData, setCurrentScannedData] = useState<string | null>(null);
  const [scannedHistory, setScannedHistory] = useState<{ time: string; data: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // -----------------------------------------------------------
  // パース結果を保持する新しいStateを追加
  const [parsedData, setParsedData] = useState<{ [key: string]: string } | null>(null);
  // -----------------------------------------------------------


  const handleScanResult = useCallback((result: { mStringData?: string }) => {
    setError(null);
    // -----------------------------------------------------------
    // 新しいスキャンの前にパース結果をクリア
    setParsedData(null);
    // -----------------------------------------------------------


    if (result && result.mStringData) {
      const scannedCode = result.mStringData.toString().trim();
      console.log('KJS Scanner Read (ScanTestPage):', scannedCode, 'Length:', scannedCode.length);

      setCurrentScannedData(scannedCode);
      
      if (barcodeType === 'gs1') {
        try {
          const parsedResult = parseGs1Code(scannedCode);
          // -----------------------------------------------------------
          // パース結果をStateに保存
          setParsedData(parsedResult);
          // -----------------------------------------------------------
        } catch (e) {
          setError("GS1コードの解析中にエラーが発生しました。");
          console.error("GS1 Parse Error:", e);
          setParsedData(null);
        }
      }

      setScannedHistory((prevHistory) => [
        { time: new Date().toLocaleTimeString(), data: scannedCode },
        ...prevHistory,
      ]);
    } else {
      setError("バーコードの読み取りに失敗しました。");
    }
  }, [barcodeType]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.KJS && window.KJS.Scanner) {
      try {
        if (typeof window.KJS.Scanner.setReadCallback === 'function') {
          window.onScanResult = handleScanResult;
          window.KJS.Scanner.setReadCallback("onScanResult");
          console.log("KJS Scanner callback 'onScanResult' set for ScanTestPage.");
        } else {
          console.warn("KJS.Scanner.setReadCallback is not a function.");
          setError("スキャナー機能が利用できません。PC環境ではスキャン機能は動作しません。");
        }
      } catch (e) {
        console.error("Error interacting with KJS Scanner in ScanTestPage:", e);
        setError("スキャナー機能の初期化中に問題が発生しました。PC環境ではスキャン機能は動作しません。");
      }

      return () => {
        if (typeof window !== "undefined") {
          delete (window as any).onScanResult;
          console.log("KJS Scanner callback 'onScanResult' unset from ScanTestPage.");
          if (window.KJS?.Scanner?.stopRead && typeof window.KJS.Scanner.stopRead === 'function') {
            try {
              window.KJS.Scanner.stopRead();
              console.log("KJS Scanner stopped from ScanTestPage.");
            } catch (e) {
              console.warn("Error stopping KJS Scanner on ScanTestPage cleanup:", e);
            }
          }
        }
      };
    } else {
      console.warn("KJSライブラリがロードされていないか、Scannerオブジェクトが見つかりません。");
      setError("KJSライブラリがロードされていません。PC環境ではスキャン機能は動作しません。");
    }
  }, [handleScanResult]);

  const handleBack = () => {
    navigate('/');
  };

  const handleClear = () => {
    setCurrentScannedData(null);
    setScannedHistory([]);
    setError(null);
    // -----------------------------------------------------------
    // パース結果もクリア
    setParsedData(null);
    // -----------------------------------------------------------
  };
  
  const toggleGs1Mode = () => {
    setBarcodeType(prevType => prevType === 'gs1' ? 'normal' : 'gs1');
  };

  return (
    <HandyContainer>
      <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <img
            src="/KEYENCE_PICKUP_DEMO/LOGO.png"
            alt="KEYENCE LOGO"
            className="h-8 mr-2"
          />
          <div>
            <h1 className="text-lg font-bold">読み取りテスト</h1>
            <p className="text-xs opacity-90">スキャンデータの確認</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={toggleGs1Mode}
            className={`text-xs px-2 py-1 rounded-full font-bold
              ${barcodeType === 'gs1' ? 'bg-white text-blue-500' : 'bg-gray-500 text-gray-300'}`}
          >
            GS1
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 py-6">
        <div className="space-y-2">
          <label className="handy-text-medium text-foreground block">
            現在の読み取りデータ
          </label>
          <input
            type="text"
            readOnly
            value={currentScannedData || ''}
            placeholder="スキャン待ち..."
            className="handy-input w-full bg-gray-100 text-foreground"
          />
          {error && (
            <p className="text-red-500 text-sm mt-2 text-center whitespace-pre-wrap">
              {error}
            </p>
          )}
        </div>
        
        {/* ----------------------------------------------------------- */}
        {/* パース結果の表示エリアを追加 */}
        {parsedData && Object.keys(parsedData).length > 0 && (
          <div className="space-y-1 p-2 bg-gray-50 border rounded-lg">
            <h3 className="handy-text-medium text-foreground font-semibold">解析結果</h3>
            {Object.entries(parsedData).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">AI ({key})</span>
                <span className="font-mono text-foreground break-all ml-4">
                  {value || '(データなし)'}
                </span>
              </div>
            ))}
          </div>
        )}
        {/* ----------------------------------------------------------- */}

        <div className="flex justify-around space-x-4 mt-6">
          <button
            onClick={handleBack}
            className="handy-button bg-gray-500 hover:bg-gray-600 text-white w-1/2"
          >
          戻る
          </button>
          <button
            onClick={handleClear}
            className="handy-button bg-red-500 hover:bg-red-600 text-white w-1/2"
          >
            クリア
          </button>
        </div>

        <div className="space-y-2 mt-4">
          <h2 className="handy-text-medium text-foreground">読み取り履歴</h2>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden max-h-80 overflow-y-auto">
            {scannedHistory.length === 0 ? (
              <p className="p-4 text-muted-foreground text-center text-sm">
                まだ読み取り履歴はありません。
              </p>
            ) : (
              <ul>
                {scannedHistory.map((entry, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-xs text-muted-foreground">{entry.time}</div>
                    <div className="handy-text-medium text-foreground font-mono break-all ml-4 text-sm">
                      {entry.data}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </HandyContainer>
  );
};

export default ScanTestPage;