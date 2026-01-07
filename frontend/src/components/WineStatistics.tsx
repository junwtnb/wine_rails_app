import React, { useState, useEffect } from 'react';

interface WineStatistics {
  total_searches: number;
  favorite_regions: Record<string, number>;
  favorite_wine_types: Record<string, number>;
  favorite_descriptions: Record<string, number>;
  vintage_preferences: Record<string, number>;
  recent_searches: [string, string][];
}

interface WineStatisticsProps {
  onClose: () => void;
}

const WineStatistics: React.FC<WineStatisticsProps> = ({ onClose }) => {
  const [statistics, setStatistics] = useState<WineStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateSessionId = () => {
    const stored = localStorage.getItem('wine-session-id');
    if (stored) return stored;

    const newSessionId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('wine-session-id', newSessionId);
    return newSessionId;
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const sessionId = generateSessionId();
        const response = await fetch('http://localhost:3000/api/v1/wines/statistics', {
          headers: {
            'X-Session-ID': sessionId,
          },
        });

        if (!response.ok) {
          throw new Error('統計データの取得に失敗しました');
        }

        const data = await response.json();
        setStatistics(data.statistics);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const renderTopList = (data: Record<string, number>, title: string, emoji: string) => {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (sortedData.length === 0) {
      return (
        <div className="stat-section">
          <h3>{emoji} {title}</h3>
          <p className="no-data">まだデータがありません</p>
        </div>
      );
    }

    return (
      <div className="stat-section">
        <h3>{emoji} {title}</h3>
        <div className="stat-list">
          {sortedData.map(([name, count], index) => (
            <div key={name} className="stat-item">
              <span className="stat-rank">#{index + 1}</span>
              <span className="stat-name">{name}</span>
              <span className="stat-count">{count}回</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading">統計データを読み込み中...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!statistics) return <div className="error">データが見つかりませんでした</div>;

  return (
    <div className="wine-statistics-overlay">
      <div className="wine-statistics">
        <div className="statistics-header">
          <h2>🍷 あなたのワイン傾向分析</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="statistics-content">
          <div className="summary-section">
            <div className="summary-card">
              <div className="summary-number">{statistics.total_searches}</div>
              <div className="summary-label">検索回数</div>
            </div>
          </div>

          <div className="statistics-grid">
            {renderTopList(statistics.favorite_wine_types, 'お気に入りワインタイプ', '🍷')}
            {renderTopList(statistics.favorite_descriptions, 'よく使う感想', '💭')}
            {renderTopList(statistics.favorite_regions, 'お気に入り産地', '🌍')}
          </div>

          {statistics.recent_searches.length > 0 && (
            <div className="stat-section">
              <h3>🕒 最近の検索</h3>
              <div className="recent-searches">
                {statistics.recent_searches.map(([name, description], index) => (
                  <div key={index} className="recent-search-item">
                    <span className="wine-name">{name}</span>
                    <span className="description">「{description}」</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="stats-note">
            <p>📊 過去30日間のデータを表示しています</p>
            <small>より多くのワインを検索すると、より詳細な傾向分析が可能になります！</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WineStatistics;