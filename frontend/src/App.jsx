import { useState } from 'react'
import './App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('ワイン名を入力してください')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/v1/wines/search_by_name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      })

      if (!response.ok) {
        throw new Error('検索に失敗しました')
      }

      const data = await response.json()
      setResult(data.wine)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">ワイン感想一言</h1>
        <p className="subtitle">ワインの名前を入力すると、「飲みやすい」以外の一言で感想をお答えします</p>
        
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ワイン名を入力してください（例：シャトー・マルゴー）"
            className="search-input"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="search-button"
          >
            {loading ? '分析中...' : '検索'}
          </button>
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {result && (
          <div className="result-card">
            <h2 className="wine-name">{result.name}</h2>
            <div className="description-container">
              <span className="description-label">一言感想:</span>
              <span className="description-word">{result.description_word}</span>
            </div>
            {result.message && (
              <p className="result-message">{result.message}</p>
            )}
            {result.wine_type && (
              <div className="wine-details">
                <p><strong>種類:</strong> {result.wine_type}</p>
                {result.region && <p><strong>産地:</strong> {result.region}</p>}
                {result.producer && <p><strong>生産者:</strong> {result.producer}</p>}
                {result.vintage_year && <p><strong>年代:</strong> {result.vintage_year}年</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App