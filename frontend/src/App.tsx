import React, { useState } from 'react';
import './App.css';
import WineSearchForm from './components/WineSearchForm';
import WineResult from './components/WineResult';

export interface WineResponse {
  wine: {
    name?: string;
    description_word: string;
    message: string;
  };
}

function App() {
  const [wineResult, setWineResult] = useState<WineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>🍷 Wine One Word</h1>
        <p>ワインの感想を一言で！</p>
      </header>
      
      <main className="App-main">
        <WineSearchForm
          onResult={handleSearchResult}
          onError={handleError}
          onLoadingChange={handleLoadingChange}
        />
        
        {isLoading && <div className="loading">検索中...</div>}
        
        {error && <div className="error">{error}</div>}
        
        {wineResult && !isLoading && (
          <WineResult result={wineResult} />
        )}
      </main>
    </div>
  );
}

export default App;