import React from 'react';

interface WineRegion {
  name: string;
  country: string;
  coordinates?: { lat: number; lng: number } | null;
  description: string;
}

interface WineMapProps {
  region: WineRegion;
}

const WineMap: React.FC<WineMapProps> = ({ region }) => {
  if (!region.coordinates) {
    return (
      <div className="wine-map no-region">
        <div className="region-info">
          <h3>🌍 産地情報</h3>
          <p className="region-name">{region.name}</p>
          <p className="region-description">{region.description}</p>
        </div>
      </div>
    );
  }

  // 簡単な座標から位置計算（世界地図の場合）
  const mapWidth = 400;
  const mapHeight = 200;

  // 緯度経度をSVG座標に変換（簡易版）
  const x = ((region.coordinates.lng + 180) / 360) * mapWidth;
  const y = ((90 - region.coordinates.lat) / 180) * mapHeight;

  return (
    <div className="wine-map">
      <div className="region-info">
        <h3>🌍 産地: {region.name}</h3>
        <p className="country">📍 {region.country}</p>
        <p className="region-description">{region.description}</p>
      </div>

      <div className="map-container">
        <svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          {/* 簡易世界地図の背景 */}
          <rect width={mapWidth} height={mapHeight} fill="#e8f4f8" />

          {/* 大陸の簡易表現 */}
          <g fill="#d4e6f1">
            {/* ヨーロッパ */}
            <ellipse cx="200" cy="80" rx="50" ry="40" />
            {/* アフリカ */}
            <ellipse cx="190" cy="130" rx="30" ry="50" />
            {/* アジア */}
            <ellipse cx="280" cy="90" rx="60" ry="45" />
            {/* 北アメリカ */}
            <ellipse cx="100" cy="70" rx="40" ry="35" />
            {/* 南アメリカ */}
            <ellipse cx="120" cy="140" rx="25" ry="45" />
            {/* オーストラリア */}
            <ellipse cx="320" cy="160" rx="25" ry="15" />
          </g>

          {/* 産地マーカー */}
          <circle
            cx={x}
            cy={y}
            r="8"
            fill="#e74c3c"
            stroke="#fff"
            strokeWidth="2"
            className="region-marker"
          />

          {/* 産地ラベル */}
          <text
            x={x}
            y={y - 12}
            textAnchor="middle"
            className="region-label"
            fill="#2c3e50"
            fontSize="12"
            fontWeight="bold"
          >
            {region.name}
          </text>
        </svg>
      </div>
    </div>
  );
};

export default WineMap;