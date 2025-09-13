import React from 'react';
import { WineResponse } from '../App';

interface WineResultProps {
  result: WineResponse;
}

const WineResult: React.FC<WineResultProps> = ({ result }) => {
  const { wine } = result;

  return (
    <div className="wine-result">
      <div className="result-card">
        <div className="description-word">
          "{wine.description_word}"
        </div>
        
        {wine.name && (
          <div className="wine-name">
            {wine.name}
          </div>
        )}
        
        <div className="result-message">
          {wine.message}
        </div>
        
        <div className="wine-emoji">🍷</div>
      </div>
    </div>
  );
};

export default WineResult;