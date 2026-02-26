import React, { useState, useCallback, useMemo, memo } from 'react';

interface Wine {
  id: number;
  name: string;
  winery: string;
  region: string;
  vintage: number;
  description: string;
  score: number;
}

interface OptimizedWineSearchProps {
  onClose: () => void;
}

// メモ化されたワインカードコンポーネント
const WineCard = memo<{ wine: Wine; onSelect: (wine: Wine) => void }>(({ wine, onSelect }) => {

  // useCallbackでクリックハンドラーをメモ化
  const handleClick = useCallback(() => {
    onSelect(wine);
  }, [wine, onSelect]);

  return (
    <div className="wine-card" onClick={handleClick}>
      <div className="wine-header">
        <h3>{wine.name}</h3>
        <div className="wine-score">⭐ {wine.score}/5</div>
      </div>
      <div className="wine-details">
        <p className="winery">🏭 {wine.winery}</p>
        <p className="region">📍 {wine.region}</p>
        <p className="vintage">📅 {wine.vintage}年</p>
      </div>
      <p className="description">{wine.description}</p>
    </div>
  );
});

WineCard.displayName = 'WineCard';

// メモ化されたフィルターコンポーネント
const SearchFilters = memo<{
  searchTerm: string;
  onSearchChange: (value: string) => void;
  minScore: number;
  onMinScoreChange: (value: number) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}>(({ searchTerm, onSearchChange, minScore, onMinScoreChange, sortBy, onSortChange }) => {

  return (
    <div className="search-filters">
      <div className="filter-group">
        <label>🔍 キーワード検索</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ワイン名、ワイナリー、地域で検索..."
          className="search-input"
        />
      </div>

      <div className="filter-group">
        <label>⭐ 最低評価</label>
        <select
          value={minScore}
          onChange={(e) => onMinScoreChange(Number(e.target.value))}
          className="score-filter"
        >
          <option value={0}>すべて</option>
          <option value={1}>⭐ 1以上</option>
          <option value={2}>⭐ 2以上</option>
          <option value={3}>⭐ 3以上</option>
          <option value={4}>⭐ 4以上</option>
          <option value={5}>⭐ 5のみ</option>
        </select>
      </div>

      <div className="filter-group">
        <label>📊 並び順</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="sort-filter"
        >
          <option value="name">名前順</option>
          <option value="score">評価順</option>
          <option value="vintage">ヴィンテージ順</option>
          <option value="winery">ワイナリー順</option>
        </select>
      </div>
    </div>
  );
});

SearchFilters.displayName = 'SearchFilters';

// メイン検索コンポーネント
const OptimizedWineSearch: React.FC<OptimizedWineSearchProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);


  // サンプルデータ（本来はAPIから取得）
  const allWines: Wine[] = useMemo(() => [
    { id: 1, name: 'シャブリ プルミエ・クリュ', winery: 'ドメーヌ・ルイ・ミッシェル', region: 'ブルゴーニュ', vintage: 2020, description: 'ミネラル豊富で爽やかな白ワイン', score: 4 },
    { id: 2, name: 'バローロ リゼルヴァ', winery: 'アンティノリ', region: 'ピエモンテ', vintage: 2018, description: '力強いタンニンと複雑な香り', score: 5 },
    { id: 3, name: 'シャンパーニュ ブリュット', winery: 'ヴーヴ・クリコ', region: 'シャンパーニュ', vintage: 2015, description: 'エレガントな泡立ちと豊かな香り', score: 5 },
    { id: 4, name: 'リオハ クリアンサ', winery: 'マルケス・デ・リスカル', region: 'リオハ', vintage: 2019, description: 'バランスの取れた赤ワイン', score: 3 },
    { id: 5, name: 'ソーヴィニヨン・ブラン', winery: 'クラウディ・ベイ', region: 'マールボロ', vintage: 2021, description: 'フレッシュで爽やかな味わい', score: 4 },
    { id: 6, name: 'カベルネ・ソーヴィニヨン', winery: 'オーパス・ワン', region: 'ナパヴァレー', vintage: 2017, description: 'プレミアムカリフォルニアワイン', score: 5 },
    { id: 7, name: 'ピノ・ノワール', winery: 'ドメーヌ・ド・ラ・ロマネ=コンティ', region: 'ブルゴーニュ', vintage: 2019, description: '世界最高峰のピノ・ノワール', score: 5 },
    { id: 8, name: 'プロセッコ', winery: 'ヴィッラ・サンディ', region: 'ヴェネト', vintage: 2022, description: '軽やかで親しみやすいスパークリング', score: 2 },
    { id: 9, name: 'シラーズ', winery: 'ペンフォールズ', region: 'バロッサヴァレー', vintage: 2020, description: 'パワフルでスパイシーな赤ワイン', score: 4 },
    { id: 10, name: 'リースリング', winery: 'ドクター・ローゼン', region: 'モーゼル', vintage: 2021, description: '上品な甘みと酸味のバランス', score: 3 }
  ], []);

  // useCallbackでハンドラーをメモ化（不要な再レンダリングを防止）
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleMinScoreChange = useCallback((value: number) => {
    setMinScore(value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  const handleWineSelect = useCallback((wine: Wine) => {
    setSelectedWine(wine);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedWine(null);
  }, []);

  // useMemoで重い計算をメモ化
  const filteredAndSortedWines = useMemo(() => {

    let filtered = allWines;

    // テキスト検索
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(wine =>
        wine.name.toLowerCase().includes(searchLower) ||
        wine.winery.toLowerCase().includes(searchLower) ||
        wine.region.toLowerCase().includes(searchLower)
      );
    }

    // 評価フィルター
    if (minScore > 0) {
      filtered = filtered.filter(wine => wine.score >= minScore);
    }

    // ソート
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'vintage':
          return b.vintage - a.vintage;
        case 'winery':
          return a.winery.localeCompare(b.winery);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [allWines, searchTerm, minScore, sortBy]);

  // パフォーマンス統計のメモ化
  const performanceStats = useMemo(() => ({
    totalWines: allWines.length,
    filteredWines: filteredAndSortedWines.length,
    averageScore: filteredAndSortedWines.length > 0
      ? (filteredAndSortedWines.reduce((sum, wine) => sum + wine.score, 0) / filteredAndSortedWines.length).toFixed(1)
      : '0.0'
  }), [allWines.length, filteredAndSortedWines]);

  return (
    <div className="optimized-search-overlay">
      <div className="optimized-search-container">
        {/* ヘッダー */}
        <div className="search-header">
          <h2>🚀 最適化ワイン検索</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        {/* パフォーマンス統計 */}
        <div className="performance-stats">
          <div className="stat-item">
            <strong>総数:</strong> {performanceStats.totalWines}本
          </div>
          <div className="stat-item">
            <strong>表示:</strong> {performanceStats.filteredWines}本
          </div>
          <div className="stat-item">
            <strong>平均評価:</strong> ⭐ {performanceStats.averageScore}
          </div>
        </div>

        {/* フィルター */}
        <SearchFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          minScore={minScore}
          onMinScoreChange={handleMinScoreChange}
          sortBy={sortBy}
          onSortChange={handleSortChange}
        />

        {/* ワインリスト */}
        <div className="wine-list">
          {filteredAndSortedWines.length === 0 ? (
            <div className="no-results">
              <p>条件に合うワインが見つかりません 🤔</p>
              <small>検索条件を変更してみてください</small>
            </div>
          ) : (
            filteredAndSortedWines.map(wine => (
              <WineCard
                key={wine.id}
                wine={wine}
                onSelect={handleWineSelect}
              />
            ))
          )}
        </div>

        {/* ワイン詳細モーダル */}
        {selectedWine && (
          <div className="wine-detail-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{selectedWine.name}</h3>
                <button onClick={handleCloseDetail} className="close-btn">✕</button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>ワイナリー:</strong> {selectedWine.winery}
                  </div>
                  <div className="detail-item">
                    <strong>地域:</strong> {selectedWine.region}
                  </div>
                  <div className="detail-item">
                    <strong>ヴィンテージ:</strong> {selectedWine.vintage}年
                  </div>
                  <div className="detail-item">
                    <strong>評価:</strong> ⭐ {selectedWine.score}/5
                  </div>
                  <div className="detail-item full-width">
                    <strong>説明:</strong> {selectedWine.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 開発モード：パフォーマンス情報 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-info">
            <h4>🔧 開発者情報</h4>
            <p>• React.memo, useCallback, useMemo でパフォーマンス最適化</p>
            <p>• useCallback, useMemo, React.memo を活用</p>
            <p>• フィルター変更時の無駄な再レンダリングを防止</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedWineSearch;