import React, { useState, useCallback } from 'react';

// ワイン産地別ブドウ畑ゲームコンポーネント
interface Plot {
  id: number;
  isPlanted: boolean;
  grapeType: string;
  growth: number; // 0-100
  plantedDay: number;
  waterLevel: number; // 0-100
  fertilizer: number; // 0-100
  health: number; // 0-100
}

interface WineRegion {
  id: string;
  name: string;
  name_en: string;
  country: string;
  emoji: string;
  climate: string;
  description: string;
  grapeVarieties: string[];
  weatherPatterns: {
    spring: { temp: string; rainfall: string; commonWeather: string[] };
    summer: { temp: string; rainfall: string; commonWeather: string[] };
    autumn: { temp: string; rainfall: string; commonWeather: string[] };
    winter: { temp: string; rainfall: string; commonWeather: string[] };
  };
  specialBonuses: { [key: string]: number };
}

interface SimpleVineyardGameProps {
  onClose: () => void;
}

const WINE_REGIONS: WineRegion[] = [
  {
    id: 'bordeaux',
    name: 'ボルドー',
    name_en: 'Bordeaux',
    country: 'フランス',
    emoji: '🏰',
    climate: '海洋性気候',
    description: '温暖で湿潤、年間を通じて穏やかな気候',
    grapeVarieties: ['カベルネ・ソーヴィニヨン', 'メルロー', 'カベルネ・フラン', 'ソーヴィニヨン・ブラン'],
    weatherPatterns: {
      spring: { temp: '12-18°C', rainfall: '多め', commonWeather: ['rainy', 'cloudy', 'mild'] },
      summer: { temp: '20-25°C', rainfall: '少なめ', commonWeather: ['sunny', 'warm', 'humid'] },
      autumn: { temp: '10-16°C', rainfall: '多め', commonWeather: ['rainy', 'foggy', 'cool'] },
      winter: { temp: '3-8°C', rainfall: '多め', commonWeather: ['rainy', 'cloudy', 'mild'] }
    },
    specialBonuses: { 'oceanic_stability': 1.2, 'humidity_bonus': 1.1 }
  },
  {
    id: 'burgundy',
    name: 'ブルゴーニュ',
    name_en: 'Burgundy',
    country: 'フランス',
    emoji: '🍷',
    climate: '大陸性気候',
    description: '寒暖の差が激しく、厳しい冬と暑い夏',
    grapeVarieties: ['ピノ・ノワール', 'シャルドネ'],
    weatherPatterns: {
      spring: { temp: '8-15°C', rainfall: '中程度', commonWeather: ['variable', 'cool', 'frost_risk'] },
      summer: { temp: '18-28°C', rainfall: '少なめ', commonWeather: ['hot', 'dry', 'sunny'] },
      autumn: { temp: '8-18°C', rainfall: '中程度', commonWeather: ['cool', 'variable', 'harvest_rush'] },
      winter: { temp: '-2-5°C', rainfall: '少なめ', commonWeather: ['cold', 'snowy', 'dormant'] }
    },
    specialBonuses: { 'temperature_variation': 1.3, 'minerality': 1.2 }
  },
  {
    id: 'champagne',
    name: 'シャンパーニュ',
    name_en: 'Champagne',
    country: 'フランス',
    emoji: '🥂',
    climate: '大陸性気候（北部）',
    description: '冷涼で石灰質土壌、スパークリングワインの聖地',
    grapeVarieties: ['シャルドネ', 'ピノ・ノワール', 'ピノ・ムニエ'],
    weatherPatterns: {
      spring: { temp: '6-13°C', rainfall: '中程度', commonWeather: ['cool', 'frost_danger', 'variable'] },
      summer: { temp: '15-23°C', rainfall: '中程度', commonWeather: ['mild', 'cool_nights', 'perfect_ripening'] },
      autumn: { temp: '8-15°C', rainfall: '多め', commonWeather: ['cool', 'early_harvest', 'crisp'] },
      winter: { temp: '-1-4°C', rainfall: '中程度', commonWeather: ['cold', 'frosty', 'snowy'] }
    },
    specialBonuses: { 'acidity_preservation': 1.4, 'elegance': 1.3 }
  },
  {
    id: 'napa',
    name: 'ナパバレー',
    name_en: 'Napa Valley',
    country: 'アメリカ',
    emoji: '🏔️',
    climate: '地中海性気候',
    description: '乾燥した夏と温暖な冬、理想的なワイン気候',
    grapeVarieties: ['カベルネ・ソーヴィニヨン', 'シャルドネ', 'メルロー', 'ソーヴィニヨン・ブラン'],
    weatherPatterns: {
      spring: { temp: '13-20°C', rainfall: '少なめ', commonWeather: ['sunny', 'dry', 'perfect'] },
      summer: { temp: '22-30°C', rainfall: 'ほぼなし', commonWeather: ['hot', 'dry', 'sunny'] },
      autumn: { temp: '15-25°C', rainfall: 'なし', commonWeather: ['perfect', 'dry', 'harvest_ideal'] },
      winter: { temp: '5-15°C', rainfall: '中程度', commonWeather: ['mild', 'wet_season', 'dormancy'] }
    },
    specialBonuses: { 'consistency': 1.5, 'power': 1.3 }
  }
];

interface GrapeType {
  id: string;
  name: string;
  emoji: string;
  price: number;
  waterNeeds: number;
  qualityBonus: number;
}

type RegionalGrapeTypes = {
  [K in WineRegion['id']]: GrapeType[];
};

const REGIONAL_GRAPE_TYPES: RegionalGrapeTypes = {
  bordeaux: [
    { id: 'cabernet_sauvignon', name: 'カベルネ・ソーヴィニヨン', emoji: '🍇', price: 150, waterNeeds: 2, qualityBonus: 1.3 },
    { id: 'merlot', name: 'メルロー', emoji: '🍇', price: 130, waterNeeds: 2.5, qualityBonus: 1.2 },
    { id: 'sauvignon_blanc', name: 'ソーヴィニヨン・ブラン', emoji: '🤍', price: 110, waterNeeds: 1.8, qualityBonus: 1.1 }
  ],
  burgundy: [
    { id: 'pinot_noir', name: 'ピノ・ノワール', emoji: '🍇', price: 200, waterNeeds: 1.5, qualityBonus: 1.5 },
    { id: 'chardonnay', name: 'シャルドネ', emoji: '🤍', price: 120, waterNeeds: 1.8, qualityBonus: 1.3 }
  ],
  champagne: [
    { id: 'chardonnay_champagne', name: 'シャルドネ（シャンパーニュ）', emoji: '✨', price: 180, waterNeeds: 1.2, qualityBonus: 1.4 },
    { id: 'pinot_noir_champagne', name: 'ピノ・ノワール（シャンパーニュ）', emoji: '✨', price: 190, waterNeeds: 1.3, qualityBonus: 1.4 }
  ],
  napa: [
    { id: 'napa_cabernet', name: 'ナパ カベルネ', emoji: '🍇', price: 170, waterNeeds: 1.0, qualityBonus: 1.4 },
    { id: 'napa_chardonnay', name: 'ナパ シャルドネ', emoji: '🤍', price: 140, waterNeeds: 1.2, qualityBonus: 1.2 }
  ]
};

const REGIONAL_WEATHER_TYPES = {
  oceanic: [ // ボルドー（海洋性気候）
    { type: 'mild_rainy', emoji: '🌦️', name: '穏やかな雨', growthBonus: 1.3, waterLoss: -3, probability: 0.4 },
    { type: 'humid_cloudy', emoji: '☁️', name: '湿った曇り', growthBonus: 1.1, waterLoss: 0, probability: 0.3 },
    { type: 'warm_sunny', emoji: '☀️', name: '暖かい晴れ', growthBonus: 1.4, waterLoss: 1, probability: 0.2 },
    { type: 'atlantic_storm', emoji: '🌪️', name: '大西洋の嵐', growthBonus: 0.7, waterLoss: -1, probability: 0.1 }
  ],
  continental: [ // ブルゴーニュ・シャンパーニュ（大陸性気候）
    { type: 'hot_dry', emoji: '🌞', name: '暑くて乾燥', growthBonus: 1.6, waterLoss: 3, probability: 0.25 },
    { type: 'cool_wet', emoji: '🌧️', name: '涼しい雨', growthBonus: 1.0, waterLoss: -2, probability: 0.3 },
    { type: 'frost_risk', emoji: '❄️', name: '霜注意', growthBonus: 0.3, waterLoss: 0, probability: 0.15 },
    { type: 'perfect_day', emoji: '🌤️', name: '完璧な日', growthBonus: 1.8, waterLoss: 1, probability: 0.3 }
  ],
  mediterranean: [ // ナパバレー（地中海性気候）
    { type: 'dry_heat', emoji: '☀️', name: '乾燥した暑さ', growthBonus: 1.5, waterLoss: 2, probability: 0.5 },
    { type: 'perfect_sun', emoji: '🌞', name: '理想的な太陽', growthBonus: 1.7, waterLoss: 1.5, probability: 0.3 },
    { type: 'rare_rain', emoji: '🌦️', name: '貴重な雨', growthBonus: 1.4, waterLoss: -4, probability: 0.1 },
    { type: 'hot_wind', emoji: '💨', name: '熱風', growthBonus: 1.0, waterLoss: 3, probability: 0.1 }
  ]
};

const SEASONS = [
  { name: 'spring', emoji: '🌸', name_jp: '春', growthBonus: 1.3 },
  { name: 'summer', emoji: '🌞', name_jp: '夏', growthBonus: 1.5 },
  { name: 'autumn', emoji: '🍂', name_jp: '秋', growthBonus: 1.0 },
  { name: 'winter', emoji: '❄️', name_jp: '冬', growthBonus: 0.3 }
];

const SimpleVineyardGame: React.FC<SimpleVineyardGameProps> = ({ onClose }) => {
  const [plots, setPlots] = useState<Plot[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      isPlanted: false,
      grapeType: '',
      growth: 0,
      plantedDay: 0,
      waterLevel: 50,
      fertilizer: 30,
      health: 100
    }))
  );

  // 地域の気候に基づいた天気を取得する関数
  const getRegionalWeather = useCallback((regionId: string, seasonIndex: number) => {
    const climateMap: { [key: string]: keyof typeof REGIONAL_WEATHER_TYPES } = {
      'bordeaux': 'oceanic',
      'burgundy': 'continental',
      'champagne': 'continental',
      'napa': 'mediterranean'
    };

    const climateType = climateMap[regionId] || 'oceanic';
    const weatherOptions = REGIONAL_WEATHER_TYPES[climateType];

    // 確率に基づいて天気を選択
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const weather of weatherOptions) {
      cumulativeProbability += weather.probability;
      if (random <= cumulativeProbability) {
        return weather;
      }
    }

    return weatherOptions[0]; // フォールバック
  }, []);

  const [selectedRegion, setSelectedRegion] = useState(WINE_REGIONS[0]);
  const [selectedGrapeType, setSelectedGrapeType] = useState<GrapeType>(REGIONAL_GRAPE_TYPES[WINE_REGIONS[0].id as keyof RegionalGrapeTypes][0]);
  const [money, setMoney] = useState(1000);
  const [water, setWater] = useState(100);
  const [fertilizer, setFertilizer] = useState(50);
  const [day, setDay] = useState(1);
  const [currentWeather, setCurrentWeather] = useState(() =>
    getRegionalWeather ? getRegionalWeather(WINE_REGIONS[0].id, 0) : REGIONAL_WEATHER_TYPES.oceanic[0]
  );
  const [currentSeason, setCurrentSeason] = useState(SEASONS[0]);
  const [gamePhase, setGamePhase] = useState<'setup' | 'region_selection' | 'planting' | 'growing'>('setup');

  // 地域変更時の処理
  const handleRegionChange = useCallback((region: WineRegion) => {
    setSelectedRegion(region);
    setSelectedGrapeType(REGIONAL_GRAPE_TYPES[region.id as keyof RegionalGrapeTypes][0]);
    setCurrentWeather(getRegionalWeather(region.id, Math.floor((day / 7) % 4)));
  }, [day, getRegionalWeather]);

  const plantGrape = useCallback((plotId: number) => {
    if (money < selectedGrapeType.price) {
      alert('お金が足りません！');
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.id === plotId
        ? {
            ...plot,
            isPlanted: true,
            grapeType: selectedGrapeType.id,
            plantedDay: day,
            waterLevel: 50,
            fertilizer: 30,
            health: 100
          }
        : plot
    ));
    setMoney(prev => prev - selectedGrapeType.price);
  }, [selectedGrapeType, money, day]);

  const waterPlot = useCallback((plotId: number) => {
    if (water < 10) {
      alert('水が足りません！');
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.id === plotId && plot.isPlanted
        ? { ...plot, waterLevel: Math.min(100, plot.waterLevel + 30) }
        : plot
    ));
    setWater(prev => prev - 10);
  }, [water]);

  const fertilizePlot = useCallback((plotId: number) => {
    if (fertilizer < 5) {
      alert('肥料が足りません！');
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.id === plotId && plot.isPlanted
        ? { ...plot, fertilizer: Math.min(100, plot.fertilizer + 25) }
        : plot
    ));
    setFertilizer(prev => prev - 5);
  }, [fertilizer]);

  const advanceDay = useCallback(() => {
    // 地域の気候に基づいた天気変更（30%の確率）
    if (Math.random() < 0.3) {
      setCurrentWeather(getRegionalWeather(selectedRegion.id, Math.floor((day / 7) % 4)));
    }

    // 季節を変更（7日ごと）
    setDay(prev => {
      const newDay = prev + 1;
      const seasonIndex = Math.floor((newDay / 7) % 4);
      setCurrentSeason(SEASONS[seasonIndex]);
      return newDay;
    });

    setPlots(prev => prev.map(plot => {
      if (!plot.isPlanted) return plot;

      const grapeType = REGIONAL_GRAPE_TYPES[selectedRegion.id as keyof RegionalGrapeTypes]?.find(g => g.id === plot.grapeType) ||
                       Object.values(REGIONAL_GRAPE_TYPES).flat().find(g => g.id === plot.grapeType);
      if (!grapeType) return plot;

      // 成長計算
      let growthIncrease = 2; // ベース成長量
      growthIncrease *= currentWeather.growthBonus; // 天気ボーナス
      growthIncrease *= currentSeason.growthBonus; // 季節ボーナス

      // 水分レベルの影響
      if (plot.waterLevel < 20) growthIncrease *= 0.5; // 水不足で成長阻害
      if (plot.waterLevel > 80) growthIncrease *= 1.2; // 十分な水で成長促進

      // 肥料の影響
      if (plot.fertilizer > 50) growthIncrease *= 1.3; // 肥料で成長促進

      // 健康度の影響
      growthIncrease *= (plot.health / 100);

      // 水分レベルの変化
      let waterChange = currentWeather.waterLoss; // 天気による変化
      waterChange += grapeType.waterNeeds; // ブドウの種類による消費

      // 肥料の消費
      const fertilizerConsumption = 0.5;

      // 健康度の変化（ランダムなストレス）
      const healthChange = Math.random() < 0.1 ? -5 : 1; // 10%で病気、90%で回復

      return {
        ...plot,
        growth: Math.min(100, plot.growth + growthIncrease),
        waterLevel: Math.max(0, plot.waterLevel - waterChange),
        fertilizer: Math.max(0, plot.fertilizer - fertilizerConsumption),
        health: Math.min(100, Math.max(0, plot.health + healthChange))
      };
    }));

    // リソースの自動補充（少量）
    setWater(prev => Math.min(100, prev + 2));
    setFertilizer(prev => Math.min(50, prev + 1));
  }, [currentWeather, currentSeason, selectedRegion, getRegionalWeather, day]);

  const harvestPlot = useCallback((plotId: number) => {
    const plot = plots.find(p => p.id === plotId);
    if (!plot || !plot.isPlanted || plot.growth < 100) return;

    const harvestValue = Math.floor(plot.growth * 2);
    setMoney(prev => prev + harvestValue);
    setPlots(prev => prev.map(p =>
      p.id === plotId
        ? { ...p, isPlanted: false, grapeType: '', growth: 0, plantedDay: 0 }
        : p
    ));
  }, [plots]);

  const startRegionSelection = () => {
    setGamePhase('region_selection');
  };

  const startPlanting = () => {
    setGamePhase('planting');
  };

  const getPlotDisplay = (plot: Plot) => {
    if (!plot.isPlanted) return '⬜';
    if (plot.growth >= 100) return '🍇';
    if (plot.growth >= 50) return '🌿';
    if (plot.health < 30) return '🤒'; // 病気
    if (plot.waterLevel < 20) return '💧?'; // 水不足
    return '🌱';
  };

  const getPlotClass = (plot: Plot) => {
    if (!plot.isPlanted) return 'grape-plot empty';
    if (plot.growth >= 100) return 'grape-plot ready';
    if (plot.health < 30) return 'grape-plot sick';
    if (plot.waterLevel < 20) return 'grape-plot thirsty';
    return 'grape-plot planted';
  };

  return (
    <div className="vineyard-simulator-overlay">
      <div className="vineyard-simulator">
        <div className="game-header">
          <h2>{selectedRegion.emoji} {selectedRegion.name}のブドウ畑ゲーム</h2>
          <div className="game-info">
            <span>💰 {money}円</span>
            <span>💧 {water}</span>
            <span>🌱 {fertilizer}</span>
            <span>📅 {day}日目</span>
            <span>{currentSeason.emoji} {currentSeason.name_jp}</span>
            <span>{currentWeather.emoji} {currentWeather.name}</span>
            <span>🌍 {selectedRegion.climate}</span>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="game-content">
          {gamePhase === 'setup' && (
            <div className="game-setup">
              <h3>🌍 ワイン産地を選んでゲーム開始</h3>
              <p>世界の有名ワイン産地でブドウを育ててみましょう！</p>
              <p>💰 初期資金: {money}円</p>
              <button onClick={startRegionSelection} className="start-game-btn">
                産地を選んで開始
              </button>
            </div>
          )}

          {gamePhase === 'region_selection' && (
            <div className="region-selection">
              <h3>🌍 ワイン産地を選択</h3>
              <div className="regions-grid">
                {WINE_REGIONS.map(region => (
                  <div
                    key={region.id}
                    className={`region-card ${selectedRegion.id === region.id ? 'selected' : ''}`}
                    onClick={() => handleRegionChange(region)}
                  >
                    <div className="region-header">
                      <h4>{region.emoji} {region.name}</h4>
                      <p className="region-country">{region.country}</p>
                    </div>
                    <div className="region-info">
                      <p className="climate">🌡️ {region.climate}</p>
                      <p className="description">{region.description}</p>
                    </div>
                    <div className="grape-varieties">
                      <strong>主要品種:</strong>
                      <div className="varieties-list">
                        {region.grapeVarieties.slice(0, 3).map((variety, index) => (
                          <span key={index} className="variety-tag">{variety}</span>
                        ))}
                        {region.grapeVarieties.length > 3 && <span className="more">+{region.grapeVarieties.length - 3}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="region-details">
                <h4>{selectedRegion.emoji} {selectedRegion.name}の気候情報</h4>
                <div className="climate-info">
                  <div className="season-info">
                    <h5>🌸 春: {selectedRegion.weatherPatterns.spring.temp}</h5>
                    <p>降水量: {selectedRegion.weatherPatterns.spring.rainfall}</p>
                  </div>
                  <div className="season-info">
                    <h5>🌞 夏: {selectedRegion.weatherPatterns.summer.temp}</h5>
                    <p>降水量: {selectedRegion.weatherPatterns.summer.rainfall}</p>
                  </div>
                  <div className="season-info">
                    <h5>🍂 秋: {selectedRegion.weatherPatterns.autumn.temp}</h5>
                    <p>降水量: {selectedRegion.weatherPatterns.autumn.rainfall}</p>
                  </div>
                  <div className="season-info">
                    <h5>❄️ 冬: {selectedRegion.weatherPatterns.winter.temp}</h5>
                    <p>降水量: {selectedRegion.weatherPatterns.winter.rainfall}</p>
                  </div>
                </div>
              </div>
              <button onClick={startPlanting} className="start-planting-btn">
                {selectedRegion.name}でブドウ育成開始
              </button>
            </div>
          )}

          {gamePhase === 'planting' && (
            <div className="planting-phase">
              <h3>🌱 ブドウを植えよう</h3>

              {/* 地域情報表示 */}
              <div className="current-region-info">
                <h4>{selectedRegion.emoji} {selectedRegion.name} ({selectedRegion.country})</h4>
                <p>{selectedRegion.description}</p>
                <button onClick={() => setGamePhase('region_selection')} className="change-region-btn">
                  産地を変更
                </button>
              </div>

              {/* ブドウの種類選択 */}
              <div className="grape-type-selection">
                <h4>{selectedRegion.name}のブドウ品種を選択:</h4>
                <div className="grape-types">
                  {REGIONAL_GRAPE_TYPES[selectedRegion.id as keyof RegionalGrapeTypes].map(grape => (
                    <button
                      key={grape.id}
                      onClick={() => setSelectedGrapeType(grape)}
                      className={`grape-type-btn ${selectedGrapeType.id === grape.id ? 'selected' : ''}`}
                    >
                      {grape.emoji} {grape.name} (¥{grape.price}) ★{grape.qualityBonus}x
                    </button>
                  ))}
                </div>
              </div>

              {/* ブドウ畑グリッド */}
              <div className="vineyard-section">
                <h4>🍇 ブドウ畑 - プロットをクリックして管理しよう！</h4>
                <div className="grapes-grid">
                  {plots.map(plot => (
                    <div key={plot.id} className="plot-container">
                      <div
                        className={getPlotClass(plot)}
                        onClick={() => {
                          if (!plot.isPlanted) {
                            plantGrape(plot.id);
                          } else if (plot.growth >= 100) {
                            harvestPlot(plot.id);
                          }
                        }}
                        title={
                          !plot.isPlanted
                            ? `空き地 - クリックで${selectedGrapeType.name}を植える (¥${selectedGrapeType.price})`
                            : plot.growth >= 100
                            ? `収穫可能！クリックで収穫`
                            : `${REGIONAL_GRAPE_TYPES[selectedRegion.id as keyof RegionalGrapeTypes]?.find(g => g.id === plot.grapeType)?.name || 'ブドウ'} - 成長: ${Math.floor(plot.growth)}% / 水: ${Math.floor(plot.waterLevel)}% / 肥料: ${Math.floor(plot.fertilizer)}% / 健康: ${Math.floor(plot.health)}%`
                        }
                      >
                        {getPlotDisplay(plot)}
                      </div>

                      {plot.isPlanted && plot.growth < 100 && (
                        <div className="plot-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              waterPlot(plot.id);
                            }}
                            disabled={water < 10}
                            className="action-btn water-btn"
                            title="水やり (水 -10)"
                          >
                            💧
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fertilizePlot(plot.id);
                            }}
                            disabled={fertilizer < 5}
                            className="action-btn fertilizer-btn"
                            title="肥料やり (肥料 -5)"
                          >
                            🌱
                          </button>
                        </div>
                      )}

                      {plot.isPlanted && (
                        <div className="plot-status">
                          <div className="progress-mini water" style={{ width: `${plot.waterLevel}%` }} />
                          <div className="progress-mini fertilizer" style={{ width: `${plot.fertilizer}%` }} />
                          <div className="progress-mini health" style={{ width: `${plot.health}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* アクションボタン */}
              <div className="game-actions">
                <button onClick={advanceDay} className="game-action-btn">
                  ⏰ 1日進める
                </button>
                <div className="game-stats">
                  <p>植えたブドウ: {plots.filter(p => p.isPlanted).length}/12</p>
                  <p>収穫可能: {plots.filter(p => p.growth >= 100).length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleVineyardGame;