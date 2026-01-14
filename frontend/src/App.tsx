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
import ThemeManager from './components/ThemeManager';
import NetworkStatus from './components/NetworkStatus';
import UserActivityTracker from './components/UserActivityTracker';

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

function App() {
  const [wineResult, setWineResult] = useState<WineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const [showWineList, setShowWineList] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizStatistics, setShowQuizStatistics] = useState(false);

  const handleSearchResult = (result: WineResponse) => {
    setWineResult(result);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setWineResult(null);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  const handleAddSuccess = (message: string) => {
    setSuccessMessage(message);
    setError(null);
    setShowAddForm(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccessMessage(null);
  };

  return (
    <ThemeManager>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <HamburgerMenu
              onShowWineList={() => setShowWineList(true)}
              onShowAddForm={() => setShowAddForm(true)}
              onShowStatistics={() => setShowStatistics(true)}
              onShowQuiz={() => setShowQuiz(true)}
              onShowQuizStatistics={() => setShowQuizStatistics(true)}
            />
            <div className="header-text">
              <h1>Wine One Word</h1>
              <p>ワインの感想を「飲みやすい」以外の一言で！</p>
            </div>
            {/* Network Status and Activity Tracker in header */}
            <div className="header-status">
              <NetworkStatus showNotification={true} />
              <UserActivityTracker showStats={false} />
            </div>
          </div>
        </header>

      <main className="App-main">
        <WineSearchForm
          onResult={handleSearchResult}
          onError={handleError}
          onLoadingChange={handleLoadingChange}
          isLoading={isLoading}
        />

        {isLoading && <div className="loading">検索中...</div>}

        {error && <div className="error">{error}</div>}

        {successMessage && <div className="success">{successMessage}</div>}

        {wineResult && !isLoading && (
          <WineResult result={wineResult} />
        )}

        {showAddForm && (
          <AddWineForm
            onSuccess={handleAddSuccess}
            onError={handleAddError}
            onLoadingChange={handleLoadingChange}
          />
        )}
      </main>

      <footer className="App-footer">
        <div className="usage-guide">
          <h3
            className="usage-toggle"
            onClick={() => setShowUsageGuide(!showUsageGuide)}
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

        {/* Scroll to top button */}
        <ScrollToTop threshold={400} />

        {/* User Activity Tracker (visible in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1000 }}>
            <UserActivityTracker showStats={true} />
          </div>
        )}
      </div>
    </ThemeManager>
  );
}

export default App;