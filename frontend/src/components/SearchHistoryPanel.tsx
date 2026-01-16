import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { WineResponse } from '../App';

interface SearchHistoryPanelProps {
  onClose: () => void;
  onSelectResult?: (result: WineResponse) => void;
}

const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  onClose,
  onSelectResult
}) => {
  const { state, dispatch } = useApp();
  const { searchHistory, userPreferences } = state;

  const [filter, setFilter] = useState<'all' | 'search' | 'random' | 'quiz'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'query'>('date');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // フィルタリングとソート
  const filteredHistory = useMemo(() => {
    let filtered = searchHistory;

    // ソースによるフィルター
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.source === filter);
    }

    // ソート
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return b.timestamp.getTime() - a.timestamp.getTime();
      } else {
        return a.query.localeCompare(b.query);
      }
    });

    return filtered;
  }, [searchHistory, filter, sortBy]);

  const handleClearHistory = () => {
    if (window.confirm('検索履歴をすべて削除しますか？この操作は取り消せません。')) {
      dispatch({ type: 'CLEAR_SEARCH_HISTORY' });
    }
  };

  const handleSelectResult = (item: any) => {
    if (item.result && onSelectResult) {
      onSelectResult(item.result);
      onClose();
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'search': return '🔍';
      case 'random': return '🎲';
      case 'quiz': return '🧠';
      default: return '📝';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'search': return '検索';
      case 'random': return 'ランダム';
      case 'quiz': return 'クイズ';
      default: return 'その他';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportHistory = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalItems: searchHistory.length,
        history: searchHistory.map(item => ({
          query: item.query,
          source: item.source,
          timestamp: item.timestamp.toISOString(),
          result: item.result ? {
            name: item.result.wine.name,
            description: item.result.wine.description_word,
            message: item.result.wine.message,
            vintage: item.result.wine.vtg
          } : null
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `wine-search-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export history:', error);
    }
  };

  return (
    <div className="search-history-overlay">
      <div className="search-history-panel">
        {/* ヘッダー */}
        <div className="panel-header">
          <h2>🕒 検索履歴</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {/* コントロール */}
        <div className="panel-controls">
          <div className="filter-controls">
            <label>フィルター:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
              <option value="all">すべて</option>
              <option value="search">検索</option>
              <option value="random">ランダム</option>
              <option value="quiz">クイズ</option>
            </select>

            <label>並び順:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="date">日付</option>
              <option value="query">クエリ</option>
            </select>
          </div>

          <div className="action-controls">
            <button onClick={exportHistory} className="export-btn">
              📥 エクスポート
            </button>
            <button onClick={handleClearHistory} className="clear-btn">
              🗑️ クリア
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="history-stats">
          <div className="stat-item">
            <strong>総検索数:</strong> {searchHistory.length}件
          </div>
          <div className="stat-item">
            <strong>表示中:</strong> {filteredHistory.length}件
          </div>
          <div className="stat-item">
            <strong>成功率:</strong> {
              searchHistory.length > 0
                ? Math.round((searchHistory.filter(h => h.result).length / searchHistory.length) * 100)
                : 0
            }%
          </div>
        </div>

        {/* 履歴リスト */}
        <div className="history-list">
          {filteredHistory.length === 0 ? (
            <div className="no-history">
              <p>履歴がありません</p>
              <small>{filter !== 'all' ? 'フィルターを変更してみてください' : 'ワインを検索してみましょう！'}</small>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="item-header">
                  <div className="item-meta">
                    <span className="source-icon">{getSourceIcon(item.source)}</span>
                    <span className="source-label">{getSourceLabel(item.source)}</span>
                    <span className="timestamp">{formatDate(item.timestamp)}</span>
                  </div>
                  <button
                    onClick={() => setShowDetails(showDetails === item.id ? null : item.id)}
                    className="details-toggle"
                  >
                    {showDetails === item.id ? '▼' : '▶'}
                  </button>
                </div>

                <div className="item-content">
                  <div className="query-text">
                    <strong>検索:</strong> "{item.query}"
                  </div>

                  {item.result && (
                    <div className="result-preview">
                      <strong>結果:</strong> {item.result.wine.name || '名前不明'} - {item.result.wine.description_word}
                      <button
                        onClick={() => handleSelectResult(item)}
                        className="select-result-btn"
                      >
                        この結果を表示
                      </button>
                    </div>
                  )}

                  {!item.result && (
                    <div className="no-result">
                      検索結果なし
                    </div>
                  )}
                </div>

                {/* 詳細表示 */}
                {showDetails === item.id && item.result && (
                  <div className="item-details">
                    <div className="detail-row">
                      <strong>ワイン名:</strong> {item.result.wine.name || '不明'}
                    </div>
                    <div className="detail-row">
                      <strong>感想:</strong> {item.result.wine.description_word}
                    </div>
                    {item.result.wine.vtg && (
                      <div className="detail-row">
                        <strong>ヴィンテージ:</strong> {item.result.wine.vtg}年
                      </div>
                    )}
                    <div className="detail-row">
                      <strong>メッセージ:</strong> {item.result.wine.message}
                    </div>
                    {item.result.wine.tasting_notes && (
                      <div className="tasting-notes">
                        <strong>テイスティングノート:</strong>
                        <div className="notes-grid">
                          <div><strong>香り:</strong> {item.result.wine.tasting_notes.aroma}</div>
                          <div><strong>味:</strong> {item.result.wine.tasting_notes.taste}</div>
                          <div><strong>余韻:</strong> {item.result.wine.tasting_notes.finish}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchHistoryPanel;