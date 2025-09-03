import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import HandyContainer from '../components/HandyContainer';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';

const InspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppState();

  const [inspectionData, setInspectionData] = useState({
    totalQuantity: 15,
    defects: {
      foreignObject: 1,
      scratch: 0,
      stain: 0,
      fold: 2,
      pressMisalignment: 0,
      other: 0,
    },
    comment: '',
  });

  useEffect(() => {
    if (!currentUser) {
      console.warn("InspectionPage: currentUser is missing. Redirecting to login.");
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleDefectChange = (defectKey: keyof typeof inspectionData.defects, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setInspectionData(prevData => ({
      ...prevData,
      defects: {
        ...prevData.defects,
        [defectKey]: numericValue === '' ? '' : Number(numericValue),
      },
    }));
  };

  const failQuantity = Object.values(inspectionData.defects).reduce((sum, current) => sum + Number(current), 0);
  const passQuantity = inspectionData.totalQuantity - failQuantity;
  const passRate = inspectionData.totalQuantity > 0 ? (passQuantity / inspectionData.totalQuantity) * 100 : 0;

  return (
    <HandyContainer>
      {/* 画面上部のシステムヘッダー */}
      <div className="bg-primary text-primary-foreground p-3 flex items-center shadow-md">
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center text-sm mr-2 hover:opacity-80 transition-opacity"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center">
          <img
            src="/KEYENCE_PICKUP_DEMO/LOGO.png"
            alt="KEYENCE LOGO"
            className="h-8 mr-2"
          />
          <div>
            <h1 className="text-lg font-bold">検査</h1>
            <p className="text-xs opacity-90">検査作業の進捗確認</p>
          </div>
        </div>
      </div>

      {/* 選択したデータ情報を表示するカード型ヘッダー */}
      <div className="px-2 pt-2">
        <div className="handy-card p-2 shadow-sm rounded-lg border-l-4 border-l-primary space-y-0.5">
          <div className="flex items-center text-sm">
            <span className="font-bold text-foreground w-16">品番:</span>
            <span className="text-muted-foreground text-lg font-bold">A-123456789</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-bold text-foreground w-16">日付:</span>
            <span className="text-muted-foreground">2025/08/25</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="font-bold text-foreground w-16">数量:</span>
            <span className="text-muted-foreground">15個</span>
          </div>
        </div>
      </div>

      {/* 検査結果の表示と不良項目の入力エリア */}
      <div className="p-2 space-y-1">
        {/* 検査結果の概要 */}
        <div className="handy-card p-2 shadow-sm rounded-lg border-l-4 border-l-primary">
          <h2 className="handy-text-medium text-foreground text-sm font-bold mb-1">検査結果</h2>
          <div className="grid grid-cols-3 gap-1 text-center text-sm handy-text-medium">
            <div>
              <div className="text-muted-foreground text-xs">合格</div>
              <div className="text-green-600 text-xl font-bold">{passQuantity}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">不良</div>
              <div className="text-red-600 text-xl font-bold">{failQuantity}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">合格率</div>
              <div className="text-foreground text-xl font-bold">{passRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* 不良項目の詳細 */}
        <div className="handy-card p-2 shadow-sm rounded-lg border-l-4 border-l-red-500">
          <div className="grid grid-cols-2 gap-1 text-sm">
            {Object.entries(inspectionData.defects).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center bg-gray-50 rounded-md px-2 py-0.5">
                <span className="text-muted-foreground text-base font-bold">{
                  key === 'foreignObject' ? '異物' :
                  key === 'scratch' ? 'キズ' :
                  key === 'stain' ? '汚れ' :
                  key === 'fold' ? '折れ' :
                  key === 'pressMisalignment' ? 'プレスズレ' : 'その他'
                }:</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleDefectChange(key as keyof typeof inspectionData.defects, e.target.value)}
                  className="w-16 handy-input text-foreground text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                  pattern="\d*"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 検査コメント入力欄 */}
        <div className="handy-card p-2 shadow-sm rounded-lg border-l-4 border-l-gray-500">
          <label htmlFor="comment" className="handy-text-medium text-foreground text-sm font-bold">検査コメント</label>
          <textarea
            id="comment"
            value={inspectionData.comment}
            onChange={(e) => setInspectionData({ ...inspectionData, comment: e.target.value })}
            placeholder="コメントを入力..."
            className="handy-input w-full min-h-[40px] text-sm mt-1"
          />
        </div>
      </div>
    </HandyContainer>
  );
};

export default InspectionPage;