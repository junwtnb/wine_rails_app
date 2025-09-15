import React, { useState } from 'react';
import './App.css';
import WineSearchForm from './components/WineSearchForm';
import WineResult from './components/WineResult';
import AddWineForm from './components/AddWineForm';

export interface WineResponse {
  wine: {
    name?: string;
    description_word: string;
    vtg?: number;
    message: string;
  };
}

function App() {
  const [wineResult, setWineResult] = useState<WineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    // 3秒後にメッセージを消す
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAddError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccessMessage(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Wine One Word</h1>
        <p>ワインの感想を「飲みやすい」以外の一言で！</p>
      </header>
      
      <main className="App-main">
        <WineSearchForm
          onResult={handleSearchResult}
          onError={handleError}
          onLoadingChange={handleLoadingChange}
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
        
        {!showAddForm && (
          <button 
            className="add-wine-btn"
            onClick={() => setShowAddForm(true)}
          >
            感想を追加
          </button>
        )}
      </main>
    </div>
  );
}

export default App;