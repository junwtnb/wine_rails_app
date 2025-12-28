import React, { useState, useEffect } from 'react';
import { WineResponse } from '../App';
import WineMap from './WineMap';

interface WineResultProps {
  result: WineResponse;
}

const WineResult: React.FC<WineResultProps> = ({ result }) => {
  const { wine } = result;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // コンポーネントがマウントされたら少し遅れてアニメーションを開始
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [result]);

  const getWineEmoji = (wineType: string) => {
    switch (wineType?.toLowerCase()) {
      case 'white':
        return '🥂';
      case 'sparkling':
        return '🍾';
      default:
        return '🍷';
    }
  };

  return (
    <div className={`wine-result ${isVisible ? 'fade-in' : ''}`}>
      <div className="result-card">
        <div className="description-word">
          "{wine.description_word}"
        </div>

        {wine.name && (
          <div className="wine-name">
            {wine.name}
            {wine.vtg && <span className="wine-vintage"> ({wine.vtg}年)</span>}
          </div>
        )}

        <div className={`result-message ${wine.is_generic ? 'generic-message' : ''}`}>
          {wine.message}
          {wine.is_generic && (
            <div className="generic-note">
              ※ より具体的なワイン名や特徴を入力すると、より適切な感想が生成されます
            </div>
          )}
        </div>

        <div className="wine-emoji">{getWineEmoji(wine.wine_type || '')}</div>

        {wine.region && (
          <div className="wine-region-section">
            <WineMap region={wine.region} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WineResult;