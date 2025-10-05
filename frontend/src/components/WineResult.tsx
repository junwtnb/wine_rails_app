import React from 'react';
import { WineResponse } from '../App';

interface WineResultProps {
  result: WineResponse;
}

const WineResult: React.FC<WineResultProps> = ({ result }) => {
  const { wine } = result;

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
    <div className="wine-result">
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
      </div>
    </div>
  );
};

export default WineResult;