import React, { useState, useEffect } from 'react';

interface Wine {
  id: number;
  name: string;
  description_word: string;
  vtg?: number;
  created_at: string;
}

interface WineListProps {
  onClose: () => void;
}

const WineList: React.FC<WineListProps> = ({ onClose }) => {
  const [wines, setWines] = useState<Wine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWines();
  }, []);

  const fetchWines = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/v1/wines');

      if (!response.ok) {
        throw new Error('ワインの取得に失敗しました');
      }

      const data = await response.json();
      setWines(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="wine-list-overlay">
      <div className="wine-list-modal">
        <div className="wine-list-header">
          <h2>投稿したワインレビュー</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="wine-list-content">
          {isLoading && <div className="loading">読み込み中...</div>}

          {error && <div className="error">{error}</div>}

          {!isLoading && !error && wines.length === 0 && (
            <div className="empty-state">
              まだワインレビューが投稿されていません
            </div>
          )}

          {!isLoading && !error && wines.length > 0 && (
            <div className="wine-list-items">
              {wines.map((wine) => (
                <div key={wine.id} className="wine-item">
                  <div className="wine-item-header">
                    <h3 className="wine-name">{wine.name}</h3>
                    {wine.vtg && <span className="wine-vintage">({wine.vtg}年)</span>}
                  </div>
                  <div className="wine-description">
                    「{wine.description_word}」
                  </div>
                  <div className="wine-date">
                    {formatDate(wine.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WineList;