import React, { useState, useCallback, useEffect, useRef } from 'react';

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
  isSpecial?: boolean; // 特別ワインかどうか
  specialType?: string; // 特別ワインの種類
  masteryBonus?: number; // マスタリーボーナス
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
  koppenCode: string; // ケッペンの気候区分コード
  koppenName: string; // ケッペンの気候区分名
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
    koppenCode: 'Cfb',
    koppenName: '西岸海洋性気候',
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
    koppenCode: 'Dfb',
    koppenName: '冷帯湿潤気候',
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
    koppenCode: 'Cfb',
    koppenName: '西岸海洋性気候',
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
    koppenCode: 'Csb',
    koppenName: '温暖夏季地中海性気候',
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
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 気候マスターレベルシステム
  const [regionExperience, setRegionExperience] = useState<Record<string, number>>({});

  // 冬限定アクティビティシステム
  const [vineyardUpgrades, setVineyardUpgrades] = useState({
    irrigationSystem: 0,    // 灌漑システム レベル 0-3
    soilQuality: 0,         // 土壌品質 レベル 0-3
    weatherProtection: 0,   // 天候保護 レベル 0-3
    pruningTechnique: 0     // 剪定技術 レベル 0-3
  });
  const [lastWinterActivities, setLastWinterActivities] = useState<Record<string, number>>({});

  // 畑拡張システム
  const [unlockedPlots, setUnlockedPlots] = useState(4); // 最初は4つの畑から開始

  // トースト通知を表示する関数
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000); // 3秒後に消す
  }, []);


  // 気候マスターレベル計算関数
  const getClimateMasteryLevel = useCallback((experience: number) => {
    if (experience >= 100) return 5; // マスター
    if (experience >= 60) return 4;  // 上級
    if (experience >= 30) return 3;  // 中級
    if (experience >= 10) return 2;  // 初級
    if (experience >= 1) return 1;   // 入門
    return 0; // 未体験
  }, []);

  // 気候区分マスタリー判定
  const getClimateMasteryInfo = useCallback((koppenCode: string) => {
    const experience = regionExperience[koppenCode] || 0;
    const level = getClimateMasteryLevel(experience);

    const levelNames = ['未体験', '入門', '初級', '中級', '上級', 'マスター'];
    const levelIcons = ['❓', '🌱', '🌿', '🌳', '🌲', '👑'];

    return {
      experience,
      level,
      levelName: levelNames[level],
      levelIcon: levelIcons[level],
      nextLevelExp: level < 5 ? [1, 10, 30, 60, 100][level] : 100,
      isMaster: level === 5
    };
  }, [regionExperience, getClimateMasteryLevel]);

  // 特別ワインを作成できるかチェック
  const canCreateSpecialWine = useCallback((koppenCode: string) => {
    const masteryInfo = getClimateMasteryInfo(koppenCode);
    return masteryInfo.isMaster;
  }, [getClimateMasteryInfo]);

  // 特別ワイン情報を取得
  const getSpecialWineInfo = useCallback((koppenCode: string) => {
    const specialWines: Record<string, { name: string; type: string; qualityBonus: number; valueMultiplier: number; description: string }> = {
      'Cfb': {
        name: 'オーシャニック・リザーブ',
        type: 'oceanic_reserve',
        qualityBonus: 15,
        valueMultiplier: 2.5,
        description: '海洋性気候の穏やかな条件で熟成されたプレミアムワイン'
      },
      'Csa': {
        name: 'メディテラネオ・グランド',
        type: 'mediterraneo_grand',
        qualityBonus: 20,
        valueMultiplier: 3.0,
        description: '地中海性気候の理想的な条件で作られた最高級ワイン'
      },
      'Csb': {
        name: 'コースタル・エリート',
        type: 'coastal_elite',
        qualityBonus: 18,
        valueMultiplier: 2.8,
        description: '温帯地中海性気候の恵まれた環境で育まれた逸品'
      },
      'Dfb': {
        name: 'コンチネンタル・マスターピース',
        type: 'continental_masterpiece',
        qualityBonus: 12,
        valueMultiplier: 2.2,
        description: '大陸性気候の厳しい条件を乗り越えた力強いワイン'
      },
      'BSk': {
        name: 'ドライランド・トレジャー',
        type: 'dryland_treasure',
        qualityBonus: 25,
        valueMultiplier: 4.0,
        description: '半乾燥気候の極限環境で育った希少なプレミアムワイン'
      }
    };

    return specialWines[koppenCode] || null;
  }, []);

  // 気候区分別の天候解説を取得
  const getClimateWeatherExplanation = useCallback((koppenCode: string, weather: string, season: string) => {
    const explanations: Record<string, Record<string, Record<string, string>>> = {
      'Cfb': {
        '晴れ': {
          'spring': '🌤️ Cfb（西岸海洋性気候）の春の晴れ。海洋の影響で穏やかな気候です。',
          'summer': '☀️ Cfb気候の夏の晴れ。海洋性の影響で極端に暑くならず、ワイン栽培に適しています。',
          'autumn': '🌤️ Cfb気候の秋の晴れ。収穫期に安定した天候が期待できる海洋性気候の特徴です。',
          'winter': '🌤️ Cfb気候の冬の晴れ。海洋の温暖化効果で厳冬が少ないのが特徴です。'
        },
        '雨': {
          'spring': '🌧️ Cfb気候の春の雨。年中降水があるのが西岸海洋性気候の特徴です。',
          'summer': '🌦️ Cfb気候の夏の雨。乾燥期がなく、年中適度な降水があります。',
          'autumn': '🌧️ Cfb気候の秋の雨。偏西風による雨がワインブドウに適度な水分を供給します。',
          'winter': '🌧️ Cfb気候の冬の雨。温暖なため雪より雨が多いのが特徴です。'
        }
      },
      'Csa': {
        '晴れ': {
          'summer': '☀️ Csa（地中海性気候）の夏の晴れ。乾燥した夏はワイン栽培に理想的です！',
          'winter': '🌤️ Csa気候の冬の晴れ。温暖で穏やかな冬が特徴的です。'
        },
        '雨': {
          'winter': '🌧️ Csa気候の冬の雨。冬に集中する降水が地中海性気候の特徴です。',
          'spring': '🌦️ Csa気候の春の雨。冬から春にかけて降水があり、夏は乾燥します。'
        }
      },
      'Csb': {
        '晴れ': {
          'summer': '🌤️ Csb（温帯地中海性気候）の夏の晴れ。Csaより涼しい夏が特徴です。',
          'winter': '☀️ Csb気候の冬の晴れ。温暖で安定した気候です。'
        },
        '雨': {
          'winter': '🌧️ Csb気候の冬の雨。地中海性の降水パターンを示しています。'
        }
      },
      'Dfb': {
        '晴れ': {
          'summer': '☀️ Dfb（冷帯湿潤気候）の夏の晴れ。大陸性気候で夏は暖かくなります。',
          'winter': '❄️ Dfb気候の冬の晴れ。大陸性気候特有の厳しい寒さが特徴です。'
        },
        '雨': {
          'summer': '🌧️ Dfb気候の夏の雨。大陸性気候でも夏に降水があります。'
        }
      },
      'BSk': {
        '晴れ': {
          'summer': '🌵 BSk（冷涼半乾燥気候）の晴れ。降水量が少ない乾燥気候の特徴です。',
          'winter': '☀️ BSk気候の冬の晴れ。年中乾燥しているのが半乾燥気候の特徴です。'
        }
      }
    };

    return explanations[koppenCode]?.[weather]?.[season] ||
           explanations[koppenCode]?.[weather]?.['summer'] ||
           `🌍 ${koppenCode}気候の${weather}です。`;
  }, []);

  // 地域変更時の処理
  const handleRegionChange = useCallback((region: WineRegion) => {
    setSelectedRegion(region);
    setSelectedGrapeType(REGIONAL_GRAPE_TYPES[region.id as keyof RegionalGrapeTypes][0]);
    setCurrentWeather(getRegionalWeather(region.id, Math.floor((day / 7) % 4)));
  }, [day, getRegionalWeather]);

  // 音楽・効果音システム
  const audioContext = useRef<AudioContext | null>(null);
  const backgroundMusic = useRef<OscillatorNode | null>(null);
  const musicGainNode = useRef<GainNode | null>(null);

  const initializeAudio = useCallback(async () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // AudioContextが中断されている場合は再開
    if (audioContext.current.state === 'suspended') {
      try {
        await audioContext.current.resume();
        console.log('AudioContext resumed');
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }

    console.log('AudioContext state:', audioContext.current.state);
  }, []);

  const playSound = useCallback(async (frequency: number, duration: number, volume: number = 0.1) => {
    if (!soundEnabled || !audioContext.current) return;

    // 自動進行中は効果音を間引く（30%の確率で再生）
    if (isAutoAdvancing && Math.random() > 0.3) {
      return;
    }

    // AudioContextの状態をチェック
    if (audioContext.current.state === 'suspended') {
      try {
        await audioContext.current.resume();
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
        return;
      }
    }

    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.current.currentTime);
      oscillator.type = 'sine';

      // 自動進行中は音量を大幅に下げる
      const adjustedVolume = isAutoAdvancing ? volume * 0.1 : volume;

      gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(adjustedVolume, audioContext.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + duration);

      if (isAutoAdvancing) {
        console.log(`🔇 Auto-advance quiet sound (30% chance): ${frequency}Hz (volume: ${adjustedVolume})`);
      } else {
        console.log(`Playing sound: ${frequency}Hz for ${duration}s at volume ${adjustedVolume}`);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [soundEnabled, isAutoAdvancing]);

  const playMelody = useCallback((notes: number[], noteDuration: number) => {
    if (!soundEnabled) return;

    notes.forEach((note, index) => {
      setTimeout(() => {
        playSound(note, noteDuration, 0.05);
      }, index * noteDuration * 1000);
    });
  }, [playSound, soundEnabled]);

  // メロディー再生用の変数
  const musicInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentNoteIndex = useRef(0);
  const ambientSounds = useRef<{ oscillator: OscillatorNode; gain: GainNode }[]>([]);
  const birdTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  // 牧歌的なメロディー（田園風景をイメージ）
  const pastoralMelody = [
    // 第1フレーズ（C major - 明るく穏やか）
    { freq: 523.25, duration: 0.8 }, // C5
    { freq: 587.33, duration: 0.4 }, // D5
    { freq: 659.25, duration: 0.8 }, // E5
    { freq: 523.25, duration: 0.4 }, // C5
    { freq: 698.46, duration: 1.2 }, // F5
    { freq: 659.25, duration: 0.8 }, // E5
    { freq: 587.33, duration: 1.6 }, // D5

    // 第2フレーズ（少し高めに）
    { freq: 659.25, duration: 0.8 }, // E5
    { freq: 698.46, duration: 0.4 }, // F5
    { freq: 783.99, duration: 0.8 }, // G5
    { freq: 659.25, duration: 0.4 }, // E5
    { freq: 830.61, duration: 1.2 }, // G#5
    { freq: 783.99, duration: 0.8 }, // G5
    { freq: 698.46, duration: 1.6 }, // F5

    // 第3フレーズ（下行で落ち着く）
    { freq: 783.99, duration: 0.4 }, // G5
    { freq: 659.25, duration: 0.4 }, // E5
    { freq: 523.25, duration: 0.8 }, // C5
    { freq: 698.46, duration: 0.8 }, // F5
    { freq: 659.25, duration: 0.8 }, // E5
    { freq: 587.33, duration: 0.8 }, // D5
    { freq: 523.25, duration: 2.4 }, // C5（長めに終了）

    // 休符
    { freq: 0, duration: 1.0 }
  ];

  const playNextNote = useCallback(async () => {
    console.log('🎵 playNextNote called - musicEnabled:', musicEnabled, 'audioContext:', !!audioContext.current);

    if (!musicEnabled || !audioContext.current) {
      console.log('🎵 BGM stopped - musicEnabled:', musicEnabled, 'audioContext:', !!audioContext.current);
      return;
    }

    // AudioContextの状態をチェック
    if (audioContext.current.state === 'suspended') {
      console.log('🎵 AudioContext suspended, attempting to resume...');
      try {
        await audioContext.current.resume();
        console.log('🎵 AudioContext resumed successfully');
      } catch (error) {
        console.error('🎵 Failed to resume AudioContext:', error);
        return;
      }
    }

    const note = pastoralMelody[currentNoteIndex.current];
    console.log(`🎵 Playing BGM note ${currentNoteIndex.current}: ${note.freq}Hz for ${note.duration}s`);

    if (note.freq > 0) {
      try {
        // 音を鳴らす
        const oscillator = audioContext.current.createOscillator();
        const gainNode = audioContext.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);

        oscillator.frequency.setValueAtTime(note.freq, audioContext.current.currentTime);
        oscillator.type = 'sine';

        // なめらかなエンベロープ
        gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.03, audioContext.current.currentTime + 0.05); // 音量を少し上げる
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + note.duration * 0.8);
        gainNode.gain.linearRampToValueAtTime(0.001, audioContext.current.currentTime + note.duration);

        oscillator.start(audioContext.current.currentTime);
        oscillator.stop(audioContext.current.currentTime + note.duration);

        console.log(`🎵 BGM note playing: ${note.freq}Hz for ${note.duration}s`);
      } catch (error) {
        console.error('🎵 Error playing BGM note:', error);
      }
    } else {
      console.log('🎵 BGM rest note (silence)');
    }

    // 次の音符へ
    currentNoteIndex.current = (currentNoteIndex.current + 1) % pastoralMelody.length;

    // タイマーを設定して次の音符を再生（musicEnabledを再チェック）
    if (musicInterval.current) {
      clearTimeout(musicInterval.current);
      musicInterval.current = null;
    }

    // 音楽が無効になっている場合はタイマーを設定しない
    if (!musicEnabled) {
      console.log('🎵 Music disabled during playback, not scheduling next note');
      return;
    }

    musicInterval.current = setTimeout(() => {
      playNextNote();
    }, note.duration * 1000);

    console.log(`🎵 Next BGM note scheduled in ${note.duration * 1000}ms`);

  }, [musicEnabled, pastoralMelody]);

  // アンビエント音（風や自然音）を開始
  const startAmbientSounds = useCallback(() => {
    if (!audioContext.current) return;

    // 風の音（低周波ノイズ）
    const windOsc = audioContext.current.createOscillator();
    const windGain = audioContext.current.createGain();
    const windLFO = audioContext.current.createOscillator();
    const windLFOGain = audioContext.current.createGain();

    windOsc.type = 'sawtooth';
    windOsc.frequency.setValueAtTime(80, audioContext.current.currentTime);
    windGain.gain.setValueAtTime(0.003, audioContext.current.currentTime);

    // 風の音にゆらぎを追加
    windLFO.type = 'sine';
    windLFO.frequency.setValueAtTime(0.1, audioContext.current.currentTime);
    windLFOGain.gain.setValueAtTime(20, audioContext.current.currentTime);
    windLFO.connect(windLFOGain);
    windLFOGain.connect(windOsc.frequency);

    windOsc.connect(windGain);
    windGain.connect(audioContext.current.destination);

    windOsc.start();
    windLFO.start();

    ambientSounds.current.push({ oscillator: windOsc, gain: windGain });

    // 鳥の鳴き声（時々）
    const playBirdSound = () => {
      if (!audioContext.current || !musicEnabled) {
        console.log('🐦 Bird sound stopped - musicEnabled:', musicEnabled, 'audioContext:', !!audioContext.current);
        return;
      }

      console.log('🐦 Playing bird sound');
      const birdFreqs = [800, 1200, 900, 1100, 750];
      const freq = birdFreqs[Math.floor(Math.random() * birdFreqs.length)];

      const birdOsc = audioContext.current.createOscillator();
      const birdGain = audioContext.current.createGain();

      birdOsc.type = 'sine';
      birdOsc.frequency.setValueAtTime(freq, audioContext.current.currentTime);
      birdOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioContext.current.currentTime + 0.1);
      birdOsc.frequency.exponentialRampToValueAtTime(freq * 0.8, audioContext.current.currentTime + 0.3);

      birdGain.gain.setValueAtTime(0, audioContext.current.currentTime);
      birdGain.gain.linearRampToValueAtTime(0.005, audioContext.current.currentTime + 0.02);
      birdGain.gain.exponentialRampToValueAtTime(0.001, audioContext.current.currentTime + 0.3);

      birdOsc.connect(birdGain);
      birdGain.connect(audioContext.current.destination);

      birdOsc.start();
      birdOsc.stop(audioContext.current.currentTime + 0.3);

      // ランダムに次の鳥の鳴き声をスケジュール（タイマーを追跡）
      const nextBirdTimer = setTimeout(playBirdSound, Math.random() * 8000 + 5000); // 5-13秒後
      birdTimers.current.push(nextBirdTimer);
      console.log('🐦 Next bird sound scheduled, total timers:', birdTimers.current.length);
    };

    // 最初の鳥の鳴き声を3秒後に開始（タイマーを追跡）
    const initialBirdTimer = setTimeout(playBirdSound, 3000);
    birdTimers.current.push(initialBirdTimer);
    console.log('🐦 Initial bird timer set');

  }, [musicEnabled]);

  const startBackgroundMusic = useCallback(() => {
    console.log('🎵 startBackgroundMusic called - musicEnabled:', musicEnabled, 'musicInterval exists:', !!musicInterval.current, 'audioContext:', !!audioContext.current);

    if (!musicEnabled || musicInterval.current || !audioContext.current) {
      console.log('🎵 BGM start blocked - musicEnabled:', musicEnabled, 'musicInterval exists:', !!musicInterval.current, 'audioContext:', !!audioContext.current);
      return;
    }

    console.log('🎵 Starting BGM...');
    initializeAudio();
    currentNoteIndex.current = 0;
    playNextNote();
    startAmbientSounds();
    console.log('🎵 BGM started successfully');
  }, [musicEnabled, initializeAudio, playNextNote, startAmbientSounds]);

  const stopBackgroundMusic = useCallback(() => {
    console.log('🎵 stopBackgroundMusic called - clearing timers and stopping oscillators');

    if (musicInterval.current) {
      console.log('🎵 Clearing music interval timer');
      clearTimeout(musicInterval.current);
      musicInterval.current = null;
    }
    if (backgroundMusic.current) {
      console.log('🎵 Stopping background music oscillator');
      backgroundMusic.current.stop();
      backgroundMusic.current = null;
    }

    // アンビエント音も停止
    console.log('🎵 Stopping ambient sounds:', ambientSounds.current.length);
    ambientSounds.current.forEach(({ oscillator }) => {
      try {
        oscillator.stop();
      } catch (e) {
        // 既に停止済みの場合はエラーを無視
      }
    });
    ambientSounds.current = [];

    // 鳥のタイマーもクリア
    console.log('🐦 Clearing bird timers:', birdTimers.current.length);
    birdTimers.current.forEach(timer => {
      clearTimeout(timer);
    });
    birdTimers.current = [];

    currentNoteIndex.current = 0;
    console.log('🎵 BGM and all ambient sounds stopped completely');
  }, []);

  // 音楽の開始/停止
  useEffect(() => {
    console.log('🎵 BGM useEffect triggered - musicEnabled:', musicEnabled, 'gamePhase:', gamePhase);
    console.log('🎵 Current game state - gameOver:', gameOver, 'gameWon:', gameWon);

    if (musicEnabled && (gamePhase === 'growing' || gamePhase === 'planting')) {
      console.log('🎵 Conditions met for BGM, starting...');
      startBackgroundMusic();
    } else {
      console.log('🎵 BGM conditions not met or stopping...');
      stopBackgroundMusic();
    }

    return () => {
      console.log('🎵 BGM useEffect cleanup');
      stopBackgroundMusic();
    };
  }, [musicEnabled, gamePhase, startBackgroundMusic, stopBackgroundMusic]);

  // 効果音定義
  const playPlantSound = useCallback(() => playSound(440, 0.2), [playSound]);
  const playWaterSound = useCallback(() => playMelody([523, 659, 784], 0.1), [playMelody]);
  const playFertilizerSound = useCallback(() => playMelody([392, 440, 523], 0.15), [playMelody]);
  const playHarvestSound = useCallback(() => playMelody([659, 784, 880, 1047], 0.12), [playMelody]);
  const playSuccessSound = useCallback(() => playMelody([523, 659, 784, 1047, 1319], 0.1), [playMelody]);
  const playErrorSound = useCallback(() => playMelody([220, 196, 175], 0.2), [playMelody]);

  // 冬限定アクティビティのハンドラー関数
  const performPruning = useCallback(() => {
    if (currentSeason.name !== 'winter') {
      showToast('剪定は冬の間にのみ実行できます');
      return;
    }

    const cost = (vineyardUpgrades.pruningTechnique + 1) * 50;
    if (money < cost) {
      showToast(`剪定には${cost}円必要です`);
      return;
    }

    if (lastWinterActivities.pruning === day) {
      showToast('今日は既に剪定を行いました');
      return;
    }

    setMoney(prev => prev - cost);
    setVineyardUpgrades(prev => ({
      ...prev,
      pruningTechnique: Math.min(prev.pruningTechnique + 1, 3)
    }));
    setLastWinterActivities(prev => ({ ...prev, pruning: day }));

    // 剪定により既存のブドウの健康度向上
    setPlots(prevPlots => prevPlots.map(plot =>
      plot.isPlanted ? { ...plot, health: Math.min(100, plot.health + 15) } : plot
    ));

    showToast(`🌿 剪定完了！技術レベル${vineyardUpgrades.pruningTechnique + 1}に向上しました`);
    playSound(349.23, 0.3, 0.12); // F4音
  }, [currentSeason, vineyardUpgrades, money, day, lastWinterActivities, showToast, playSound]);

  const improveSoil = useCallback(() => {
    if (currentSeason.name !== 'winter') {
      showToast('土壌改良は冬の間にのみ実行できます');
      return;
    }

    const cost = (vineyardUpgrades.soilQuality + 1) * 100;
    if (money < cost) {
      showToast(`土壌改良には${cost}円必要です`);
      return;
    }

    if (lastWinterActivities.soil === day) {
      showToast('今日は既に土壌改良を行いました');
      return;
    }

    setMoney(prev => prev - cost);
    setVineyardUpgrades(prev => ({
      ...prev,
      soilQuality: Math.min(prev.soilQuality + 1, 3)
    }));
    setLastWinterActivities(prev => ({ ...prev, soil: day }));

    showToast(`🌍 土壌改良完了！品質レベル${vineyardUpgrades.soilQuality + 1}に向上しました`);
    playSound(261.63, 0.4, 0.1); // C4音
  }, [currentSeason, vineyardUpgrades, money, day, lastWinterActivities, showToast, playSound]);

  const upgradeIrrigation = useCallback(() => {
    if (currentSeason.name !== 'winter') {
      showToast('灌漑設備の改良は冬の間にのみ実行できます');
      return;
    }

    const cost = (vineyardUpgrades.irrigationSystem + 1) * 150;
    if (money < cost) {
      showToast(`灌漑設備改良には${cost}円必要です`);
      return;
    }

    if (lastWinterActivities.irrigation === day) {
      showToast('今日は既に灌漑設備の改良を行いました');
      return;
    }

    setMoney(prev => prev - cost);
    setVineyardUpgrades(prev => ({
      ...prev,
      irrigationSystem: Math.min(prev.irrigationSystem + 1, 3)
    }));
    setLastWinterActivities(prev => ({ ...prev, irrigation: day }));

    showToast(`🚰 灌漑システム改良完了！レベル${vineyardUpgrades.irrigationSystem + 1}に向上しました`);
    playSound(523.25, 0.3, 0.1); // C5音
  }, [currentSeason, vineyardUpgrades, money, day, lastWinterActivities, showToast, playSound]);

  const installWeatherProtection = useCallback(() => {
    if (currentSeason.name !== 'winter') {
      showToast('天候保護設備の設置は冬の間にのみ実行できます');
      return;
    }

    const cost = (vineyardUpgrades.weatherProtection + 1) * 200;
    if (money < cost) {
      showToast(`天候保護設備には${cost}円必要です`);
      return;
    }

    if (lastWinterActivities.weather === day) {
      showToast('今日は既に天候保護設備の設置を行いました');
      return;
    }

    setMoney(prev => prev - cost);
    setVineyardUpgrades(prev => ({
      ...prev,
      weatherProtection: Math.min(prev.weatherProtection + 1, 3)
    }));
    setLastWinterActivities(prev => ({ ...prev, weather: day }));

    showToast(`⛅ 天候保護設備完了！レベル${vineyardUpgrades.weatherProtection + 1}に向上しました`);
    playSound(440, 0.35, 0.11); // A4音
  }, [currentSeason, vineyardUpgrades, money, day, lastWinterActivities, showToast, playSound]);

  // 畑拡張システム
  const getPlotExpansionCost = useCallback((currentPlots: number) => {
    // 段階的に高くなる価格設定
    const costs = [0, 0, 0, 0, 300, 500, 800, 1200, 1800, 2500, 3500, 5000]; // 最初の4つは無料
    return costs[currentPlots] || 10000; // 12個を超える場合は高額
  }, []);

  const expandVineyard = useCallback(() => {
    if (unlockedPlots >= 12) {
      showToast('畑は既に最大まで拡張されています');
      return;
    }

    const cost = getPlotExpansionCost(unlockedPlots);
    if (money < cost) {
      showToast(`畑の拡張には${cost}円必要です`);
      return;
    }

    setMoney(prev => prev - cost);
    setUnlockedPlots(prev => prev + 1);

    showToast(`🌾 新しい畑を解放しました！(${unlockedPlots + 1}/12)`);
    playSuccessSound();
  }, [unlockedPlots, money, getPlotExpansionCost, showToast, playSuccessSound]);

  const plantGrape = useCallback((plotId: number) => {
    if (gameOver || gameWon) return;

    if (money < selectedGrapeType.price) {
      showToast('💰 お金が足りません！');
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
    playPlantSound();
  }, [selectedGrapeType, money, day, currentSeason, currentSeasonIndex, gameOver, gameWon, playPlantSound, showToast]);

  const waterPlot = useCallback((plotId: number) => {
    if (gameOver || gameWon) return;

    if (water < 10) {
      showToast('💧 水が足りません！');
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.id === plotId && plot.isPlanted
        ? { ...plot, waterLevel: Math.min(100, plot.waterLevel + 30) }
        : plot
    ));
    setWater(prev => prev - 10);
    playWaterSound();
  }, [water, gameOver, gameWon, playWaterSound, showToast]);

  const fertilizePlot = useCallback((plotId: number) => {
    if (gameOver || gameWon) return;

    if (fertilizer < 5) {
      showToast('🌱 肥料が足りません！');
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.id === plotId && plot.isPlanted
        ? { ...plot, fertilizer: Math.min(100, plot.fertilizer + 25) }
        : plot
    ));
    setFertilizer(prev => prev - 5);
    playFertilizerSound();
  }, [fertilizer, gameOver, gameWon, playFertilizerSound, showToast]);

  const advanceDay = useCallback(() => {
    // ゲームオーバーまたは勝利時は処理を停止
    if (gameOver || gameWon) return;

    // 気候マスター経験値を増加
    const currentKoppenCode = selectedRegion.koppenCode;
    if (currentKoppenCode) {
      setRegionExperience(prev => {
        const currentExp = prev[currentKoppenCode] || 0;
        const newExp = currentExp + 1;

        // レベルアップチェック
        const oldLevel = getClimateMasteryLevel(currentExp);
        const newLevel = getClimateMasteryLevel(newExp);

        if (newLevel > oldLevel) {
          const masteryInfo = getClimateMasteryInfo(currentKoppenCode);
          showToast(`${masteryInfo.levelIcon} ${selectedRegion.name}の気候マスタリーが「${masteryInfo.levelName}」にレベルアップ！`);

          if (newLevel === 5) {
            showToast(`👑 ${currentKoppenCode}気候区分をマスターしました！特別なワインが解禁されます！`);
          }
        }

        return { ...prev, [currentKoppenCode]: newExp };
      });
    }

    // 地域の気候に基づいた天気変更（30%の確率）
    if (Math.random() < 0.3) {
      const oldWeather = currentWeather.name;
      const newWeather = getRegionalWeather(selectedRegion.id, Math.floor((day / 7) % 4));

      setCurrentWeather(newWeather);

      // 天候が変わった場合、気候解説を表示
      if (oldWeather !== newWeather.name) {
        const seasonName = currentSeason.name;
        const explanation = getClimateWeatherExplanation(
          selectedRegion.koppenCode || '',
          newWeather.name,
          seasonName
        );

        // 経験値に応じて解説の詳しさを調整
        const experience = regionExperience[selectedRegion.koppenCode || ''] || 0;
        const masteryLevel = getClimateMasteryLevel(experience);

        // 初心者向けには簡単な説明、上級者向けには詳細な説明
        if (masteryLevel >= 2 && Math.random() < 0.4) { // 初級以上で40%の確率
          showToast(explanation);
        }
      }
    }

    // 季節を変更（30日ごと）
    setDay(prev => {
      const newDay = prev + 1;
      const newSeasonIndex = Math.floor(newDay / DAYS_PER_SEASON) % 4;
      if (newSeasonIndex !== currentSeasonIndex) {
        setCurrentSeasonIndex(newSeasonIndex);
        setCurrentSeason(SEASONS[newSeasonIndex]);

        // 季節変化時の気候学習メッセージ
        const experience = regionExperience[selectedRegion.koppenCode || ''] || 0;
        const masteryLevel = getClimateMasteryLevel(experience);

        if (masteryLevel >= 1) { // 入門以上で季節解説
          const seasonMessages: Record<string, Record<string, string>> = {
            'Cfb': {
              'spring': '🌸 Cfb気候の春！海洋性の影響で温度変化が緩やか。ワイン栽培には理想的です。',
              'summer': '🌞 Cfb気候の夏！暑すぎない穏やかな気温。極端な暑さがないのが特徴。',
              'autumn': '🍂 Cfb気候の秋！収穫期に安定した天候が期待できます。',
              'winter': '❄️ Cfb気候の冬！海洋の影響で厳寒にならず、比較的温暖。'
            },
            'Csa': {
              'summer': '☀️ Csa気候の夏！乾燥した暑い夏がワイン栽培に最適！',
              'winter': '🌧️ Csa気候の冬！温暖湿潤な冬が地中海性気候の特徴。'
            },
            'Dfb': {
              'summer': '🌞 Dfb気候の夏！大陸性気候で暖かい夏。',
              'winter': '❄️ Dfb気候の冬！厳しい寒さが大陸性気候の特徴。'
            }
          };

          const seasonId = SEASONS[newSeasonIndex].name;
          const message = seasonMessages[selectedRegion.koppenCode || '']?.[seasonId];

          if (message && Math.random() < 0.6) { // 60%の確率で表示
            setTimeout(() => showToast(message), 1000); // 1秒後に表示
          }
        }

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

      // 冬のアップグレード効果
      if (vineyardUpgrades.soilQuality > 0) {
        growthIncrease *= (1 + vineyardUpgrades.soilQuality * 0.1); // 土壌品質ボーナス
      }
      if (vineyardUpgrades.weatherProtection > 0 && currentWeather.growthBonus < 1) {
        growthIncrease *= (1 + vineyardUpgrades.weatherProtection * 0.15); // 悪天候保護
      }

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

      // 灌漑システムの効果
      if (vineyardUpgrades.irrigationSystem > 0) {
        waterChange *= (1 - vineyardUpgrades.irrigationSystem * 0.2); // 水の消費を減らす
      }

      // 肥料の消費
      const fertilizerConsumption = 0.5;

      // 病気システム
      let healthChange = 1; // 基本回復

      // 剪定技術の効果
      if (vineyardUpgrades.pruningTechnique > 0) {
        healthChange += vineyardUpgrades.pruningTechnique * 0.5; // 健康度回復促進
      }

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
  }, [currentWeather, currentSeason, selectedRegion, getRegionalWeather, day, currentSeasonIndex, gameOver, gameWon, getClimateMasteryLevel, getClimateMasteryInfo, showToast, getClimateWeatherExplanation, regionExperience]);

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
          playSuccessSound();
          showToast(`🏆 ゴール達成！「${goal.title}」報酬: ${goal.reward}円`);

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
  }, [money, recentlyCompletedGoals, playSuccessSound, showToast]);

  const harvestPlot = useCallback((plotId: number) => {
    if (gameOver || gameWon) return;

    const plot = plots.find(p => p.id === plotId);
    if (!plot || !plot.isPlanted || plot.growth < 100) return;

    if (!currentSeason.harvestPossible) {
      showToast(`🍂 ${currentSeason.name_jp}は収穫の時期ではありません。秋までお待ちください。`);
      return;
    }

    const grapeType = REGIONAL_GRAPE_TYPES[selectedRegion.id as keyof RegionalGrapeTypes]?.find(g => g.id === plot.grapeType);
    if (!grapeType) return;

    // 特別ワインを作成できるかチェック
    const canCreateSpecial = canCreateSpecialWine(selectedRegion.koppenCode || '');
    const specialWineInfo = getSpecialWineInfo(selectedRegion.koppenCode || '');

    let wineChoice = 'sell';
    if (canCreateSpecial && specialWineInfo) {
      // マスター限定：特別ワインの選択肢を追加
      const choices = [
        `👑 ${specialWineInfo.name}を作る（マスター限定）`,
        '🍷 通常ワインを作る',
        '🍇 ブドウをそのまま売る'
      ];

      const choice = window.prompt(
        `🏆 気候マスターの特権！選択してください:\n\n1. ${choices[0]}\n2. ${choices[1]}\n3. ${choices[2]}\n\n番号を入力 (1-3):`
      );

      if (choice === '1') wineChoice = 'special';
      else if (choice === '2') wineChoice = 'normal';
      else if (choice === '3') wineChoice = 'sell';
      else return; // キャンセルまたは無効入力
    } else {
      // 通常の選択
      const makeWine = window.confirm('ブドウからワインを作りますか？（いいえでそのまま売却）');
      wineChoice = makeWine ? 'normal' : 'sell';
    }

    if (wineChoice === 'special' || wineChoice === 'normal') {
      // ワイン製造
      let quality = Math.min(100,
        plot.health * 0.4 +
        plot.growth * 0.3 +
        (plot.fertilizer > 70 ? 20 : plot.fertilizer * 0.2) +
        grapeType.qualityBonus * 10
      );

      let wineName = `${selectedRegion.name} ${grapeType.name}`;
      let wineValue = Math.floor(grapeType.price * quality / 50);
      let isSpecial = false;
      let specialType = '';
      let masteryBonus = 0;

      // 特別ワインの場合
      if (wineChoice === 'special' && specialWineInfo) {
        quality = Math.min(100, quality + specialWineInfo.qualityBonus);
        wineValue = Math.floor(wineValue * specialWineInfo.valueMultiplier);
        wineName = `${specialWineInfo.name} (${selectedRegion.name})`;
        isSpecial = true;
        specialType = specialWineInfo.type;
        masteryBonus = specialWineInfo.qualityBonus;
      }

      const wine: Wine = {
        id: `wine_${Date.now()}_${plotId}`,
        name: wineName,
        grapeType: grapeType.name,
        region: selectedRegion.name,
        quality: Math.floor(quality),
        age: 0,
        value: wineValue,
        productionDate: day,
        isSpecial,
        specialType,
        masteryBonus
      };

      setWines(prev => [...prev, wine]);
      playHarvestSound();

      if (isSpecial) {
        showToast(`👑 「${wine.name}」のマスター級ワインが完成！品質: ${wine.quality}ポイント`);
      } else {
        showToast(`🍷 「${wine.name}」のワインが完成しました！品質: ${wine.quality}ポイント`);
      }

      // ゴール達成チェック
      updateGoalProgress('wine_production', 1);
      updateGoalProgress('quality', wine.quality);
    } else {
      // そのまま売却
      const harvestValue = Math.floor(grapeType.price * 0.8);
      setMoney(prev => prev + harvestValue);
      showToast(`🍇 ブドウを${harvestValue}円で売却しました！`);
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
  }, [plots, currentSeason, selectedRegion, day, updateGoalProgress, gameOver, gameWon, playHarvestSound, showToast, canCreateSpecialWine, getSpecialWineInfo]);

  // ワインを売る関数
  const sellWine = useCallback((wineId: string) => {
    if (gameOver || gameWon) return;

    const wine = wines.find(w => w.id === wineId);
    if (!wine) return;

    const ageBonus = Math.floor(wine.age / 10) * 0.1; // 10日ごとに10%ボーナス
    const finalValue = Math.floor(wine.value * (1 + ageBonus));

    setMoney(prev => prev + finalValue);
    setWines(prev => prev.filter(w => w.id !== wineId));

    showToast(`🍷 「${wine.name}」を${finalValue}円で売却しました！`);
  }, [wines, gameOver, gameWon, showToast]);

  // 一括水やり
  const waterAllPlots = useCallback(() => {
    if (gameOver || gameWon) return;

    const plantedPlots = plots.filter(plot => plot.isPlanted);
    const waterNeeded = plantedPlots.length * 10;

    if (water < waterNeeded) {
      showToast(`💧 水が足りません！必要: ${waterNeeded}、現在: ${water}`);
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.isPlanted
        ? { ...plot, waterLevel: Math.min(100, plot.waterLevel + 30) }
        : plot
    ));
    setWater(prev => prev - waterNeeded);
    showToast(`💧 ${plantedPlots.length}つの畑に水やりを行いました！`);
  }, [plots, water, gameOver, gameWon, showToast]);

  // 一括施肥
  const fertilizeAllPlots = useCallback(() => {
    if (gameOver || gameWon) return;

    const plantedPlots = plots.filter(plot => plot.isPlanted);
    const fertilizerNeeded = plantedPlots.length * 5;

    if (fertilizer < fertilizerNeeded) {
      showToast(`🌱 肥料が足りません！必要: ${fertilizerNeeded}、現在: ${fertilizer}`);
      return;
    }

    setPlots(prev => prev.map(plot =>
      plot.isPlanted
        ? { ...plot, fertilizer: Math.min(100, plot.fertilizer + 25) }
        : plot
    ));
    setFertilizer(prev => prev - fertilizerNeeded);
    showToast(`🌱 ${plantedPlots.length}つの畑に施肥を行いました！`);
  }, [plots, fertilizer, gameOver, gameWon, showToast]);

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
      playSuccessSound();
      alert('おめでとうございます！すべてのゴールを達成しました！あなたは立派なワイン醸造家です！');
    }
  }, [goals, gameWon, gameOver, playSuccessSound]);

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
      showToast(`💊 治療費が足りません！必要: ${disease.treatmentCost}円`);
      return;
    }

    setMoney(prev => prev - disease.treatmentCost);
    setPlots(prev => prev.map(p =>
      p.id === plotId
        ? { ...p, disease: null, diseaseDay: 0 }
        : p
    ));

    showToast(`${disease.emoji} ${disease.name}を治療しました！費用: ${disease.treatmentCost}円`);
  }, [plots, money, showToast]);

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

        {/* 気候知識ステータス */}
        <div className="climate-knowledge-section">
          <h4>🌍 気候マスタリー</h4>
          {Object.entries(regionExperience).length > 0 ? (
            Object.entries(regionExperience).map(([koppenCode, exp]) => {
              const level = getClimateMasteryLevel(exp);
              const masteryInfo = getClimateMasteryInfo(koppenCode);
              const region = WINE_REGIONS.find(r => r.koppenCode === koppenCode);
              const levelColors = ['#666', '#8B4513', '#228B22', '#4169E1', '#9932CC', '#FFD700'];
              return (
                <div key={koppenCode} className="climate-mastery-item">
                  <span className="climate-code">{koppenCode}</span>
                  <span className="mastery-badge" style={{color: levelColors[level]}}>
                    {masteryInfo.levelIcon} {masteryInfo.levelName}
                  </span>
                  <span className="experience">{exp}XP</span>
                </div>
              );
            })
          ) : (
            <div className="no-experience">
              <span>まだ経験値なし</span>
              <small>ゲームを進めて気候を学ぼう！</small>
            </div>
          )}

          {/* 現在の地域のマスタリー情報 */}
          {selectedRegion.koppenCode && (
            <div className="current-region-mastery">
              <div className="current-region-header">
                📍 現在: {selectedRegion.koppenCode} ({selectedRegion.climate})
              </div>
              <div className="current-mastery-details">
                {(() => {
                  const currentExp = regionExperience[selectedRegion.koppenCode] || 0;
                  const currentLevel = getClimateMasteryLevel(currentExp);
                  const currentMasteryInfo = getClimateMasteryInfo(selectedRegion.koppenCode || '');
                  const nextLevel = currentLevel < 5 ? currentLevel + 1 : 5;
                  const levelColors = ['#666', '#8B4513', '#228B22', '#4169E1', '#9932CC', '#FFD700'];

                  if (currentLevel < 5) {
                    const expToNext = [1, 10, 30, 60, 100][currentLevel] - currentExp;
                    const levelNames = ['未体験', '入門', '初級', '中級', '上級', 'マスター'];
                    const levelIcons = ['❓', '🌱', '🌿', '🌳', '🌲', '👑'];
                    return (
                      <>
                        <div className="current-level">
                          <span style={{color: levelColors[currentLevel]}}>
                            {currentMasteryInfo.levelIcon} {currentMasteryInfo.levelName}
                          </span>
                          <span className="exp-display">{currentExp}XP</span>
                        </div>
                        <div className="next-level-info">
                          <small>
                            次のレベルまで: {expToNext}XP
                            <br />
                            🎯 {levelIcons[nextLevel]} {levelNames[nextLevel]}
                          </small>
                        </div>
                      </>
                    );
                  } else {
                    return (
                      <div className="master-achieved">
                        <span style={{color: levelColors[currentLevel]}}>
                          {currentMasteryInfo.levelIcon} {currentMasteryInfo.levelName}
                        </span>
                        <small>🎉 最高レベル達成！</small>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}
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
            <span>🌍 {selectedRegion.koppenCode}気候 ({selectedRegion.climate})</span>
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
                      <p className="koppen-classification">📊 ケッペン気候区分: <strong>{region.koppenCode}</strong> ({region.koppenName})</p>
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
                      <div key={wine.id} className={`wine-item ${wine.isSpecial ? 'special-wine' : ''}`}>
                        <div className="wine-header">
                          <h4>
                            {wine.isSpecial && <span className="special-wine-icon">👑</span>}
                            {wine.name}
                            {wine.isSpecial && <span className="special-wine-badge">マスター級</span>}
                          </h4>
                          <span className="wine-age">{wine.age}日熟成</span>
                        </div>
                        <div className="wine-details">
                          <span className="wine-quality">
                            品質: ★{wine.quality}
                            {wine.masteryBonus && <small> (+{wine.masteryBonus})</small>}
                          </span>
                          <span className="wine-value">価値: {Math.floor(wine.value * (1 + Math.floor(wine.age / 10) * 0.1))}円</span>
                        </div>
                        {wine.isSpecial && (
                          <div className="special-wine-description">
                            {(() => {
                              const specialInfo = getSpecialWineInfo(selectedRegion.koppenCode || '');
                              return specialInfo ? <small>{specialInfo.description}</small> : null;
                            })()}
                          </div>
                        )}
                        <button
                          onClick={() => sellWine(wine.id)}
                          className={`sell-wine-btn ${wine.isSpecial ? 'special' : ''}`}
                        >
                          {wine.isSpecial ? '👑 売却' : '売却'}
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
                <p>🌡️ {selectedRegion.climate} | 📊 ケッペン: <strong>{selectedRegion.koppenCode}</strong> ({selectedRegion.koppenName})</p>
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
                  {plots.map(plot => {
                    const isUnlocked = plot.id <= unlockedPlots;
                    const isNextToUnlock = plot.id === unlockedPlots + 1;

                    return (
                      <div key={plot.id} className="plot-container">
                        <div
                          className={
                            !isUnlocked
                              ? isNextToUnlock
                                ? 'grape-plot locked next-unlock'
                                : 'grape-plot locked'
                              : getPlotClass(plot)
                          }
                          onClick={() => {
                            if (!isUnlocked) {
                              if (isNextToUnlock) {
                                expandVineyard();
                              } else {
                                showToast('まず前の畑を解放してください');
                              }
                            } else if (!plot.isPlanted) {
                              plantGrape(plot.id);
                            } else if (plot.growth >= 100) {
                              harvestPlot(plot.id);
                            }
                          }}
                        title={
                          !isUnlocked
                            ? isNextToUnlock
                              ? `畑を拡張 - クリックで解放 (¥${getPlotExpansionCost(unlockedPlots)})`
                              : '未解放の畑'
                            : !plot.isPlanted
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
                        {!isUnlocked
                          ? isNextToUnlock
                            ? '🔓'  // 次に解放可能
                            : '🔒'  // 未解放
                          : getPlotDisplay(plot)
                        }
                      </div>

                      {isUnlocked && plot.isPlanted && plot.growth < 100 && (
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
                    );
                  })}
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
                    <label>
                      速度: {autoAdvanceSpeed === 2000 ? '遅い (2秒/日)' :
                             autoAdvanceSpeed === 1000 ? '普通 (1秒/日)' :
                             autoAdvanceSpeed === 500 ? '早い (0.5秒/日)' :
                             autoAdvanceSpeed === 200 ? '高速 (0.2秒/日)' :
                             `${autoAdvanceSpeed}ms/日`}
                    </label>
                    <button
                      onClick={() => setAutoAdvanceSpeed(2000)}
                      className={autoAdvanceSpeed === 2000 ? 'active' : ''}
                    >
                      🐌 遅い
                    </button>
                    <button
                      onClick={() => setAutoAdvanceSpeed(1000)}
                      className={autoAdvanceSpeed === 1000 ? 'active' : ''}
                    >
                      🚶 普通
                    </button>
                    <button
                      onClick={() => setAutoAdvanceSpeed(500)}
                      className={autoAdvanceSpeed === 500 ? 'active' : ''}
                    >
                      🏃 早い
                    </button>
                    <button
                      onClick={() => setAutoAdvanceSpeed(200)}
                      className={autoAdvanceSpeed === 200 ? 'active' : ''}
                    >
                      🚀 高速
                    </button>
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

                {/* 冬限定アクティビティ */}
                {currentSeason.name === 'winter' && (
                  <div className="winter-activities">
                    <h4>❄️ 冬の作業</h4>
                    <div className="winter-upgrades-info">
                      <div className="upgrade-status">
                        <span>🌿 剪定技術: Lv.{vineyardUpgrades.pruningTechnique}</span>
                        <span>🌍 土壌品質: Lv.{vineyardUpgrades.soilQuality}</span>
                      </div>
                      <div className="upgrade-status">
                        <span>🚰 灌漑システム: Lv.{vineyardUpgrades.irrigationSystem}</span>
                        <span>⛅ 天候保護: Lv.{vineyardUpgrades.weatherProtection}</span>
                      </div>
                    </div>
                    <div className="winter-action-buttons">
                      <button
                        onClick={performPruning}
                        className="game-action-btn winter-btn"
                        disabled={vineyardUpgrades.pruningTechnique >= 3}
                      >
                        🌿 剪定作業 ({(vineyardUpgrades.pruningTechnique + 1) * 50}円)
                      </button>
                      <button
                        onClick={improveSoil}
                        className="game-action-btn winter-btn"
                        disabled={vineyardUpgrades.soilQuality >= 3}
                      >
                        🌍 土壌改良 ({(vineyardUpgrades.soilQuality + 1) * 100}円)
                      </button>
                      <button
                        onClick={upgradeIrrigation}
                        className="game-action-btn winter-btn"
                        disabled={vineyardUpgrades.irrigationSystem >= 3}
                      >
                        🚰 灌漑改良 ({(vineyardUpgrades.irrigationSystem + 1) * 150}円)
                      </button>
                      <button
                        onClick={installWeatherProtection}
                        className="game-action-btn winter-btn"
                        disabled={vineyardUpgrades.weatherProtection >= 3}
                      >
                        ⛅ 天候保護 ({(vineyardUpgrades.weatherProtection + 1) * 200}円)
                      </button>
                    </div>
                  </div>
                )}
                <div className="audio-controls">
                  <button
                    onClick={async () => {
                      const newMusicState = !musicEnabled;
                      console.log('🎵 Music button clicked - changing from', musicEnabled, 'to', newMusicState);
                      await initializeAudio();
                      setMusicEnabled(newMusicState);
                    }}
                    className={`game-action-btn audio-btn ${musicEnabled ? 'active' : ''}`}
                  >
                    {musicEnabled ? '🔊 音楽OFF' : '🔈 音楽ON'}
                  </button>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`game-action-btn audio-btn ${soundEnabled ? 'active' : ''}`}
                  >
                    {soundEnabled ? '🎵 効果音OFF' : '🔇 効果音ON'}
                  </button>
                </div>
                <div className="learning-section">
                  <button
                    onClick={async () => {
                      await initializeAudio();
                      await playSound(523.25, 0.5, 0.1); // テスト音（C5）
                    }}
                    className="game-action-btn test-btn"
                  >
                    🔊 音テスト
                  </button>
                </div>
                <div className="game-stats">
                  <p>植えたブドウ: {plots.filter(p => p.isPlanted).length}/{unlockedPlots}</p>
                  <p>解放済み畑: {unlockedPlots}/12</p>
                  <p>収穫可能: {plots.filter(p => p.growth >= 100 && p.canHarvest).length}</p>
                  <p className="season-info">
                    {currentSeason.plantingOptimal && '🌱 植え付け時期'}
                    {currentSeason.harvestPossible && '🍇 収穫時期'}
                    {!currentSeason.plantingOptimal && !currentSeason.harvestPossible && '🕰️ 管理時期'}
                  </p>

                  {/* 気候マスターレベル表示 */}
                  {(() => {
                    const masteryInfo = getClimateMasteryInfo(selectedRegion.koppenCode || '');
                    return (
                      <div className="climate-mastery-info">
                        <p>
                          {masteryInfo.levelIcon} {selectedRegion.koppenCode}気候: {masteryInfo.levelName}
                          <small> ({masteryInfo.experience}/{masteryInfo.nextLevelExp})</small>
                        </p>
                        {masteryInfo.isMaster && (
                          <p style={{color: 'gold', fontSize: '0.9em'}}>👑 マスター特権でプレミアムワイン解禁中！</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* トースト通知（画面下部に固定表示） */}
        {toastMessage && (
          <div
            className="toast-notification"
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#333',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              zIndex: 1000,
              fontSize: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              animation: 'fadeInOut 3s ease-in-out'
            }}
          >
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleVineyardGame;