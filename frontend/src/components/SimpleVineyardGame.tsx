import React, { useState, useCallback } from 'react';

// シンプルなブドウ畑ゲームコンポーネント
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

interface SimpleVineyardGameProps {
  onClose: () => void;
}

const GRAPE_TYPES = [
  { id: 'red', name: '赤ブドウ', emoji: '🔴', price: 100, waterNeeds: 2 },
  { id: 'white', name: '白ブドウ', emoji: '⚪', price: 80, waterNeeds: 1 },
  { id: 'purple', name: '紫ブドウ', emoji: '🟣', price: 120, waterNeeds: 3 }
];

const WEATHER_TYPES = [
  { type: 'sunny', emoji: '☀️', name: '晴れ', growthBonus: 1.5, waterLoss: 2 },
  { type: 'cloudy', emoji: '☁️', name: '曇り', growthBonus: 1.0, waterLoss: 1 },
  { type: 'rainy', emoji: '🌧️', name: '雨', growthBonus: 1.2, waterLoss: -2 },
  { type: 'stormy', emoji: '⛈️', name: '嵐', growthBonus: 0.5, waterLoss: 0 }
];

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

  const [selectedGrapeType, setSelectedGrapeType] = useState(GRAPE_TYPES[0]);
  const [money, setMoney] = useState(1000);
  const [water, setWater] = useState(100);
  const [fertilizer, setFertilizer] = useState(50);
  const [day, setDay] = useState(1);
  const [currentWeather, setCurrentWeather] = useState(WEATHER_TYPES[0]);
  const [currentSeason, setCurrentSeason] = useState(SEASONS[0]);
  const [gamePhase, setGamePhase] = useState<'setup' | 'planting' | 'growing'>('setup');

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
    // 天気を変更（30%の確率）
    if (Math.random() < 0.3) {
      setCurrentWeather(WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)]);
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

      const grapeType = GRAPE_TYPES.find(g => g.id === plot.grapeType);
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
  }, [currentWeather, currentSeason]);

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
          <h2>🍇 簡単ブドウ畑ゲーム</h2>
          <div className="game-info">
            <span>💰 {money}円</span>
            <span>💧 {water}</span>
            <span>🌱 {fertilizer}</span>
            <span>📅 {day}日目</span>
            <span>{currentSeason.emoji} {currentSeason.name_jp}</span>
            <span>{currentWeather.emoji} {currentWeather.name}</span>
          </div>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="game-content">
          {gamePhase === 'setup' && (
            <div className="game-setup">
              <h3>🎮 ゲーム開始</h3>
              <p>ブドウを植えて育てて収穫しましょう！</p>
              <p>💰 初期資金: {money}円</p>
              <button onClick={startPlanting} className="start-game-btn">
                ゲーム開始
              </button>
            </div>
          )}

          {gamePhase === 'planting' && (
            <div className="planting-phase">
              <h3>🌱 ブドウを植えよう</h3>

              {/* ブドウの種類選択 */}
              <div className="grape-type-selection">
                <h4>ブドウの種類を選択:</h4>
                <div className="grape-types">
                  {GRAPE_TYPES.map(grape => (
                    <button
                      key={grape.id}
                      onClick={() => setSelectedGrapeType(grape)}
                      className={`grape-type-btn ${selectedGrapeType.id === grape.id ? 'selected' : ''}`}
                    >
                      {grape.emoji} {grape.name} (¥{grape.price})
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
                            : `${GRAPE_TYPES.find(g => g.id === plot.grapeType)?.name} - 成長: ${Math.floor(plot.growth)}% / 水: ${Math.floor(plot.waterLevel)}% / 肥料: ${Math.floor(plot.fertilizer)}% / 健康: ${Math.floor(plot.health)}%`
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