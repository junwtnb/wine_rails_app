import React, { useState } from 'react';
import { WineResponse } from '../App';
import Spinner from './Spinner';

interface WineSearchFormProps {
  onResult: (result: WineResponse) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
  isLoading: boolean;
}

const WineSearchForm: React.FC<WineSearchFormProps> = ({
  onResult,
  onError,
  onLoadingChange,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchMode, setSearchMode] = useState<'name' | 'image'>('name');

  const generateSessionId = () => {
    const stored = localStorage.getItem('wine-session-id');
    if (stored) return stored;

    const newSessionId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('wine-session-id', newSessionId);
    return newSessionId;
  };

  const handleNameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      onError('何か入力してください😊 例: 「シャルドネ」「赤ワイン」「フランス」など、知っていることなら何でも大丈夫です！');
      return;
    }

    onLoadingChange(true);

    try {
      const sessionId = generateSessionId();
      const response = await fetch('http://localhost:3000/api/v1/wines/search_by_name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
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
    if (!selectedFile) {
      onError('画像を選択してください📷 ワインボトルやラベルの写真をアップロードしてくださいね！');
      return;
    }

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
            <button type="submit" className="search-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="small" color="white" />
                  <span>検索中...</span>
                </>
              ) : (
                '感想を聞く'
              )}
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
            <button type="submit" disabled={!selectedFile || isLoading} className="search-btn">
              {isLoading ? (
                <>
                  <Spinner size="small" color="white" />
                  <span>分析中...</span>
                </>
              ) : (
                '画像を分析する'
              )}
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