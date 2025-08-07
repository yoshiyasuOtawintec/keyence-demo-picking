import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import React from 'react';

// 各ページコンポーネントのインポート
import LoginPage from "./pages/LoginPage";
import PlanSelectionPage from "./pages/PlanSelectionPage";
import PickingPage from "./pages/PickingPage";
import NotFound from "./pages/NotFound";
import ScanTestPage from "./pages/ScanTestPage"; // ★追加: ScanTestPageをインポート

// AppStateProvider は contextフォルダから、useAppState は hooksフォルダからインポート
import { AppStateProvider } from './context/AppStateContext';
import { useAppState } from './hooks/useAppState';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* アプリケーション全体を AppStateProvider でラップ */}
        <AppStateProvider>
          <HashRouter>
            <Routes>
              {/* ログイン画面 */}
              <Route path="/" element={<LoginRoute />} />

              {/* 計画選択画面 - ログイン済みの場合のみアクセス可能 */}
              <Route path="/plan-selection" element={<PlanSelectionRoute />} />

              {/* ピッキング画面 - 計画が選択済みの場合のみアクセス可能 */}
              <Route path="/picking" element={<PickingRoute />} />

              {/* 読み取りテスト画面 - ログイン状態に関わらずアクセス可能とする */}
              <Route path="/scan-test" element={<ScanTestPage />} /> {/* ★追加: 読み取りテスト画面のルート */}

              {/* 上記のどのルートにもマッチしない場合、NotFoundコンポーネントが表示される */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </AppStateProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// ログイン画面へのルーティングを制御するコンポーネント
const LoginRoute = () => {
  const { currentUser } = useAppState();
  // 既にログインしている場合は計画選択画面へリダイレクト
  if (currentUser) {
    return <Navigate to="/plan-selection" replace />;
  }
  return <LoginPage />;
};

// 計画選択画面へのルーティングを制御するコンポーネント
const PlanSelectionRoute = () => {
  const { currentUser } = useAppState();
  // ログインしていない場合はログイン画面へリダイレクト
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return <PlanSelectionPage />;
};

// ピッキング画面へのルーティングを制御するコンポーネント
const PickingRoute = () => {
  const { currentUser, selectedPlan } = useAppState();
  // ログインしていない、または計画が選択されていない場合は計画選択画面へリダイレクト
  if (!currentUser || !selectedPlan) {
    return <Navigate to="/plan-selection" replace />;
  }
  return <PickingPage />;
};

export default App;
