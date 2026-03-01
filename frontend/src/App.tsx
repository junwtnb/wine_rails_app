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

  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showWineList, setShowWineList] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizStatistics, setShowQuizStatistics] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [showVineyardGame, setShowVineyardGame] = useState(false);

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
  };

  const handleError = (errorMessage: string) => {
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    dispatch({ type: 'SET_WINE_RESULT', payload: null });
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

  const handleAdvancedFormSubmit = async (formData: any) => {
    try {
      // APIへの送信処理をここに実装
      console.log('Advanced Wine Form submitted:', formData);

      handleAddSuccess('詳細ワイン登録が完了しました！');
      setShowAdvancedForm(false);
    } catch (error) {
      handleAddError('詳細ワイン登録に失敗しました');
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

          {state.error && <div className="error" role="alert" aria-live="assertive">{state.error}</div>}

          {state.successMessage && <div className="success" role="status" aria-live="polite">{state.successMessage}</div>}

          {state.currentWineResult && !state.isLoading && (
            <WineResult result={state.currentWineResult} />
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