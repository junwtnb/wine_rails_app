import React, { useState, useCallback, useEffect } from 'react';

// ワイン産地別ブドウ畑ゲームコンポーネント
interface Plot {
  id: number;
  isPlanted: boolean;
  grapeType: string;
  growth: number; // 0-100
  plantedDay: number;
  plantedSeason: number; // 0-3 (春夏秋冬)
  waterLevel: number; // 0-100
  fertilizer: number; // 0-100
  health: number; // 0-100
  canHarvest: boolean;
  disease: string | null; // 病気ID
  diseaseDay: number; // 病気になった日
  lastDisaster: string | null; // 最後に受けた災害ID
  disasterDay: number; // 災害を受けた日
}

interface Disease {
  id: string;
  name: string;
  emoji: string;
  description: string;
  healthDamage: number; // 1日あたりの健康度ダメージ
  spreadChance: number; // 他のプロットへの感染確率
  treatmentCost: number; // 治療費
  cureDays: number; // 治療に必要な日数
}

interface Disaster {
  id: string;
  name: string;
  emoji: string;
  description: string;
  damage: string;
  probability: number; // 1日あたりの発生確率
  affectedPlots: number; // 影響するプロット数
  damageCost: number; // 復旧費用
}

interface AnnualPayment {
  name: string;
  amount: number;
  description: string;
  emoji: string;
}

interface Wine {
  id: string;
  name: string;
  grapeType: string;
  region: string;
  quality: number; // 0-100
  age: number; // days
  value: number;
  productionDate: number;
}

interface GameGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward: number;
  type: 'money' | 'wine_production' | 'quality' | 'harvest';
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

const DISEASES: Disease[] = [
  {
    id: 'powdery_mildew',
    name: 'うどんこ病',
    emoji: '🦠',
    description: '葉に白い粉状の症状が現れる病気',
    healthDamage: 3,
    spreadChance: 0.05, // 15%→5%に減少
    treatmentCost: 150,
    cureDays: 3
  },
  {
    id: 'black_rot',
    name: '黒腐病',
    emoji: '🖤',
    description: '実が黒く腐る深刻な病気',
    healthDamage: 5,
    spreadChance: 0.03, // 10%→3%に減少
    treatmentCost: 200,
    cureDays: 5
  },
  {
    id: 'phylloxera',
    name: 'フィロキセラ',
    emoji: '🐛',
    description: '根を食べる害虫、最悪の場合全滅',
    healthDamage: 8,
    spreadChance: 0.02, // 8%→2%に減少
    treatmentCost: 300,
    cureDays: 7
  }
];

const DISASTERS: Disaster[] = [
  {
    id: 'frost',
    name: '霜害',
    emoji: '❄️',
    description: '春の遅霜で新芽が凍結',
    damage: '成長が50%減少',
    probability: 0.005, // 0.5%に減少
    affectedPlots: 6,
    damageCost: 200
  },
  {
    id: 'hail',
    name: '雹害',
    emoji: '🌨️',
    description: '雹で葉や実が傷つく',
    damage: '健康度が30減少',
    probability: 0.003, // 0.3%に減少
    affectedPlots: 4,
    damageCost: 150
  },
  {
    id: 'drought',
    name: '干ばつ',
    emoji: '☀️',
    description: '極度の乾燥で水不足',
    damage: '水分レベルが半減',
    probability: 0.002, // 0.2%に減少
    affectedPlots: 8,
    damageCost: 300
  }
];

const ANNUAL_PAYMENTS: AnnualPayment[] = [
  { name: '土地賃貸料', amount: 800, description: 'ブドウ畑の年間賃貸料', emoji: '🏠' },
  { name: '設備維持費', amount: 300, description: '醸造設備の維持管理費', emoji: '🔧' },
  { name: '保険料', amount: 200, description: '災害保険の年間保険料', emoji: '🛡️' },
  { name: '税金', amount: 400, description: '事業税・固定資産税', emoji: '📋' }
];

const GAME_GOALS = [
  { id: 'first_harvest', title: '初回収穫', description: 'ブドウを1本収穫する', target: 1, current: 0, completed: false, reward: 200, type: 'harvest' as const },
  { id: 'wine_maker', title: 'ワイン醸造家', description: 'ワインを3本作る', target: 3, current: 0, completed: false, reward: 500, type: 'wine_production' as const },
  { id: 'money_goal_1', title: '資産家への第一歩', description: '2000円を貯める', target: 2000, current: 1000, completed: false, reward: 0, type: 'money' as const },
  { id: 'quality_master', title: '品質マスター', description: '品質90以上のワインを作る', target: 90, current: 0, completed: false, reward: 800, type: 'quality' as const },
  { id: 'money_goal_2', title: '成功した醸造家', description: '5000円を貯める', target: 5000, current: 1000, completed: false, reward: 0, type: 'money' as const }
];

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
  { name: 'spring', emoji: '🌸', name_jp: '春', growthBonus: 1.3, plantingOptimal: true, harvestPossible: false },
  { name: 'summer', emoji: '🌞', name_jp: '夏', growthBonus: 1.5, plantingOptimal: false, harvestPossible: false },
  { name: 'autumn', emoji: '🍂', name_jp: '秋', growthBonus: 1.0, plantingOptimal: false, harvestPossible: true },
  { name: 'winter', emoji: '❄️', name_jp: '冬', growthBonus: 0.3, plantingOptimal: false, harvestPossible: false }
];

const DAYS_PER_SEASON = 30; // 1シーズン = 30日
const GROWING_SEASONS_REQUIRED = 2; // 春に植えて秋に収穫（2シーズン必要）
const DAYS_PER_YEAR = 120; // 4シーズン x 30日

const SimpleVineyardGame: React.FC<SimpleVineyardGameProps> = ({ onClose }) => {
  const [plots, setPlots] = useState<Plot[]>(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      isPlanted: false,
      grapeType: '',
      growth: 0,
      plantedDay: 0,
      plantedSeason: 0,
      waterLevel: 50,
      fertilizer: 30,
      health: 100,
      canHarvest: false,
      disease: null,
      diseaseDay: 0,
      lastDisaster: null,
      disasterDay: 0
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
  const [currentSeasonIndex, setCurrentSeasonIndex] = useState(0);
  const [gamePhase, setGamePhase] = useState<'setup' | 'region_selection' | 'planting' | 'growing'>('setup');
  const [wines, setWines] = useState<Wine[]>([]);
  const [goals, setGoals] = useState<GameGoal[]>(GAME_GOALS);
  const [totalHarvested, setTotalHarvested] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState('');
  const [lastPaymentDay, setLastPaymentDay] = useState(0);
  const [yearsPassed, setYearsPassed] = useState(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [autoAdvanceSpeed, setAutoAdvanceSpeed] = useState(1000); // ミリ秒

  // 地域変更時の処理
  const handleRegionChange = useCallback((region: WineRegion) => {
    setSelectedRegion(region);
    setSelectedGrapeType(REGIONAL_GRAPE_TYPES[region.id as keyof RegionalGrapeTypes][0]);
    setCurrentWeather(getRegionalWeather(region.id, Math.floor((day / 7) % 4)));
  }, [day, getRegionalWeather]);

  const plantGrape = useCallback((plotId: number) => {
    if (gameOver || gameWon) return;

    if (money < selectedGrapeType.price) {
      alert('お金が足りません！');
      return;
    }

    // 春以外は植え付けにペナルティ
    if (!currentSeason.plantingOptimal) {
      const confirm = window.confirm(`${currentSeason.name_jp}は植え付けの時期ではありません。成長が遅れる可能性があります。続けますか？`);
      if (!confirm) return;
    }

    setPlots(prev => prev.map(plot =>
      plot.id === plotId
        ? {
            ...plot,
            isPlanted: true,
            grapeType: selectedGrapeType.id,
            plantedDay: day,
            plantedSeason: currentSeasonIndex,
            waterLevel: 50,
            fertilizer: 30,
            health: 100,
            canHarvest: false,
            disease: null,
            diseaseDay: 0,
            lastDisaster: null,
            disasterDay: 0
          }
        : plot
    ));
    setMoney(prev => prev - selectedGrapeType.price);
  }, [selectedGrapeType, money, day, currentSeason, currentSeasonIndex, gameOver, gameWon]);

  const waterPlot = useCallback((plotId: number) => {
    if (gameOver || gameWon) return;

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
  }, [water, gameOver, gameWon]);

  const fertilizePlot = useCallback((plotId: number) => {
    if (gameOver || gameWon) return;

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
  }, [fertilizer, gameOver, gameWon]);

  const advanceDay = useCallback(() => {
    // ゲームオーバーまたは勝利時は処理を停止
    if (gameOver || gameWon) return;

    // 地域の気候に基づいた天気変更（30%の確率）
    if (Math.random() < 0.3) {
      setCurrentWeather(getRegionalWeather(selectedRegion.id, Math.floor((day / 7) % 4)));
    }

    // 季節を変更（30日ごと）
    setDay(prev => {
      const newDay = prev + 1;
      const newSeasonIndex = Math.floor(newDay / DAYS_PER_SEASON) % 4;
      if (newSeasonIndex !== currentSeasonIndex) {
        setCurrentSeasonIndex(newSeasonIndex);
        setCurrentSeason(SEASONS[newSeasonIndex]);

        // 春の始まり（新年）に年次支払いチェック
        if (newSeasonIndex === 0 && newDay > DAYS_PER_YEAR && newDay > lastPaymentDay + DAYS_PER_YEAR - 10) {
          setLastPaymentDay(newDay);
          setYearsPassed(Math.floor(newDay / DAYS_PER_YEAR));
          checkAnnualPayments(newDay);
        }

        // 秋になったら成熟したブドウを収穫可能に
        if (newSeasonIndex === 2) { // 秋
          setPlots(prevPlots => prevPlots.map(plot => {
            if (plot.isPlanted && plot.growth >= 100) {
              const seasonsGrown = (newSeasonIndex - plot.plantedSeason + 4) % 4;
              if (seasonsGrown >= GROWING_SEASONS_REQUIRED || plot.plantedSeason <= 0) {
                return { ...plot, canHarvest: true };
              }
            }
            return plot;
          }));
        }
      }
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

      // 病気システム
      let healthChange = 1; // 基本回復
      let diseaseGrowthPenalty = 1; // 成長ペナルティなし

      if (plot.disease) {
        // 既存の病気の処理
        const disease = DISEASES.find(d => d.id === plot.disease);
        if (disease) {
          healthChange = -disease.healthDamage;
          diseaseGrowthPenalty = 0.5; // 病気で成長半減
        }
      } else {
        // 新しい病気の発生（健康度が低いほど確率上昇）
        const diseaseChance = (100 - plot.health) / 2000; // 健康度50なら2.5%に減少
        if (Math.random() < diseaseChance) {
          const randomDisease = DISEASES[Math.floor(Math.random() * DISEASES.length)];
          return {
            ...plot,
            disease: randomDisease.id,
            diseaseDay: day,
            growth: Math.min(100, plot.growth + (growthIncrease * diseaseGrowthPenalty)),
            waterLevel: Math.max(0, plot.waterLevel - waterChange),
            fertilizer: Math.max(0, plot.fertilizer - fertilizerConsumption),
            health: Math.min(100, Math.max(0, plot.health + healthChange))
          };
        }
      }

      // 成長に病気ペナルティを適用
      growthIncrease *= diseaseGrowthPenalty;

      return {
        ...plot,
        growth: Math.min(100, plot.growth + growthIncrease),
        waterLevel: Math.max(0, plot.waterLevel - waterChange),
        fertilizer: Math.max(0, plot.fertilizer - fertilizerConsumption),
        health: Math.min(100, Math.max(0, plot.health + healthChange))
      };
    }));

    // 災害チェック
    checkRandomDisasters();

    // 病気の拡散チェック
    checkDiseaseSpread();

    // リソースの自動補充（少量）
    setWater(prev => Math.min(100, prev + 2));
    setFertilizer(prev => Math.min(50, prev + 1));

    // ゲームオーバーチェック
    checkGameOver();
  }, [currentWeather, currentSeason, selectedRegion, getRegionalWeather, day, currentSeasonIndex, gameOver, gameWon]);

  // 自動進行の開始/停止
  const toggleAutoAdvance = useCallback(() => {
    setIsAutoAdvancing(prev => !prev);
  }, []);

  // 自動進行のuseEffect
  useEffect(() => {
    if (!isAutoAdvancing || gameOver || gameWon) {
      if (isAutoAdvancing && (gameOver || gameWon)) {
        setIsAutoAdvancing(false);
      }
      return;
    }

    const interval = setInterval(() => {
      advanceDay();
    }, autoAdvanceSpeed);

    return () => clearInterval(interval);
  }, [isAutoAdvancing, autoAdvanceSpeed, gameOver, gameWon, advanceDay]);

  // 最近完了したゴールのトラッキング（重複通知を防ぐ）
  const [recentlyCompletedGoals, setRecentlyCompletedGoals] = useState<Set<string>>(new Set());

  // ゴール進捗を更新する関数
  const updateGoalProgress = useCallback((type: string, value: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.type === type && !goal.completed) {
        const newCurrent = type === 'money' ? money :
                         type === 'quality' ? Math.max(goal.current, value) :
                         goal.current + value;

        const completed = newCurrent >= goal.target;

        if (completed && !goal.completed && goal.reward > 0 && !recentlyCompletedGoals.has(goal.title)) {
          setMoney(prevMoney => prevMoney + goal.reward);
          alert(`ゴール達成！「${goal.title}」報酬: ${goal.reward}円`);

          // 重複通知を防ぐためにゴールをトラッキング
          setRecentlyCompletedGoals(prevSet => new Set(prevSet).add(goal.title));

          // 5秒後にトラッキングをクリア
          setTimeout(() => {
            setRecentlyCompletedGoals(prevSet => {
              const newSet = new Set(prevSet);
              newSet.delete(goal.title);
              return newSet;
            });
          }, 5000);
        }

        return { ...goal, current: newCurrent, completed };
      }
      return goal;
    }));
  }, [money, recentlyCompletedGoals]);

  const harvestPlot = useCallback((plotId: number) => {
    if (gameOver || gameWon) return;

    const plot = plots.find(p => p.id === plotId);
    if (!plot || !plot.isPlanted || plot.growth < 100) return;

    if (!currentSeason.harvestPossible) {
      alert(`${currentSeason.name_jp}は収穫の時期ではありません。秋までお待ちください。`);
      return;
    }

    // ブドウからワインを作るか、そのまま売るか選択
    const makeWine = window.confirm('ブドウからワインを作りますか？（いいえでそのまま売却）');

    const grapeType = REGIONAL_GRAPE_TYPES[selectedRegion.id as keyof RegionalGrapeTypes]?.find(g => g.id === plot.grapeType);
    if (!grapeType) return;

    if (makeWine) {
      // ワイン製造
      const quality = Math.min(100,
        plot.health * 0.4 +
        plot.growth * 0.3 +
        (plot.fertilizer > 70 ? 20 : plot.fertilizer * 0.2) +
        grapeType.qualityBonus * 10
      );

      const wine: Wine = {
        id: `wine_${Date.now()}_${plotId}`,
        name: `${selectedRegion.name} ${grapeType.name}`,
        grapeType: grapeType.name,
        region: selectedRegion.name,
        quality: Math.floor(quality),
        age: 0,
        value: Math.floor(grapeType.price * quality / 50),
        productionDate: day
      };

      setWines(prev => [...prev, wine]);
      alert(`「${wine.name}」のワインが完成しました！品質: ${wine.quality}ポイント`);

      // ゴール達成チェック
      updateGoalProgress('wine_production', 1);
      updateGoalProgress('quality', wine.quality);
    } else {
      // そのまま売却
      const harvestValue = Math.floor(grapeType.price * 0.8);
      setMoney(prev => prev + harvestValue);
      alert(`ブドウを${harvestValue}円で売却しました！`);
    }

    // 収穫数を更新
    setTotalHarvested(prev => prev + 1);
    updateGoalProgress('harvest', 1);

    // プロットをリセット
    setPlots(prev => prev.map(p =>
      p.id === plotId
        ? {
            ...p,
            isPlanted: false,
            grapeType: '',
            growth: 0,
            plantedDay: 0,
            plantedSeason: 0,
            canHarvest: false,
            waterLevel: 50,
            fertilizer: 30,
            health: 100,
            disease: null,
            diseaseDay: 0,
            lastDisaster: null,
            disasterDay: 0
          }
        : p
    ));
  }, [plots, currentSeason, selectedRegion, day, updateGoalProgress, gameOver, gameWon]);

  // ワインを売る関数
  const sellWine = useCallback((wineId: string) => {
    if (gameOver || gameWon) return;

    const wine = wines.find(w => w.id === wineId);
    if (!wine) return;

    const ageBonus = Math.floor(wine.age / 10) * 0.1; // 10日ごとに10%ボーナス
    const finalValue = Math.floor(wine.value * (1 + ageBonus));

    setMoney(prev => prev + finalValue);
    setWines(prev => prev.filter(w => w.id !== wineId));

    alert(`「${wine.name}」を${finalValue}円で売却しました！`);
  }, [wines, gameOver, gameWon]);

  // 一括水やり
  const waterAllPlots = useCallback(() => {
    if (gameOver || gameWon) return;

    const plantedPlots = plots.filter(plot => plot.isPlanted);
    const waterNeeded = plantedPlots.length * 10;

    if (water < waterNeeded) {
      alert(`水が足りません！必要な水: ${waterNeeded}、現在の水: ${water}`);
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.isPlanted
        ? { ...plot, waterLevel: Math.min(100, plot.waterLevel + 30) }
        : plot
    ));
    setWater(prev => prev - waterNeeded);
    alert(`${plantedPlots.length}つの畑に水やりを行いました！`);
  }, [plots, water, gameOver, gameWon]);

  // 一括施肥
  const fertilizeAllPlots = useCallback(() => {
    if (gameOver || gameWon) return;

    const plantedPlots = plots.filter(plot => plot.isPlanted);
    const fertilizerNeeded = plantedPlots.length * 5;

    if (fertilizer < fertilizerNeeded) {
      alert(`肥料が足りません！必要な肥料: ${fertilizerNeeded}、現在の肥料: ${fertilizer}`);
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.isPlanted
        ? { ...plot, fertilizer: Math.min(100, plot.fertilizer + 25) }
        : plot
    ));
    setFertilizer(prev => prev - fertilizerNeeded);
    alert(`${plantedPlots.length}つの畑に施肥を行いました！`);
  }, [plots, fertilizer, gameOver, gameWon]);

  // 災害チェック
  const checkRandomDisasters = useCallback(() => {
    if (gameOver) return;

    DISASTERS.forEach(disaster => {
      if (Math.random() < disaster.probability) {
        const affectedPlots = plots
          .filter(p => p.isPlanted)
          .sort(() => Math.random() - 0.5)
          .slice(0, disaster.affectedPlots);

        if (affectedPlots.length === 0) return;

        const disasterCost = disaster.damageCost;
        const canAfford = money >= disasterCost;

        if (window.confirm(`🚨 ${disaster.emoji} ${disaster.name}が発生！\n${disaster.description}\n\n復旧費用: ${disasterCost}円\n現在の所持金: ${money}円\n\n${canAfford ? '復旧費用を支払いますか？' : '所持金が足りません！畑が被害を受けます。'}`)) {
          if (canAfford) {
            setMoney(prev => prev - disasterCost);
            alert('復旧完了！');
            return;
          }
        }

        // 災害の被害を適用
        setPlots(prev => prev.map(plot => {
          if (affectedPlots.some(ap => ap.id === plot.id)) {
            switch (disaster.id) {
              case 'frost':
                return {
                  ...plot,
                  growth: Math.max(0, plot.growth * 0.5),
                  lastDisaster: disaster.id,
                  disasterDay: day
                };
              case 'hail':
                return {
                  ...plot,
                  health: Math.max(0, plot.health - 30),
                  lastDisaster: disaster.id,
                  disasterDay: day
                };
              case 'drought':
                return {
                  ...plot,
                  waterLevel: Math.max(0, plot.waterLevel * 0.5),
                  lastDisaster: disaster.id,
                  disasterDay: day
                };
              default:
                return plot;
            }
          }
          return plot;
        }));

        alert(`${disaster.emoji} ${disaster.name}により畑が被害を受けました...`);
      }
    });
  }, [plots, money, gameOver]);

  // 病気の拡散チェック
  const checkDiseaseSpread = useCallback(() => {
    if (gameOver) return;

    setPlots(prev => prev.map(plot => {
      if (!plot.isPlanted || plot.disease) return plot;

      // 近くの病気のプロットから感染
      const nearbyDiseased = prev.some(p => {
        if (!p.disease || !p.isPlanted) return false;
        const disease = DISEASES.find(d => d.id === p.disease);
        return disease && Math.random() < disease.spreadChance;
      });

      if (nearbyDiseased) {
        const spreadingDiseases = prev
          .filter(p => p.disease)
          .map(p => p.disease)
          .filter(Boolean);

        if (spreadingDiseases.length > 0) {
          const randomDisease = spreadingDiseases[Math.floor(Math.random() * spreadingDiseases.length)];
          return {
            ...plot,
            disease: randomDisease,
            diseaseDay: day
          };
        }
      }

      return plot;
    }));
  }, [plots, day, gameOver]);

  // ゲームオーバーチェック
  const checkGameOver = useCallback(() => {
    if (gameOver || gameWon) return;

    if (money < 0) {
      setGameOver(true);
      setGameOverReason('所持金が0円を下回りました。経営破綻です...');
    }
  }, [money, gameOver, gameWon]);

  // 年次支払いチェック
  const checkAnnualPayments = useCallback((currentDay: number) => {
    if (gameOver || gameWon) return;

    const totalPayment = ANNUAL_PAYMENTS.reduce((sum, payment) => sum + payment.amount, 0);
    const currentYear = Math.floor(currentDay / DAYS_PER_YEAR);

    if (money >= totalPayment) {
      // 支払い可能な場合
      setMoney(prev => prev - totalPayment);

      const paymentDetails = ANNUAL_PAYMENTS.map(p => `${p.emoji} ${p.name}: ${p.amount}円`).join('\n');
      alert(`📅 第${currentYear}年度の年次支払いが完了しました！\n\n${paymentDetails}\n\n合計: ${totalPayment}円を支払いました。`);
    } else {
      // 支払い不能な場合 - ゲームオーバー
      setGameOver(true);
      setGameOverReason(`第${currentYear}年度の年次支払い（${totalPayment}円）ができませんでした。\n所持金不足により経営破綻です...`);
    }
  }, [money, gameOver, gameWon]);

  // ゲーム勝利判定
  const checkGameWin = useCallback(() => {
    if (gameOver) return;

    // すべてのゴール（お金のゴールも含む）が完了しているかチェック
    const allGoalsCompleted = goals.every(g => g.completed);

    if (allGoalsCompleted && !gameWon) {
      setGameWon(true);
      alert('おめでとうございます！すべてのゴールを達成しました！あなたは立派なワイン醸造家です！');
    }
  }, [goals, gameWon, gameOver]);

  const startRegionSelection = () => {
    setGamePhase('region_selection');
  };

  const startPlanting = () => {
    setGamePhase('planting');
  };

  // 病気治療
  const treatDisease = useCallback((plotId: number) => {
    const plot = plots.find(p => p.id === plotId);
    if (!plot || !plot.disease) return;

    const disease = DISEASES.find(d => d.id === plot.disease);
    if (!disease) return;

    if (money < disease.treatmentCost) {
      alert(`治療費が足りません！必要な金額: ${disease.treatmentCost}円`);
      return;
    }

    setMoney(prev => prev - disease.treatmentCost);
    setPlots(prev => prev.map(p =>
      p.id === plotId
        ? { ...p, disease: null, diseaseDay: 0 }
        : p
    ));

    alert(`${disease.emoji} ${disease.name}を治療しました！費用: ${disease.treatmentCost}円`);
  }, [plots, money]);

  // ゲームリスタート
  const restartGame = useCallback(() => {
    window.location.reload();
  }, []);

  // マネーゴールをチェック
  React.useEffect(() => {
    updateGoalProgress('money', money);
  }, [money, updateGoalProgress]);

  // ゲーム勝利をチェック
  React.useEffect(() => {
    checkGameWin();
  }, [checkGameWin]);

  // ワインの熟成（毎日）
  React.useEffect(() => {
    setWines(prev => prev.map(wine => ({
      ...wine,
      age: day - wine.productionDate
    })));
  }, [day]);

  const getPlotDisplay = (plot: Plot) => {
    if (!plot.isPlanted) return '⬜';

    // 最近の災害被害を優先表示（3日以内）
    if (plot.lastDisaster && (day - plot.disasterDay) <= 3) {
      const disaster = DISASTERS.find(d => d.id === plot.lastDisaster);
      if (disaster) return disaster.emoji;
    }

    if (plot.disease) {
      const disease = DISEASES.find(d => d.id === plot.disease);
      return disease ? disease.emoji : '🤒';
    }
    if (plot.growth >= 100) return '🍇';
    if (plot.growth >= 50) return '🌿';
    if (plot.health < 30) return '🤒'; // 病気
    if (plot.waterLevel < 20) return '💧?'; // 水不足
    return '🌱';
  };

  const getPlotClass = (plot: Plot) => {
    if (!plot.isPlanted) return 'grape-plot empty';

    // 最近の災害被害（3日以内）
    if (plot.lastDisaster && (day - plot.disasterDay) <= 3) {
      return 'grape-plot disaster-damaged';
    }

    if (plot.disease) return 'grape-plot diseased';
    if (plot.growth >= 100) return 'grape-plot ready';
    if (plot.health < 30) return 'grape-plot sick';
    if (plot.waterLevel < 20) return 'grape-plot thirsty';
    return 'grape-plot planted';
  };

  return (
    <div className="vineyard-simulator-overlay">
      {/* 固定リソース表示 */}
      <div className="resource-overlay">
        <h4>💼 リソース</h4>
        <div className="resource-item">
          <span><span className="emoji">💰</span>所持金</span>
          <span className="value">{money}円</span>
        </div>
        <div className="resource-item">
          <span><span className="emoji">💧</span>水</span>
          <span className="value">{water}</span>
        </div>
        <div className="resource-item">
          <span><span className="emoji">🌱</span>肥料</span>
          <span className="value">{fertilizer}</span>
        </div>
        <div className="resource-item">
          <span><span className="emoji">📅</span>経過日数</span>
          <span className="value">{day}日</span>
        </div>
        <div className="resource-item">
          <span><span className="emoji">🏛️</span>事業年度</span>
          <span className="value">{Math.floor(day / DAYS_PER_YEAR) + 1}年目</span>
        </div>
        {day >= DAYS_PER_YEAR && (
          <div className="resource-item">
            <span><span className="emoji">💳</span>次回支払い</span>
            <span className="value">{DAYS_PER_YEAR - (day % DAYS_PER_YEAR)}日後</span>
          </div>
        )}
        <div className="resource-item">
          <span><span className="emoji">{currentSeason.emoji}</span>{currentSeason.name_jp}</span>
          <span className="value">{currentWeather.emoji}</span>
        </div>
        <div className="resource-item">
          <span><span className="emoji">🍷</span>ワイン</span>
          <span className="value">{wines.length}本</span>
        </div>
      </div>

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
            <span>🍷 ワイン: {wines.length}本</span>
            <span>🍇 収穫: {totalHarvested}本</span>
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
              {/* ゲームゴール表示 */}
              <div className="game-goals">
                <h3>🏆 ゲームゴール</h3>
                <div className="goals-grid">
                  {goals.map(goal => (
                    <div key={goal.id} className={`goal-item ${goal.completed ? 'completed' : ''}`}>
                      <div className="goal-title">{goal.title}</div>
                      <div className="goal-description">{goal.description}</div>
                      <div className="goal-progress">
                        <span>{goal.current}</span> / <span>{goal.target}</span>
                        {goal.type === 'money' && ' 円'}
                        {goal.type === 'wine_production' && ' 本'}
                        {goal.type === 'harvest' && ' 本'}
                        {goal.type === 'quality' && ' ポイント'}
                      </div>
                      {goal.completed && <span className="goal-check">✓</span>}
                      {goal.reward > 0 && !goal.completed && <div className="goal-reward">報酬: {goal.reward}円</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* ワインセラー */}
              {wines.length > 0 && (
                <div className="wine-cellar">
                  <h3>🍷 ワインセラー</h3>
                  <div className="wines-grid">
                    {wines.map(wine => (
                      <div key={wine.id} className="wine-item">
                        <div className="wine-header">
                          <h4>{wine.name}</h4>
                          <span className="wine-age">{wine.age}日熟成</span>
                        </div>
                        <div className="wine-details">
                          <span className="wine-quality">品質: ★{wine.quality}</span>
                          <span className="wine-value">価値: {Math.floor(wine.value * (1 + Math.floor(wine.age / 10) * 0.1))}円</span>
                        </div>
                        <button
                          onClick={() => sellWine(wine.id)}
                          className="sell-wine-btn"
                        >
                          売却
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gameWon && (
                <div className="game-won">
                  <h2>🏆 ゲームクリア！</h2>
                  <p>おめでとうございます！あなたは立派なワイン醸造家です！</p>
                </div>
              )}

              {gameOver && (
                <div className="game-over">
                  <h2>💀 ゲームオーバー</h2>
                  <p>{gameOverReason}</p>
                  <button onClick={restartGame} className="restart-btn">
                    ゲームをリスタート
                  </button>
                </div>
              )}

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
                            : plot.disease
                            ? `病気: ${DISEASES.find(d => d.id === plot.disease)?.name} - 治療費: ${DISEASES.find(d => d.id === plot.disease)?.treatmentCost}円`
                            : plot.lastDisaster && (day - plot.disasterDay) <= 3
                            ? `災害被害: ${DISASTERS.find(d => d.id === plot.lastDisaster)?.name} (${3 - (day - plot.disasterDay)}日前) - ${DISASTERS.find(d => d.id === plot.lastDisaster)?.damage}`
                            : `${REGIONAL_GRAPE_TYPES[selectedRegion.id as keyof RegionalGrapeTypes]?.find(g => g.id === plot.grapeType)?.name || 'ブドウ'} - 成長: ${Math.floor(plot.growth)}% / 水: ${Math.floor(plot.waterLevel)}% / 肥料: ${Math.floor(plot.fertilizer)}% / 健康: ${Math.floor(plot.health)}%`
                        }
                      >
                        {getPlotDisplay(plot)}
                      </div>

                      {plot.isPlanted && plot.growth < 100 && (
                        <div className="plot-actions">
                          {plot.disease ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                treatDisease(plot.id);
                              }}
                              className="action-btn treat-btn"
                              title={`病気治療: ${DISEASES.find(d => d.id === plot.disease)?.treatmentCost}円`}
                            >
                              💉
                            </button>
                          ) : (
                            <>
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
                            </>
                          )}
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
                <button
                  onClick={toggleAutoAdvance}
                  className={`game-action-btn ${isAutoAdvancing ? 'active' : ''}`}
                >
                  {isAutoAdvancing ? '⏹️ 自動停止' : '▶️ 自動進行'}
                </button>
                {isAutoAdvancing && (
                  <div className="auto-speed-controls">
                    <label>速度: </label>
                    <button onClick={() => setAutoAdvanceSpeed(2000)}>遅い</button>
                    <button onClick={() => setAutoAdvanceSpeed(1000)}>普通</button>
                    <button onClick={() => setAutoAdvanceSpeed(500)}>早い</button>
                  </div>
                )}
                <div className="batch-actions">
                  <button onClick={waterAllPlots} className="game-action-btn batch-btn">
                    💧 一括水やり
                  </button>
                  <button onClick={fertilizeAllPlots} className="game-action-btn batch-btn">
                    🌱 一括施肥
                  </button>
                </div>
                <div className="game-stats">
                  <p>植えたブドウ: {plots.filter(p => p.isPlanted).length}/12</p>
                  <p>収穫可能: {plots.filter(p => p.growth >= 100 && p.canHarvest).length}</p>
                  <p className="season-info">
                    {currentSeason.plantingOptimal && '🌱 植え付け時期'}
                    {currentSeason.harvestPossible && '🍇 収穫時期'}
                    {!currentSeason.plantingOptimal && !currentSeason.harvestPossible && '🕰️ 管理時期'}
                  </p>
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