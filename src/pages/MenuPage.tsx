import React, { useEffect } from 'react';
import { LogOut, List, QrCode, CheckCircle2 } from 'lucide-react';
import HandyContainer from '../components/HandyContainer';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';

const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, clearAppState } = useAppState();

  // ログインしていない場合はログイン画面へリダイレクト
  useEffect(() => {
    if (!currentUser) {
      console.warn("MenuPage: currentUser is missing. Redirecting to login.");
      navigate('/');
    }
  }, [currentUser, navigate]);

  // ログアウト時のハンドラ
  const handleLogout = () => {
    clearAppState();
    navigate('/');
  };

  return (
    <HandyContainer>
      {/* ここから追加 */}
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
      {/* ここまで追加 */}
      
      <div className="p-2 space-y-4">
        {/* 担当者情報とログアウト */}
        <div className="handy-card flex justify-between items-center mb-4 p-3">
          {currentUser && (
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">
                ようこそ、{currentUser.TANTO_NAME} さん！
              </span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} className="mr-1" />
            ログアウト
          </button>
        </div>

        {/* メニューオプション */}
        <div className="space-y-2">
          {/* ピッキング作業ボタン */}
          <button
            onClick={() => navigate('/plan-selection')}
            className="handy-card w-full flex items-center p-4 rounded-lg shadow-sm hover:bg-accent/5 transition-colors"
          >
            <List size={20} className="text-primary mr-3" />
            <span className="handy-text-medium text-foreground">ピッキング作業</span>
          </button>


          {/* 検査メニューボタンを追加 */}
          <button
            onClick={() => navigate('/inspection')}
            className="handy-card w-full flex items-center p-4 rounded-lg shadow-sm hover:bg-accent/5 transition-colors"
          >
            <CheckCircle2 size={20} className="text-primary mr-3" />
            <span className="handy-text-medium text-foreground">検査</span>
          </button>

          {/* 読み取りテストボタン */}
          <button
            onClick={() => navigate('/scan-test')}
            className="handy-card w-full flex items-center p-4 rounded-lg shadow-sm hover:bg-accent/5 transition-colors"
          >
            <QrCode size={20} className="text-primary mr-3" />
            <span className="handy-text-medium text-foreground">読み取りテスト</span>
          </button>
        </div>
      </div>
    </HandyContainer>
  );
};

export default MenuPage;