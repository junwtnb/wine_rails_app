import React, { useState } from 'react';
import './App.css';
import WineSearchForm from './components/WineSearchForm';
import WineResult from './components/WineResult';
import AddWineForm from './components/AddWineForm';
import WineList from './components/WineList';
import HamburgerMenu from './components/HamburgerMenu';
import WineStatistics from './components/WineStatistics';
import WineQuiz from './components/WineQuiz';
import WineQuizStatistics from './components/WineQuizStatistics';
import ScrollToTop from './components/ScrollToTop';
import UserActivityTracker from './components/UserActivityTracker';
import SearchHistoryPanel from './components/SearchHistoryPanel';
import UserSettingsPanel from './components/UserSettingsPanel';
import AdvancedWineForm from './components/AdvancedWineForm';
import SimpleVineyardGame from './components/SimpleVineyardGame';
import HeaderControls from './components/HeaderControls';
import ToastContainer from './components/ToastContainer';
import { ToastMessage } from './components/ToastNotification';
import { AppProvider, useApp } from './contexts/AppContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

export interface WineRegion {
  name: string;
  country: string;
  coordinates?: { lat: number; lng: number } | null;
  description: string;
}

export interface TastingNotes {
  aroma: string;
  taste: string;
  finish: string;
}

export interface WineResponse {
  wine: {
    name?: string;
    description_word: string;
    tasting_notes?: TastingNotes;
    vtg?: number;
    message: string;
    wine_type?: string;
    is_generic?: boolean;
    region?: WineRegion;
  };
}

// 内部アプリコンポーネント
function AppContent() {
  const { state, dispatch } = useApp();

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showWineList, setShowWineList] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizStatistics, setShowQuizStatistics] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [showVineyardGame, setShowVineyardGame] = useState(false);

  // Toast管理関数
  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccessToast = (title: string, message: string, action?: ToastMessage['action']) => {
    addToast({ type: 'success', title, message, action, duration: 4000 });
  };

  const showErrorToast = (title: string, message: string, action?: ToastMessage['action']) => {
    addToast({ type: 'error', title, message, action, duration: 5000 });
  };

  const showInfoToast = (title: string, message: string, action?: ToastMessage['action']) => {
    addToast({ type: 'info', title, message, action, duration: 4000 });
  };

  const handleSearchResult = (result: WineResponse, query: string = '', source: 'search' | 'random' | 'quiz' = 'search') => {
    dispatch({ type: 'SET_WINE_RESULT', payload: result });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'INCREMENT_TOTAL_SEARCHES' });

    // 検索履歴に追加
    if (state.userPreferences.autoSaveSearchHistory) {
      dispatch({
        type: 'ADD_SEARCH_HISTORY',
        payload: { query, result, source }
      });
    }

    // 成功Toast表示
    showSuccessToast(
      '検索完了！',
      `「${result.wine.name || 'ワイン'}」の情報を取得しました`,
      {
        label: '履歴を見る',
        onClick: () => setShowSearchHistory(true)
      }
    );
  };

  const handleError = (errorMessage: string) => {
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    dispatch({ type: 'SET_WINE_RESULT', payload: null });

    // エラーToast表示
    showErrorToast(
      '検索エラー',
      errorMessage,
      {
        label: '再試行',
        onClick: () => dispatch({ type: 'SET_ERROR', payload: null })
      }
    );
  };

  const handleLoadingChange = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const handleAddSuccess = (message: string) => {
    dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: message });
    dispatch({ type: 'SET_ERROR', payload: null });
    setTimeout(() => dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: null }), 3000);
  };

  const handleAddError = (errorMessage: string) => {
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    dispatch({ type: 'SET_SUCCESS_MESSAGE', payload: null });
  };

  // AdvancedWineFormの型定義をimport
  interface AdvancedWineFormData {
    basicInfo: {
      name: string;
      winery: string;
      vintage: string;
      region: string;
      country: string;
      type: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | '';
      price: string;
    };
    tastingNotes: {
      appearance: {
        color: string;
        clarity: 'brilliant' | 'clear' | 'hazy' | '';
        intensity: 'light' | 'medium' | 'deep' | '';
      };
      aroma: {
        intensity: 'light' | 'medium' | 'pronounced' | '';
        characteristics: string[];
        notes: string;
      };
      taste: {
        sweetness: 'bone-dry' | 'dry' | 'off-dry' | 'medium-sweet' | 'sweet' | '';
        acidity: 'low' | 'medium-' | 'medium' | 'medium+' | 'high' | '';
        tannin: 'low' | 'medium-' | 'medium' | 'medium+' | 'high' | '';
        body: 'light' | 'medium-' | 'medium' | 'medium+' | 'full' | '';
        alcohol: 'low' | 'medium' | 'high' | '';
        flavor: string;
        finish: 'short' | 'medium' | 'long' | '';
      };
    };
    rating: {
      overall: number;
      value: number;
      drinkNow: boolean;
      ageingPotential: 'drink-now' | '1-3-years' | '3-5-years' | '5-10-years' | '10+-years' | '';
      foodPairing: string[];
      personalNotes: string;
    };
  }

  const handleAdvancedFormSubmit = async (formData: AdvancedWineFormData) => {
    try {
      // APIへの送信処理をここに実装
      console.log('Advanced Wine Form submitted:', formData);

      showSuccessToast(
        '登録完了！',
        '詳細ワイン情報が正常に登録されました',
        {
          label: 'ワインリストを見る',
          onClick: () => setShowWineList(true)
        }
      );
      setShowAdvancedForm(false);
    } catch (error) {
      showErrorToast(
        '登録失敗',
        '詳細ワイン登録に失敗しました。再度お試しください。',
        {
          label: 'フォームに戻る',
          onClick: () => setShowAdvancedForm(true)
        }
      );
    }
  };

  return (
    <div className="App">
      <header className="App-header" role="banner">
        <div className="header-content">
          <HamburgerMenu
            onShowWineList={() => setShowWineList(true)}
            onShowAddForm={() => setShowAdvancedForm(true)}
            onShowStatistics={() => setShowStatistics(true)}
            onShowQuiz={() => setShowQuiz(true)}
            onShowQuizStatistics={() => setShowQuizStatistics(true)}
          />
          <div className="header-text">
            <h1>Wine One Word</h1>
            <p>ワインの感想を「飲みやすい」以外の一言で！</p>
          </div>
          {/* Header controls */}
          <HeaderControls
            showNotifications={state.userPreferences.showNotifications}
            onShowAdvancedForm={() => setShowAdvancedForm(true)}
            onShowSearchHistory={() => setShowSearchHistory(true)}
            onShowVineyardGame={() => setShowVineyardGame(true)}
            onShowUserSettings={() => setShowUserSettings(true)}
          />
        </div>
      </header>

      <main className="App-main" role="main">
        {/* 検索セクション */}
        <section className="search-section" aria-label="ワイン検索">
          <WineSearchForm
            onResult={(result, query) => handleSearchResult(result, query, 'search')}
            onError={handleError}
            onLoadingChange={handleLoadingChange}
            isLoading={state.isLoading}
          />
        </section>

        {/* 結果セクション */}
        <section className="results-section" aria-label="検索結果" aria-live="polite">
          {state.isLoading && (
            <div className="loading-container" role="status" aria-label="検索中">
              <div className="loading-spinner"></div>
              <div className="loading-text">検索中...</div>
            </div>
          )}


          {state.currentWineResult && !state.isLoading && (
            <WineResult result={state.currentWineResult} />
          )}

          {!state.currentWineResult && !state.isLoading && !state.error && !state.successMessage && (
            <div className="empty-state">
              <div className="empty-state-icon">🍷</div>
              <h2 className="empty-state-title">ワインの世界へようこそ</h2>
              <p className="empty-state-description">
                お気に入りのワインを見つけるために、<br />
                ワイン名や特徴を入力してみてください
              </p>
              <div className="empty-state-suggestions">
                <div className="suggestion-item">
                  <span className="suggestion-icon">🔍</span>
                  <span>「シャルドネ」「カベルネ」などのぶどう品種</span>
                </div>
                <div className="suggestion-item">
                  <span className="suggestion-icon">🌍</span>
                  <span>「フランス」「イタリア」などの産地</span>
                </div>
                <div className="suggestion-item">
                  <span className="suggestion-icon">🎯</span>
                  <span>「辛口」「甘口」などの味わい</span>
                </div>
              </div>
            </div>
          )}
        </section>

      </main>

      <footer className="App-footer" role="contentinfo">
        <div className="usage-guide">
          <h3
            className="usage-toggle"
            onClick={() => setShowUsageGuide(!showUsageGuide)}
            role="button"
            tabIndex={0}
            aria-expanded={showUsageGuide}
            aria-label="使用ガイドの表示切り替え"
          >
            こんなときにつかってください {showUsageGuide ? '▲' : '▼'}
          </h3>
          {showUsageGuide && (
            <div className="usage-content">
              <p>ワインの感想を求められたけれど、<br/>
                うまく言えない...<br/>
              </p>
              <small>「赤」「シャルドネ」「フランス」など、知ってることを何でも入力してみてください</small>
            </div>
          )}
        </div>
      </footer>

      {showWineList && (
        <WineList onClose={() => setShowWineList(false)} />
      )}

      {showStatistics && (
        <WineStatistics onClose={() => setShowStatistics(false)} />
      )}

      {showQuiz && (
        <WineQuiz onClose={() => setShowQuiz(false)} />
      )}

      {showQuizStatistics && (
        <WineQuizStatistics onClose={() => setShowQuizStatistics(false)} />
      )}

      {showSearchHistory && (
        <SearchHistoryPanel
          onClose={() => setShowSearchHistory(false)}
          onSelectResult={(result) => {
            dispatch({ type: 'SET_WINE_RESULT', payload: result });
            setShowSearchHistory(false);
          }}
        />
      )}

      {showUserSettings && (
        <UserSettingsPanel onClose={() => setShowUserSettings(false)} />
      )}

      {showAdvancedForm && (
        <AdvancedWineForm
          onSubmit={handleAdvancedFormSubmit}
          onCancel={() => setShowAdvancedForm(false)}
        />
      )}

      {showVineyardGame && (
        <SimpleVineyardGame onClose={() => setShowVineyardGame(false)} />
      )}

      {/* Scroll to top button */}
      <ScrollToTop threshold={400} />

      {/* User Activity Tracker (visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
          <UserActivityTracker
            showStats={true}
            onActivityChange={(isActive) => {
              dispatch({ type: 'SET_USER_ACTIVE', payload: isActive });
            }}
          />
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}

// メインアプリコンポーネント（プロバイダーでラップ）
function App() {
  return (
    <AppProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;