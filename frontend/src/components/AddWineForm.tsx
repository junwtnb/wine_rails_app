import React, { useState } from 'react';

interface AddWineFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const AddWineForm: React.FC<AddWineFormProps> = ({
  onSuccess,
  onError,
  onLoadingChange,
}) => {
  const [wineName, setWineName] = useState('');
  const [descriptionWord, setDescriptionWord] = useState('');
  const [vtg, setVtg] = useState<string>('');

  // 現在年から1900年まで降順で年のオプションを生成
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wineName.trim() || !descriptionWord.trim()) {
      onError('ワイン名と感想の一言を入力してください');
      return;
    }

    onLoadingChange(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/wines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wine: {
            name: wineName,
            description_word: descriptionWord,
            vtg: vtg ? parseInt(vtg) : null
          }
        }),
      });

      if (!response.ok) {
        throw new Error('感想の追加に失敗しました');
      }

      const data = await response.json();
      onSuccess(data.message);
      setWineName('');
      setDescriptionWord('');
      setVtg('');
    } catch (error) {
      onError(error instanceof Error ? error.message : '追加エラーが発生しました');
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <div className="add-wine-form">
      <h3>ワインの感想を追加</h3>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-group">
          <input
            type="text"
            value={wineName}
            onChange={(e) => setWineName(e.target.value)}
            placeholder="ワイン名を入力してください"
            className="search-input"
          />
          <input
            type="text"
            value={descriptionWord}
            onChange={(e) => setDescriptionWord(e.target.value)}
            placeholder="感想を一言で入力してください（例: 芳醇、爽やか、エレガント）"
            className="search-input"
          />
          <select
            value={vtg}
            onChange={(e) => setVtg(e.target.value)}
            className={`search-input vintage-select ${!vtg ? 'placeholder' : ''}`}
          >
            <option value="">ヴィンテージを選択してください（任意）</option>
            {generateYearOptions().map(year => (
              <option key={year} value={year}>
                {year}年
              </option>
            ))}
          </select>
          <button type="submit" className="search-btn">
            感想を追加
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddWineForm;