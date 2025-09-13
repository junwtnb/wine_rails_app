import React, { useState } from 'react';
import { WineResponse } from '../App';

interface WineSearchFormProps {
  onResult: (result: WineResponse) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const WineSearchForm: React.FC<WineSearchFormProps> = ({
  onResult,
  onError,
  onLoadingChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchMode, setSearchMode] = useState<'name' | 'image'>('name');

  const handleNameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    onLoadingChange(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/wines/search_by_name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const data: WineResponse = await response.json();
      onResult(data);
    } catch (error) {
      onError(error instanceof Error ? error.message : '検索エラーが発生しました');
    } finally {
      onLoadingChange(false);
    }
  };

  const handleImageSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    onLoadingChange(true);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('http://localhost:3000/api/v1/wines/analyze_image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('画像の分析に失敗しました');
      }

      const data: WineResponse = await response.json();
      onResult(data);
    } catch (error) {
      onError(error instanceof Error ? error.message : '画像分析エラーが発生しました');
    } finally {
      onLoadingChange(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="wine-search-form">
      <div className="search-mode-toggle">
        <button
          type="button"
          className={`mode-btn ${searchMode === 'name' ? 'active' : ''}`}
          onClick={() => setSearchMode('name')}
        >
          名前で検索
        </button>
        <button
          type="button"
          className={`mode-btn ${searchMode === 'image' ? 'active' : ''}`}
          onClick={() => setSearchMode('image')}
        >
          画像で検索
        </button>
      </div>

      {searchMode === 'name' ? (
        <form onSubmit={handleNameSearch} className="search-form">
          <div className="form-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ワイン名を入力してください（例: Bordeaux, Chardonnay）"
              className="search-input"
            />
            <button type="submit" className="search-btn">
              感想を聞く
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleImageSearch} className="search-form">
          <div className="form-group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
            />
            <button type="submit" disabled={!selectedFile} className="search-btn">
              画像を分析する
            </button>
          </div>
          {selectedFile && (
            <p className="file-selected">
              選択された画像: {selectedFile.name}
            </p>
          )}
        </form>
      )}
    </div>
  );
};

export default WineSearchForm;