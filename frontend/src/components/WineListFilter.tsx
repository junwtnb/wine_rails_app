import React, { useState, useEffect, useMemo } from 'react';

interface Wine {
  id: number;
  name: string;
  description_word: string;
  vtg?: number;
  created_at: string;
}

interface WineListFilterProps {
  wines: Wine[];
  onFilteredChange: (filtered: Wine[]) => void;
}

const WineListFilter: React.FC<WineListFilterProps> = ({ wines, onFilteredChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'vintage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minYear, setMinYear] = useState<string>('');
  const [maxYear, setMaxYear] = useState<string>('');

  // Debounced search term using useEffect
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay for debouncing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and sort wines using useMemo and useEffect
  const filteredWines = useMemo(() => {
    let filtered = wines;

    // Filter by search term
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(wine =>
        wine.name?.toLowerCase().includes(searchLower) ||
        wine.description_word?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by vintage year range
    if (minYear || maxYear) {
      filtered = filtered.filter(wine => {
        if (!wine.vtg) return !minYear && !maxYear; // Include wines without vintage if no filter
        const vintage = wine.vtg;
        const min = minYear ? parseInt(minYear) : 0;
        const max = maxYear ? parseInt(maxYear) : 9999;
        return vintage >= min && vintage <= max;
      });
    }

    // Sort wines
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'vintage':
          aValue = a.vtg || 0;
          bValue = b.vtg || 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [wines, debouncedSearchTerm, sortBy, sortOrder, minYear, maxYear]);

  // Update parent component when filtered results change
  useEffect(() => {
    onFilteredChange(filteredWines);
  }, [filteredWines, onFilteredChange]);

  // Auto-save filter preferences to localStorage
  useEffect(() => {
    const preferences = {
      sortBy,
      sortOrder,
      minYear,
      maxYear
    };
    localStorage.setItem('wine-filter-preferences', JSON.stringify(preferences));
  }, [sortBy, sortOrder, minYear, maxYear]);

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('wine-filter-preferences');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        setSortBy(preferences.sortBy || 'date');
        setSortOrder(preferences.sortOrder || 'desc');
        setMinYear(preferences.minYear || '');
        setMaxYear(preferences.maxYear || '');
      } catch (e) {
        // Ignore invalid saved data
      }
    }
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setMinYear('');
    setMaxYear('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="wine-list-filter">
      <div className="filter-section">
        <h3>🔍 ワイン検索・フィルター</h3>

        {/* Search Input */}
        <div className="filter-group">
          <label htmlFor="search">キーワード検索</label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ワイン名や感想で検索..."
            className="filter-input"
          />
          {searchTerm && (
            <small className="search-info">
              「{debouncedSearchTerm}」で検索中... ({filteredWines.length}件)
            </small>
          )}
        </div>

        {/* Vintage Year Filter */}
        <div className="filter-group">
          <label>ヴィンテージ年</label>
          <div className="year-range">
            <input
              type="number"
              value={minYear}
              onChange={(e) => setMinYear(e.target.value)}
              placeholder="1980"
              min="1800"
              max={currentYear}
              className="year-input"
            />
            <span className="year-separator">〜</span>
            <input
              type="number"
              value={maxYear}
              onChange={(e) => setMaxYear(e.target.value)}
              placeholder={currentYear.toString()}
              min="1800"
              max={currentYear}
              className="year-input"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div className="filter-group">
          <label>並び順</label>
          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'vintage')}
              className="sort-select"
            >
              <option value="date">登録日</option>
              <option value="name">ワイン名</option>
              <option value="vintage">ヴィンテージ年</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-toggle"
              title={sortOrder === 'asc' ? '昇順' : '降順'}
            >
              {sortOrder === 'asc' ? '↗️' : '↙️'}
            </button>
          </div>
        </div>

        {/* Filter Stats & Clear */}
        <div className="filter-stats">
          <div className="results-count">
            <strong>{filteredWines.length}</strong> / {wines.length} 件表示
            {filteredWines.length !== wines.length && (
              <span className="filtered-indicator"> (フィルター適用中)</span>
            )}
          </div>
          <button onClick={clearFilters} className="clear-filters-btn">
            🗑️ クリア
          </button>
        </div>
      </div>
    </div>
  );
};

export default WineListFilter;