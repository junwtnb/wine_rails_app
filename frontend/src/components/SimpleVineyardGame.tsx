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
  terroir: string; // テロワールID
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
  agingPotential: number; // 熟成ポテンシャル (0-100)
  peakAge: number; // ピーク品質になる年数
  storedInCellar: boolean; // セラー保管中
  cellarSlotId?: string; // セラーのスロットID
}

interface WineCellar {
  id: string;
  name: string;
  emoji: string;
  description: string;
  capacity: number; // 収容可能なワイン数
  temperature: number; // 保管温度（℃）
  humidity: number; // 湿度（%）
  agingEfficiency: number; // 熟成効率倍率
  maintenanceCost: number; // 月額維持費
  purchaseCost: number; // 購入費用
}

interface CellarSlot {
  id: string;
  wineId: string | null;
  storedDay: number; // 保管開始日
  temperature: number; // 保管温度
  humidity: number; // 湿度
}

interface GameGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward: number;
  type: 'money' | 'wine_production' | 'quality' | 'harvest' | 'plots' | 'days_survived' | 'quality_wines' | 'climate_mastery' | 'winter_upgrades' | 'special_wines' | 'master_quality';
}

interface CompetitionEntry {
  playerName: string;
  wineName: string;
  quality: number;
  isPlayer: boolean;
  region: string;
  grapeType: string;
}

interface Competition {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  prizes: number[];
  minQuality: number;
  season: string;
  isActive: boolean;
  entries: CompetitionEntry[];
}

interface Terroir {
  id: string;
  name: string;
  emoji: string;
  description: string;
  drainageBonus: number;      // 水はけ効果 (1.0 = 普通, >1.0 = 良い, <1.0 = 悪い)
  sunlightBonus: number;      // 日照効果
  qualityMultiplier: number;  // 品質ボーナス
  costMultiplier: number;     // 土地価格倍率
  specialEffects: string[];   // 特殊効果
}

interface Staff {
  id: string;
  name: string;
  emoji: string;
  description: string;
  hiringCost: number;
  monthlySalary: number;
  specialties: string[];
  autoActions: string[];      // 自動実行する作業
  efficiency: number;         // 作業効率 (1.0 = 通常, >1.0 = 高効率)
  experience: number;         // 経験値 (0-100)
  level: number;             // レベル (1-5)
}

interface HiredStaff {
  staffId: string;
  hiredDay: number;
  experience: number;
  level: number;
  lastSalaryPaid: number;
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

interface RandomEvent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  type: 'weather' | 'market' | 'visitor' | 'news';
  probability: number; // 発生確率 (0-1)
  effects: {
    money?: number;
    reputation?: number;
    wineValue?: number; // ワイン価値の変動率 (1.0 = 変動なし)
    plotDamage?: number; // プロットへのダメージ
    plotCount?: number; // 影響するプロット数
    duration?: number; // 効果持続日数
  };
  season?: string; // 特定の季節でのみ発生 (オプション)
  oneTimeOnly?: boolean; // 一回限りのイベント
  condition?: (gameState: any) => boolean; // 発生条件
}

interface ActiveEvent {
  eventId: string;
  startDay: number;
  remainingDays: number;
  effects: RandomEvent['effects'];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'production' | 'quality' | 'economic' | 'exploration' | 'special' | 'mastery';
  tier: 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';
  requirements: {
    type: string;
    target: number;
    condition?: (gameState: any) => boolean;
  }[];
  reward: {
    money?: number;
    title?: string;
    unlocks?: string[];
  };
  isSecret?: boolean;
  unlockedAt?: number;
}

interface PlayerTitle {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requirement: string;
}

interface AchievementProgress {
  achievementId: string;
  progress: { [requirementType: string]: number };
  completed: boolean;
  unlockedDay: number | null;
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

// テロワール（土地特性）設定
const TERROIRS: Terroir[] = [
  {
    id: 'hillside',
    name: '丘陵地',
    emoji: '🏔️',
    description: '水はけが良く、日照に恵まれた高品質区画',
    drainageBonus: 1.3,
    sunlightBonus: 1.2,
    qualityMultiplier: 1.25,
    costMultiplier: 1.8,
    specialEffects: ['干ばつ耐性', '高品質ボーナス']
  },
  {
    id: 'valley',
    name: '平地',
    emoji: '🌾',
    description: '標準的な栽培環境、バランスの取れた区画',
    drainageBonus: 1.0,
    sunlightBonus: 1.0,
    qualityMultiplier: 1.0,
    costMultiplier: 1.0,
    specialEffects: ['標準栽培']
  },
  {
    id: 'riverside',
    name: '川沿い',
    emoji: '🌊',
    description: '水資源豊富だが湿気が多い区画',
    drainageBonus: 0.7,
    sunlightBonus: 0.9,
    qualityMultiplier: 0.9,
    costMultiplier: 0.6,
    specialEffects: ['水資源豊富', '病気リスク高']
  }
];

// 畑の初期配置パターン（12個の区画のテロワール）
const PLOT_TERROIR_LAYOUT = [
  'hillside', 'hillside', 'valley', 'valley',     // 1-4: 丘陵2, 平地2
  'valley', 'valley', 'riverside', 'riverside',   // 5-8: 平地2, 川沿い2
  'hillside', 'valley', 'riverside', 'hillside'   // 9-12: 混合
];

// 品評会設定
const WINE_COMPETITIONS: Competition[] = [
  {
    id: 'spring_new_wine',
    name: '春の新酒品評会',
    description: '新しく作られたワインの品質を競います',
    entryFee: 100,
    prizes: [800, 500, 200],
    minQuality: 60,
    season: 'spring',
    isActive: false,
    entries: []
  },
  {
    id: 'summer_premium',
    name: '夏のプレミアム品評会',
    description: '高品質ワインのみ参加可能な品評会',
    entryFee: 300,
    prizes: [1500, 800, 400],
    minQuality: 80,
    season: 'summer',
    isActive: false,
    entries: []
  },
  {
    id: 'autumn_harvest',
    name: '秋の収穫祭品評会',
    description: '収穫の季節を祝う特別な品評会',
    entryFee: 200,
    prizes: [1200, 600, 300],
    minQuality: 70,
    season: 'autumn',
    isActive: false,
    entries: []
  },
  {
    id: 'winter_masters',
    name: '冬のマスター品評会',
    description: '最高品質のワインのみが参加できる品評会',
    entryFee: 500,
    prizes: [2500, 1200, 600],
    minQuality: 90,
    season: 'winter',
    isActive: false,
    entries: []
  }
];

// AIプレイヤーの名前リスト
const AI_PLAYER_NAMES = [
  'フランソワ・デュボワ', 'マリア・ロッシ', '田中一郎', 'ハンス・ミュラー',
  'カルロス・サンチェス', 'エミリー・スミス', 'ピエール・マルタン', 'アンナ・ノヴァク',
  'ジョン・ウィルソン', 'ルチア・フェラーリ', 'ケンジ・サトウ', 'ミゲル・ガルシア'
];

// スタッフ定義
const AVAILABLE_STAFF: Staff[] = [
  {
    id: 'vineyard_assistant',
    name: '畑作業アシスタント',
    emoji: '👨‍🌾',
    description: '水やりと施肥を自動で行います',
    hiringCost: 2000,
    monthlySalary: 500,
    specialties: ['水やり', '施肥'],
    autoActions: ['watering', 'fertilizing'],
    efficiency: 1.0,
    experience: 0,
    level: 1
  },
  {
    id: 'harvest_specialist',
    name: '収穫スペシャリスト',
    emoji: '👩‍🌾',
    description: '収穫可能なブドウを自動で収穫してワインを作ります',
    hiringCost: 4000,
    monthlySalary: 800,
    specialties: ['収穫', 'ワイン製造'],
    autoActions: ['harvesting'],
    efficiency: 1.1,
    experience: 0,
    level: 1
  },
  {
    id: 'plant_manager',
    name: '植付マネージャー',
    emoji: '🧑‍💼',
    description: '空いた畑に自動でブドウを植えます',
    hiringCost: 3000,
    monthlySalary: 600,
    specialties: ['植付', '畑管理'],
    autoActions: ['planting'],
    efficiency: 1.0,
    experience: 0,
    level: 1
  },
  {
    id: 'disease_doctor',
    name: '病気治療師',
    emoji: '🩺',
    description: '病気の早期発見と治療を行います',
    hiringCost: 5000,
    monthlySalary: 1000,
    specialties: ['病気治療', '健康管理'],
    autoActions: ['disease_treatment'],
    efficiency: 1.2,
    experience: 0,
    level: 1
  },
  {
    id: 'master_vintner',
    name: 'マスターヴィントナー',
    emoji: '🍷',
    description: '高品質ワイン製造に特化した専門家',
    hiringCost: 10000,
    monthlySalary: 2000,
    specialties: ['プレミアムワイン製造', '品質管理'],
    autoActions: ['premium_winemaking'],
    efficiency: 1.5,
    experience: 0,
    level: 1
  }
];

// ランダムイベント設定
const RANDOM_EVENTS: RandomEvent[] = [
  // 天気関連イベント
  {
    id: 'perfect_weather',
    name: '理想的な気候',
    emoji: '🌅',
    description: '完璧な天候が続き、ブドウの成長が促進されています',
    type: 'weather',
    probability: 0.02,
    effects: {
      plotCount: 999, // 全ての畑に影響
      duration: 7
    },
    condition: (gameState) => gameState.currentSeasonIndex === 1 || gameState.currentSeasonIndex === 2 // 夏・秋
  },
  {
    id: 'drought',
    name: '干ばつ',
    emoji: '🌵',
    description: '深刻な干ばつで水の消費量が倍増しています',
    type: 'weather',
    probability: 0.015,
    effects: {
      duration: 14
    },
    condition: (gameState) => gameState.currentSeasonIndex === 1 // 夏
  },
  {
    id: 'unexpected_rain',
    name: '恵みの雨',
    emoji: '🌦️',
    description: '予期しない雨でブドウが潤い、水やりコストが削減されます',
    type: 'weather',
    probability: 0.02,
    effects: {
      duration: 5
    }
  },

  // 市場関連イベント
  {
    id: 'wine_boom',
    name: 'ワインブーム',
    emoji: '📈',
    description: 'ワインの需要が急激に高まり、価格が上昇しています',
    type: 'market',
    probability: 0.01,
    effects: {
      wineValue: 1.5,
      duration: 21
    }
  },
  {
    id: 'market_crash',
    name: '市場暴落',
    emoji: '📉',
    description: '経済不況でワインの価格が下落しています',
    type: 'market',
    probability: 0.008,
    effects: {
      wineValue: 0.6,
      duration: 28
    }
  },
  {
    id: 'luxury_demand',
    name: '高級品需要',
    emoji: '💎',
    description: '富裕層の高級ワイン需要が増加、品質の高いワインに高値がつきます',
    type: 'market',
    probability: 0.012,
    effects: {
      duration: 14
    },
    condition: (gameState) => gameState.wines.some((w: any) => w.quality >= 80)
  },

  // 来客関連イベント
  {
    id: 'wine_critic',
    name: 'ワイン評論家の訪問',
    emoji: '🍷',
    description: '有名なワイン評論家があなたのワイナリーを訪問しました',
    type: 'visitor',
    probability: 0.005,
    effects: {
      money: 500,
      reputation: 20
    },
    oneTimeOnly: true,
    condition: (gameState) => gameState.wines.length >= 3 && gameState.day >= 60
  },
  {
    id: 'tourist_group',
    name: '観光客の団体',
    emoji: '👥',
    description: '観光客の団体がワイナリー見学に訪れ、お土産を購入していきました',
    type: 'visitor',
    probability: 0.015,
    effects: {
      money: 200
    },
    condition: (gameState) => gameState.wines.length >= 1
  },
  {
    id: 'celebrity_endorsement',
    name: 'セレブの推薦',
    emoji: '⭐',
    description: '有名人があなたのワインを絶賛！知名度が大幅に向上しました',
    type: 'visitor',
    probability: 0.002,
    effects: {
      money: 1000,
      wineValue: 1.3,
      duration: 30
    },
    oneTimeOnly: true,
    condition: (gameState) => gameState.wines.some((w: any) => w.quality >= 90) && gameState.day >= 100
  },

  // ニュース関連イベント
  {
    id: 'wine_competition_win',
    name: '国際コンクール入賞',
    emoji: '🏆',
    description: 'あなたのワインが国際コンクールで入賞し、大きな話題となりました',
    type: 'news',
    probability: 0.003,
    effects: {
      money: 800,
      wineValue: 1.4,
      duration: 45
    },
    oneTimeOnly: true,
    condition: (gameState) => gameState.wines.some((w: any) => w.quality >= 85)
  },
  {
    id: 'government_subsidy',
    name: '政府補助金',
    emoji: '🏛️',
    description: '農業振興政策により、補助金が支給されました',
    type: 'news',
    probability: 0.008,
    effects: {
      money: 300
    },
    condition: (gameState) => gameState.day >= 30
  },
  {
    id: 'new_trade_deal',
    name: '貿易協定',
    emoji: '🤝',
    description: '新しい貿易協定により、ワイン輸出の機会が拡大しました',
    type: 'news',
    probability: 0.006,
    effects: {
      wineValue: 1.2,
      duration: 60
    },
    condition: (gameState) => gameState.wines.length >= 5
  },

  // 災害・困難なイベント
  {
    id: 'equipment_failure',
    name: '機械故障',
    emoji: '⚙️',
    description: 'ワイン製造設備が故障し、修理費用が発生しました',
    type: 'news',
    probability: 0.01,
    effects: {
      money: -400
    }
  },
  {
    id: 'labor_shortage',
    name: '人手不足',
    emoji: '👥',
    description: '季節労働者の確保が困難になり、作業効率が低下しています',
    type: 'news',
    probability: 0.012,
    effects: {
      duration: 14
    },
    season: 'autumn'
  }
];

// 実績システム
const ACHIEVEMENTS: Achievement[] = [
  // 生産系実績 (Production)
  {
    id: 'first_wine',
    name: 'ワイン醸造初心者',
    description: '初めてのワインを醸造する',
    emoji: '🍷',
    category: 'production',
    tier: 'bronze',
    requirements: [{ type: 'wines_produced', target: 1 }],
    reward: { money: 100, title: 'apprentice_winemaker' }
  },
  {
    id: 'wine_master',
    name: 'ワイン醸造マスター',
    description: 'ワインを100本醸造する',
    emoji: '🏆',
    category: 'production',
    tier: 'gold',
    requirements: [{ type: 'wines_produced', target: 100 }],
    reward: { money: 2000, title: 'master_winemaker' }
  },
  {
    id: 'mass_producer',
    name: '大量生産者',
    description: '1日で5本以上のワインを生産する',
    emoji: '🏭',
    category: 'production',
    tier: 'silver',
    requirements: [{ type: 'daily_wine_production', target: 5 }],
    reward: { money: 500, title: 'industrial_producer' }
  },

  // 品質系実績 (Quality)
  {
    id: 'quality_wine',
    name: '品質追求者',
    description: '品質90以上のワインを作る',
    emoji: '⭐',
    category: 'quality',
    tier: 'silver',
    requirements: [{ type: 'max_wine_quality', target: 90 }],
    reward: { money: 800, title: 'quality_craftsman' }
  },
  {
    id: 'perfect_wine',
    name: '完璧主義者',
    description: '品質100の完璧なワインを作る',
    emoji: '💎',
    category: 'quality',
    tier: 'diamond',
    requirements: [{ type: 'max_wine_quality', target: 100 }],
    reward: { money: 3000, title: 'perfectionist' }
  },
  {
    id: 'consistent_quality',
    name: '品質安定マスター',
    description: '品質80以上のワインを連続10本作る',
    emoji: '📊',
    category: 'quality',
    tier: 'gold',
    requirements: [{ type: 'consecutive_quality_wines', target: 10 }],
    reward: { money: 1500, title: 'quality_master' }
  },

  // 経済系実績 (Economic)
  {
    id: 'first_millionaire',
    name: '初代大富豪',
    description: '1万円を貯める',
    emoji: '💰',
    category: 'economic',
    tier: 'silver',
    requirements: [{ type: 'max_money', target: 10000 }],
    reward: { money: 1000, title: 'wealthy_vintner' }
  },
  {
    id: 'wine_mogul',
    name: 'ワイン大富豪',
    description: '10万円を貯める',
    emoji: '🏛️',
    category: 'economic',
    tier: 'diamond',
    requirements: [{ type: 'max_money', target: 100000 }],
    reward: { money: 10000, title: 'wine_mogul' }
  },
  {
    id: 'big_spender',
    name: '散財王',
    description: '累計で5万円を支出する',
    emoji: '💸',
    category: 'economic',
    tier: 'gold',
    requirements: [{ type: 'total_spent', target: 50000 }],
    reward: { money: 2000, title: 'big_spender' }
  },

  // 探索系実績 (Exploration)
  {
    id: 'world_traveler',
    name: '世界の旅人',
    description: '全ての地域を訪問する',
    emoji: '🌍',
    category: 'exploration',
    tier: 'gold',
    requirements: [{ type: 'regions_visited', target: 4 }],
    reward: { money: 2000, title: 'world_explorer' }
  },
  {
    id: 'climate_researcher',
    name: '気候研究者',
    description: '3つの気候区分でマスタリーレベル3に到達',
    emoji: '🌡️',
    category: 'exploration',
    tier: 'diamond',
    requirements: [{ type: 'climate_mastery_level_3', target: 3 }],
    reward: { money: 5000, title: 'climate_scientist' }
  },

  // 特殊実績 (Special)
  {
    id: 'disaster_survivor',
    name: '災害サバイバー',
    description: '10回の災害を乗り越える',
    emoji: '🛡️',
    category: 'special',
    tier: 'silver',
    requirements: [{ type: 'disasters_survived', target: 10 }],
    reward: { money: 1000, title: 'survivor' }
  },
  {
    id: 'lucky_player',
    name: 'ラッキープレイヤー',
    description: 'セレブの推薦イベントを経験する',
    emoji: '🍀',
    category: 'special',
    tier: 'gold',
    requirements: [{ type: 'celebrity_endorsement', target: 1 }],
    reward: { money: 2000, title: 'celebrity_favorite' },
    isSecret: true
  },

  // マスタリー系実績 (Mastery)
  {
    id: 'time_master',
    name: 'タイムマスター',
    description: '1年間（120日）生き延びる',
    emoji: '⏳',
    category: 'mastery',
    tier: 'silver',
    requirements: [{ type: 'days_survived', target: 120 }],
    reward: { money: 1000, title: 'time_keeper' }
  },
  {
    id: 'legendary_vintner',
    name: '伝説のワイン醸造家',
    description: '全ての基本実績を達成する',
    emoji: '👑',
    category: 'mastery',
    tier: 'legendary',
    requirements: [
      { type: 'wines_produced', target: 50 },
      { type: 'max_wine_quality', target: 95 },
      { type: 'max_money', target: 50000 },
      { type: 'days_survived', target: 200 }
    ],
    reward: { money: 10000, title: 'legendary_master' },
    isSecret: true
  }
];

// プレイヤータイトル
const PLAYER_TITLES: PlayerTitle[] = [
  { id: 'apprentice_winemaker', name: 'ワイン醸造見習い', description: '初めてワインを作った証', emoji: '🍇', requirement: '初ワイン醸造' },
  { id: 'master_winemaker', name: 'ワイン醸造マスター', description: '100本のワインを醸造した実力者', emoji: '🏆', requirement: 'ワイン100本醸造' },
  { id: 'industrial_producer', name: '工業生産者', description: '効率的な大量生産を実現', emoji: '🏭', requirement: '1日5本生産' },
  { id: 'quality_craftsman', name: '品質職人', description: '高品質ワインへの情熱', emoji: '⭐', requirement: '品質90達成' },
  { id: 'perfectionist', name: '完璧主義者', description: '完璧なワインを追求する者', emoji: '💎', requirement: '品質100達成' },
  { id: 'quality_master', name: '品質マスター', description: '安定した高品質を維持', emoji: '📊', requirement: '連続高品質' },
  { id: 'wealthy_vintner', name: '富裕ワイン醸造家', description: '成功を収めたワイン醸造家', emoji: '💰', requirement: '1万円達成' },
  { id: 'wine_mogul', name: 'ワイン大富豪', description: '業界を牛耳る大富豪', emoji: '🏛️', requirement: '10万円達成' },
  { id: 'big_spender', name: '散財王', description: '投資を惜しまない経営者', emoji: '💸', requirement: '5万円支出' },
  { id: 'world_explorer', name: '世界探検家', description: '世界各地を巡った冒険者', emoji: '🌍', requirement: '全地域訪問' },
  { id: 'climate_scientist', name: '気候科学者', description: '気候を深く理解する研究者', emoji: '🌡️', requirement: '気候マスタリー' },
  { id: 'survivor', name: 'サバイバー', description: '数々の困難を乗り越えた強者', emoji: '🛡️', requirement: '災害10回克服' },
  { id: 'celebrity_favorite', name: 'セレブのお気に入り', description: '有名人も認める醸造家', emoji: '🍀', requirement: 'セレブ推薦' },
  { id: 'time_keeper', name: 'タイムキーパー', description: '時の流れを制する者', emoji: '⏳', requirement: '1年生存' },
  { id: 'legendary_master', name: '伝説のマスター', description: '全てを極めた真のマスター', emoji: '👑', requirement: '全実績達成' }
];

const GAME_GOALS = [
  // 初級ミッション
  { id: 'first_harvest', title: '初回収穫', description: 'ブドウを1本収穫する', target: 1, current: 0, completed: false, reward: 200, type: 'harvest' as const },
  { id: 'expand_vineyard', title: '畑の拡張', description: '畑を6個まで拡張する', target: 6, current: 4, completed: false, reward: 400, type: 'plots' as const },
  { id: 'wine_maker', title: 'ワイン醸造家', description: 'ワインを8本作る', target: 8, current: 0, completed: false, reward: 600, type: 'wine_production' as const },

  // 中級ミッション
  { id: 'seasonal_master', title: '季節マスター', description: '春夏秋冬を2回経験する（2年間運営）', target: 240, current: 0, completed: false, reward: 800, type: 'days_survived' as const },
  { id: 'quality_master', title: '品質マスター', description: '品質85以上のワインを3本作る', target: 3, current: 0, completed: false, reward: 1000, type: 'quality_wines' as const },
  { id: 'money_goal_1', title: '財産形成', description: '5000円を貯める', target: 5000, current: 1000, completed: false, reward: 0, type: 'money' as const },

  // 上級ミッション
  { id: 'climate_expert', title: '気候エキスパート', description: '3つの気候区分でマスターレベルに到達', target: 3, current: 0, completed: false, reward: 1500, type: 'climate_mastery' as const },
  { id: 'winter_investor', title: '冬の投資家', description: '冬季設備を全てレベル3まで強化', target: 12, current: 0, completed: false, reward: 1200, type: 'winter_upgrades' as const },
  { id: 'premium_producer', title: 'プレミアム生産者', description: '特別ワインを5本作る', target: 5, current: 0, completed: false, reward: 2000, type: 'special_wines' as const },

  // 最終ミッション
  { id: 'money_goal_2', title: 'ワイン帝国', description: '15000円を貯める', target: 15000, current: 1000, completed: false, reward: 0, type: 'money' as const },
  { id: 'master_vintner', title: 'マスターヴィントナー', description: '品質90以上のワインを10本作る', target: 10, current: 0, completed: false, reward: 3000, type: 'master_quality' as const }
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
  agingPotential: number; // 熟成ポテンシャル (0-100)
  peakAge: number; // ピーク品質になる年数
}

type RegionalGrapeTypes = {
  [K in WineRegion['id']]: GrapeType[];
};

// ワインセラーの定義
const WINE_CELLARS: WineCellar[] = [
  {
    id: 'basic_cellar',
    name: '基本セラー',
    emoji: '🏠',
    description: '温度・湿度管理のある小さなセラー',
    capacity: 10,
    temperature: 12,
    humidity: 70,
    agingEfficiency: 1.0,
    maintenanceCost: 500,
    purchaseCost: 5000
  },
  {
    id: 'cave_cellar',
    name: '地下洞窟セラー',
    emoji: '⛰️',
    description: '自然の地下洞窟を利用した理想的な環境',
    capacity: 25,
    temperature: 10,
    humidity: 75,
    agingEfficiency: 1.3,
    maintenanceCost: 800,
    purchaseCost: 15000
  },
  {
    id: 'premium_cellar',
    name: 'プレミアムセラー',
    emoji: '🏛️',
    description: '最高級の温度・湿度制御システム',
    capacity: 50,
    temperature: 11,
    humidity: 73,
    agingEfficiency: 1.5,
    maintenanceCost: 1500,
    purchaseCost: 30000
  },
  {
    id: 'underground_vault',
    name: '地下貯蔵庫',
    emoji: '🏰',
    description: 'プロ仕様の大型地下貯蔵施設',
    capacity: 100,
    temperature: 10,
    humidity: 75,
    agingEfficiency: 1.7,
    maintenanceCost: 3000,
    purchaseCost: 60000
  }
];

const REGIONAL_GRAPE_TYPES: RegionalGrapeTypes = {
  bordeaux: [
    { id: 'cabernet_sauvignon', name: 'カベルネ・ソーヴィニヨン', emoji: '🍇', price: 150, waterNeeds: 2, qualityBonus: 1.3, agingPotential: 85, peakAge: 8 },
    { id: 'merlot', name: 'メルロー', emoji: '🍇', price: 130, waterNeeds: 2.5, qualityBonus: 1.2, agingPotential: 75, peakAge: 5 },
    { id: 'sauvignon_blanc', name: 'ソーヴィニヨン・ブラン', emoji: '🤍', price: 110, waterNeeds: 1.8, qualityBonus: 1.1, agingPotential: 45, peakAge: 2 }
  ],
  burgundy: [
    { id: 'pinot_noir', name: 'ピノ・ノワール', emoji: '🍇', price: 200, waterNeeds: 1.5, qualityBonus: 1.5, agingPotential: 90, peakAge: 10 },
    { id: 'chardonnay', name: 'シャルドネ', emoji: '🤍', price: 120, waterNeeds: 1.8, qualityBonus: 1.3, agingPotential: 70, peakAge: 5 }
  ],
  champagne: [
    { id: 'chardonnay_champagne', name: 'シャルドネ（シャンパーニュ）', emoji: '✨', price: 180, waterNeeds: 1.2, qualityBonus: 1.4, agingPotential: 80, peakAge: 7 },
    { id: 'pinot_noir_champagne', name: 'ピノ・ノワール（シャンパーニュ）', emoji: '✨', price: 190, waterNeeds: 1.3, qualityBonus: 1.4, agingPotential: 85, peakAge: 8 }
  ],
  napa: [
    { id: 'napa_cabernet', name: 'ナパ カベルネ', emoji: '🍇', price: 170, waterNeeds: 1.0, qualityBonus: 1.4, agingPotential: 88, peakAge: 12 },
    { id: 'napa_chardonnay', name: 'ナパ シャルドネ', emoji: '🤍', price: 140, waterNeeds: 1.2, qualityBonus: 1.2, agingPotential: 65, peakAge: 4 }
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
      disasterDay: 0,
      terroir: PLOT_TERROIR_LAYOUT[i]
    }))
  );

  // テロワール取得関数
  const getTerroir = useCallback((terroirId: string): Terroir => {
    return TERROIRS.find(t => t.id === terroirId) || TERROIRS[1]; // 見つからない場合は平地をデフォルト
  }, []);

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
  const [ownedCellars, setOwnedCellars] = useState<string[]>([]);
  const [cellarSlots, setCellarSlots] = useState<{ [cellarId: string]: CellarSlot[] }>({});
  const [showCellarPanel, setShowCellarPanel] = useState(false);
  const [competitions, setCompetitions] = useState<Competition[]>(WINE_COMPETITIONS.map(c => ({ ...c })));
  const [showCompetitions, setShowCompetitions] = useState(false);
  const [competitionResults, setCompetitionResults] = useState<string | null>(null);
  const [showRegionMigration, setShowRegionMigration] = useState(false);
  const [hiredStaff, setHiredStaff] = useState<HiredStaff[]>([]);
  const [showStaffPanel, setShowStaffPanel] = useState(false);
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

  // ランダムイベントシステム
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [triggeredOneTimeEvents, setTriggeredOneTimeEvents] = useState<string[]>([]);
  const [currentEvent, setCurrentEvent] = useState<RandomEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventHistory, setEventHistory] = useState<(RandomEvent & { day: number })[]>([]);
  const [showEventHistory, setShowEventHistory] = useState(false);

  // 実績システム
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>(() =>
    ACHIEVEMENTS.map(achievement => ({
      achievementId: achievement.id,
      progress: achievement.requirements.reduce((acc, req) => ({ ...acc, [req.type]: 0 }), {}),
      completed: false,
      unlockedDay: null
    }))
  );
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // ゲーム統計（実績追跡用）
  const [gameStats, setGameStats] = useState({
    totalWinesProduced: 0,
    maxWineQuality: 0,
    maxMoney: 0,
    totalSpent: 0,
    regionsVisited: new Set<string>(),
    disastersSurvived: 0,
    consecutiveQualityWines: 0,
    dailyWineProduction: 0,
    celebrityEndorsements: 0,
    climateMasteryAchievements: new Set<string>()
  });

  // トースト通知を表示する関数
  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000); // 3秒後に消す
  }, []);

  // 実績処理関数
  const updateAchievementProgress = useCallback((type: string, value: number, additionalData?: any) => {
    setAchievementProgress(prev => {
      const updated = prev.map(progress => {
        const achievement = ACHIEVEMENTS.find(a => a.id === progress.achievementId);
        if (!achievement || progress.completed) return progress;

        const relevantRequirements = achievement.requirements.filter(req => req.type === type);
        if (relevantRequirements.length === 0) return progress;

        const newProgress = { ...progress };
        let shouldCheck = false;

        for (const req of relevantRequirements) {
          // 条件チェック
          if (req.condition && !req.condition({ ...gameStats, ...additionalData })) continue;

          // 累積型の統計を更新
          if (['wines_produced', 'total_spent', 'disasters_survived'].includes(type)) {
            newProgress.progress[type] = (newProgress.progress[type] || 0) + value;
            shouldCheck = true;
          }
          // 最大値型の統計を更新
          else if (['max_wine_quality', 'max_money'].includes(type)) {
            if (value > (newProgress.progress[type] || 0)) {
              newProgress.progress[type] = value;
              shouldCheck = true;
            }
          }
          // 連続型の統計を更新
          else if (type === 'consecutive_quality_wines') {
            if (additionalData?.reset) {
              newProgress.progress[type] = 0;
            } else if (value >= 80) {
              newProgress.progress[type] = (newProgress.progress[type] || 0) + 1;
              shouldCheck = true;
            } else {
              newProgress.progress[type] = 0;
            }
          }
          // その他の統計を更新
          else {
            newProgress.progress[type] = value;
            shouldCheck = true;
          }
        }

        // 実績達成チェック
        if (shouldCheck && !newProgress.completed) {
          const allRequirementsMet = achievement.requirements.every(req => {
            const currentValue = newProgress.progress[req.type] || 0;
            return currentValue >= req.target;
          });

          if (allRequirementsMet) {
            newProgress.completed = true;
            newProgress.unlockedDay = day;

            // 実績解除処理
            setTimeout(() => unlockAchievement(achievement), 100);
          }
        }

        return newProgress;
      });

      return updated;
    });
  }, [day, gameStats]);

  const unlockAchievement = useCallback((achievement: Achievement) => {
    // 報酬を付与
    if (achievement.reward.money) {
      setMoney(prev => prev + achievement.reward.money!);
    }

    // タイトルを解除
    if (achievement.reward.title) {
      setUnlockedTitles(prev => {
        if (!prev.includes(achievement.reward.title!)) {
          return [...prev, achievement.reward.title!];
        }
        return prev;
      });
    }

    // 新実績として通知キューに追加
    setNewAchievements(prev => [...prev, achievement]);

    // 実績解除トースト
    const tierEmoji = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      diamond: '💎',
      legendary: '👑'
    }[achievement.tier];

    showToast(`${tierEmoji} 実績解除: ${achievement.name}！`);

    // 報酬のトースト
    if (achievement.reward.money) {
      setTimeout(() => {
        showToast(`💰 報酬: ${achievement.reward.money}円を獲得！`);
      }, 1500);
    }

    if (achievement.reward.title) {
      setTimeout(() => {
        const title = PLAYER_TITLES.find(t => t.id === achievement.reward.title);
        if (title) {
          showToast(`🏷️ 新しいタイトル「${title.name}」を獲得！`);
        }
      }, 3000);
    }
  }, [showToast]);

  const getTitleByName = useCallback((titleId: string): PlayerTitle | null => {
    return PLAYER_TITLES.find(t => t.id === titleId) || null;
  }, []);

  // ランダムイベント処理関数
  const checkRandomEvents = useCallback(() => {
    const gameState = {
      day,
      money,
      wines,
      plots,
      currentSeasonIndex,
      currentSeason
    };

    for (const event of RANDOM_EVENTS) {
      // 一回限りのイベントで既に発生済みの場合はスキップ
      if (event.oneTimeOnly && triggeredOneTimeEvents.includes(event.id)) {
        continue;
      }

      // 季節条件チェック
      if (event.season && event.season !== currentSeason.name) {
        continue;
      }

      // カスタム条件チェック
      if (event.condition && !event.condition(gameState)) {
        continue;
      }

      // 確率判定
      if (Math.random() < event.probability) {
        triggerEvent(event);
        break; // 1日に1つのイベントまで
      }
    }
  }, [day, money, wines, plots, currentSeasonIndex, currentSeason, triggeredOneTimeEvents]);

  const triggerEvent = useCallback((event: RandomEvent) => {
    setCurrentEvent(event);
    setShowEventModal(true);

    // イベント履歴に追加
    setEventHistory(prev => [...prev, { ...event, day }]);

    // 一回限りのイベントの場合、発生済みリストに追加
    if (event.oneTimeOnly) {
      setTriggeredOneTimeEvents(prev => [...prev, event.id]);
    }

    // 特別イベントの実績追跡
    if (event.id === 'celebrity_endorsement') {
      updateAchievementProgress('celebrity_endorsement', 1);
      setGameStats(prev => ({ ...prev, celebrityEndorsements: prev.celebrityEndorsements + 1 }));
    }

    // 即座に効果を適用するタイプのイベント（お金の増減など）
    if (event.effects.money) {
      setMoney(prev => Math.max(0, prev + event.effects.money!));
      if (event.effects.money > 0) {
        updateAchievementProgress('max_money', money + event.effects.money!);
      }
    }

    // 持続効果があるイベントの場合、activeEventsに追加
    if (event.effects.duration && event.effects.duration > 0) {
      const activeEvent: ActiveEvent = {
        eventId: event.id,
        startDay: day,
        remainingDays: event.effects.duration,
        effects: event.effects
      };
      setActiveEvents(prev => [...prev, activeEvent]);
    }

    showToast(`${event.emoji} ${event.name}が発生しました！`);
  }, [day, showToast]);

  const processActiveEvents = useCallback(() => {
    setActiveEvents(prev => {
      return prev.map(event => ({
        ...event,
        remainingDays: event.remainingDays - 1
      })).filter(event => event.remainingDays > 0);
    });
  }, []);

  // アクティブイベントの効果を取得
  const getActiveEventEffects = useCallback(() => {
    return activeEvents.reduce((acc, event) => {
      if (event.effects.wineValue) {
        acc.wineValueMultiplier = (acc.wineValueMultiplier || 1.0) * event.effects.wineValue;
      }
      return acc;
    }, {} as { wineValueMultiplier?: number });
  }, [activeEvents]);

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

    // 畑にブドウがない場合の警告
    const plantedGrapes = plots.filter(p => p.isPlanted).length;
    if (plantedGrapes === 0) {
      const minGrapePrice = Math.min(...Object.values(REGIONAL_GRAPE_TYPES).flat().map(g => g.price));
      const remainingMoney = money - cost;
      if (remainingMoney < minGrapePrice) {
        const confirmed = window.confirm(
          `⚠️ 警告: 畑にブドウが植えられていません！\n` +
          `剪定後の残金（${remainingMoney}円）では、最も安いブドウ（${minGrapePrice}円）も買えません。\n\n` +
          `このまま剪定を実行しますか？`
        );
        if (!confirmed) return;
      }
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

    // 畑にブドウがない場合の警告
    const plantedGrapes = plots.filter(p => p.isPlanted).length;
    if (plantedGrapes === 0) {
      const minGrapePrice = Math.min(...Object.values(REGIONAL_GRAPE_TYPES).flat().map(g => g.price));
      const remainingMoney = money - cost;
      if (remainingMoney < minGrapePrice) {
        const confirmed = window.confirm(
          `⚠️ 警告: 畑にブドウが植えられていません！\n` +
          `土壌改良後の残金（${remainingMoney}円）では、最も安いブドウ（${minGrapePrice}円）も買えません。\n\n` +
          `このまま土壌改良を実行しますか？`
        );
        if (!confirmed) return;
      }
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

    // 畑にブドウがない場合の警告
    const plantedGrapes = plots.filter(p => p.isPlanted).length;
    if (plantedGrapes === 0) {
      const minGrapePrice = Math.min(...Object.values(REGIONAL_GRAPE_TYPES).flat().map(g => g.price));
      const remainingMoney = money - cost;
      if (remainingMoney < minGrapePrice) {
        const confirmed = window.confirm(
          `⚠️ 警告: 畑にブドウが植えられていません！\n` +
          `灌漑設備改良後の残金（${remainingMoney}円）では、最も安いブドウ（${minGrapePrice}円）も買えません。\n\n` +
          `このまま灌漑設備改良を実行しますか？`
        );
        if (!confirmed) return;
      }
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

    // 畑にブドウがない場合の警告
    const plantedGrapes = plots.filter(p => p.isPlanted).length;
    if (plantedGrapes === 0) {
      const minGrapePrice = Math.min(...Object.values(REGIONAL_GRAPE_TYPES).flat().map(g => g.price));
      const remainingMoney = money - cost;
      if (remainingMoney < minGrapePrice) {
        const confirmed = window.confirm(
          `⚠️ 警告: 畑にブドウが植えられていません！\n` +
          `天候保護設備設置後の残金（${remainingMoney}円）では、最も安いブドウ（${minGrapePrice}円）も買えません。\n\n` +
          `このまま天候保護設備を設置しますか？`
        );
        if (!confirmed) return;
      }
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

    const baseCost = getPlotExpansionCost(unlockedPlots);
    const nextPlotTerroir = getTerroir(PLOT_TERROIR_LAYOUT[unlockedPlots]);
    const actualCost = Math.floor(baseCost * nextPlotTerroir.costMultiplier);

    if (money < actualCost) {
      showToast(`畑の拡張には${actualCost}円必要です（${nextPlotTerroir.emoji} ${nextPlotTerroir.name}）`);
      return;
    }

    setMoney(prev => prev - actualCost);
    setUnlockedPlots(prev => prev + 1);

    showToast(`${nextPlotTerroir.emoji} 新しい${nextPlotTerroir.name}を解放しました！(${unlockedPlots + 1}/12)`);
    setTimeout(() => {
      showToast(`💡 ${nextPlotTerroir.description}`);
    }, 2000);
    playSuccessSound();
  }, [unlockedPlots, money, getPlotExpansionCost, getTerroir, showToast, playSuccessSound]);

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

  // 品評会システム関数
  const generateAICompetitors = useCallback((competition: Competition, numCompetitors: number = 8): CompetitionEntry[] => {
    const competitors: CompetitionEntry[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < numCompetitors; i++) {
      let playerName: string;
      do {
        playerName = AI_PLAYER_NAMES[Math.floor(Math.random() * AI_PLAYER_NAMES.length)];
      } while (usedNames.has(playerName));
      usedNames.add(playerName);

      // AIの品質は最低品質から+30の範囲でランダム生成
      const baseQuality = competition.minQuality + Math.random() * 30;
      const quality = Math.floor(Math.min(100, baseQuality + (Math.random() - 0.5) * 20));

      const regions = Object.keys(WINE_REGIONS);
      const randomRegion = regions[Math.floor(Math.random() * regions.length)];
      const grapeTypes = Object.values(REGIONAL_GRAPE_TYPES).flat();
      const randomGrape = grapeTypes[Math.floor(Math.random() * grapeTypes.length)];

      competitors.push({
        playerName,
        wineName: `${randomRegion} ${randomGrape.name}`,
        quality,
        isPlayer: false,
        region: randomRegion,
        grapeType: randomGrape.name
      });
    }

    return competitors;
  }, []);

  const activateSeasonalCompetition = useCallback(() => {
    const currentSeasonName = currentSeason.name;

    setCompetitions(prev => prev.map(competition => {
      if (competition.season === currentSeasonName && !competition.isActive) {
        const aiCompetitors = generateAICompetitors(competition);
        return {
          ...competition,
          isActive: true,
          entries: aiCompetitors
        };
      }
      return competition;
    }));

    // 品評会開始の通知
    const activeCompetition = WINE_COMPETITIONS.find(c => c.season === currentSeasonName);
    if (activeCompetition) {
      showToast(`🏆 ${activeCompetition.name}が開始されました！`);
    }
  }, [currentSeason.name, generateAICompetitors, showToast]);

  const enterCompetition = useCallback((competitionId: string, wineId: string) => {
    const wine = wines.find(w => w.id === wineId);
    const competition = competitions.find(c => c.id === competitionId);

    if (!wine || !competition) return;

    if (wine.quality < competition.minQuality) {
      showToast(`品質${competition.minQuality}以上のワインが必要です（現在: ${wine.quality}）`);
      return;
    }

    if (money < competition.entryFee) {
      showToast(`参加費${competition.entryFee}円が必要です`);
      return;
    }

    // 参加費を支払い
    setMoney(prev => prev - competition.entryFee);

    // プレイヤーのエントリーを追加
    const playerEntry: CompetitionEntry = {
      playerName: 'あなた',
      wineName: wine.name,
      quality: wine.quality,
      isPlayer: true,
      region: wine.region,
      grapeType: wine.grapeType
    };

    // 品評会結果を計算
    const allEntries = [...competition.entries, playerEntry].sort((a, b) => b.quality - a.quality);
    const playerRank = allEntries.findIndex(entry => entry.isPlayer) + 1;

    // 結果メッセージを生成
    let resultMessage = `🏆 ${competition.name}の結果発表！\n\n`;
    allEntries.slice(0, 3).forEach((entry, index) => {
      const medal = ['🥇', '🥈', '🥉'][index];
      const isPlayer = entry.isPlayer ? '★' : '';
      resultMessage += `${medal} ${index + 1}位: ${entry.playerName}${isPlayer} - ${entry.wineName} (品質: ${entry.quality})\n`;
    });

    if (playerRank <= 3) {
      const prize = competition.prizes[playerRank - 1];
      setMoney(prev => prev + prize);
      resultMessage += `\n🎉 おめでとうございます！${playerRank}位入賞で${prize}円の賞金を獲得しました！`;
      playSuccessSound();
    } else {
      resultMessage += `\n📊 あなたの順位: ${playerRank}位/${allEntries.length}参加者中`;
      resultMessage += `\n残念ながら入賞には届きませんでした。次回頑張りましょう！`;
    }

    setCompetitionResults(resultMessage);

    // 品評会を非アクティブに
    setCompetitions(prev => prev.map(c =>
      c.id === competitionId ? { ...c, isActive: false, entries: [] } : c
    ));

    // ワインを消費
    setWines(prev => prev.filter(w => w.id !== wineId));

  }, [wines, competitions, money, showToast, playSuccessSound]);

  // 地域移住システム
  const getMigrationCost = useCallback((targetRegionId: string) => {
    const basePrice = 5000; // 基本移住費用
    const plantedPlots = plots.filter(p => p.isPlanted).length;
    const wineLoss = wines.length * 1000; // ワインの価値損失
    const plotResetCost = plantedPlots * 500; // 植えたブドウのリセット費用

    return basePrice + wineLoss + plotResetCost;
  }, [plots, wines.length]);

  const migrateToRegion = useCallback((newRegionId: string) => {
    const newRegion = WINE_REGIONS.find(r => r.id === newRegionId);
    if (!newRegion || newRegion.id === selectedRegion.id) return;

    const migrationCost = getMigrationCost(newRegionId);

    if (money < migrationCost) {
      showToast(`移住には${migrationCost}円必要です`);
      return;
    }

    // 移住の確認ダイアログ
    const plantedPlots = plots.filter(p => p.isPlanted).length;
    const confirmMessage = plantedPlots > 0 || wines.length > 0
      ? `${newRegion.name}への移住を実行しますか？\n\n⚠️ 以下が失われます：\n・植えられたブドウ: ${plantedPlots}本\n・保管中のワイン: ${wines.length}本\n・移住費用: ${migrationCost}円\n\n※気候マスタリー経験は保持されます`
      : `${newRegion.name}への移住を実行しますか？\n費用: ${migrationCost}円`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    // 移住を実行
    setMoney(prev => prev - migrationCost);
    setSelectedRegion(newRegion);

    // 畑をリセット（テロワールは保持）
    setPlots(prevPlots => prevPlots.map(plot => ({
      ...plot,
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
    })));

    // ワインをクリア
    setWines([]);

    // 新しい地域の天気に更新
    const newWeather = getRegionalWeather(newRegionId, currentSeasonIndex);
    setCurrentWeather(newWeather);

    // 成功メッセージ
    showToast(`🌍 ${newRegion.name}へ移住しました！新たなワイン作りの始まりです`);
    setTimeout(() => {
      showToast(`🌡️ ${newRegion.koppenCode}気候 - ${newRegion.description}`);
    }, 3000);

    playSuccessSound();
    setShowRegionMigration(false);
  }, [selectedRegion.id, getMigrationCost, money, plots, wines.length, showToast, getRegionalWeather, currentSeasonIndex, playSuccessSound]);

  // スタッフ管理システム
  const getStaffInfo = useCallback((staffId: string): Staff => {
    return AVAILABLE_STAFF.find(s => s.id === staffId) || AVAILABLE_STAFF[0];
  }, []);

  const hireStaff = useCallback((staffId: string) => {
    const staffInfo = getStaffInfo(staffId);
    const isAlreadyHired = hiredStaff.some(s => s.staffId === staffId);

    if (isAlreadyHired) {
      showToast(`${staffInfo.name}は既に雇用済みです`);
      return;
    }

    if (money < staffInfo.hiringCost) {
      showToast(`雇用には${staffInfo.hiringCost}円必要です`);
      return;
    }

    setMoney(prev => prev - staffInfo.hiringCost);
    setHiredStaff(prev => [...prev, {
      staffId: staffId,
      hiredDay: day,
      experience: 0,
      level: 1,
      lastSalaryPaid: day
    }]);

    showToast(`${staffInfo.emoji} ${staffInfo.name}を雇用しました！`);
    playSuccessSound();
  }, [hiredStaff, money, day, getStaffInfo, showToast, playSuccessSound]);

  const fireStaff = useCallback((staffId: string) => {
    const staffInfo = getStaffInfo(staffId);

    const confirmed = window.confirm(`${staffInfo.name}を解雇しますか？\n※未払いの給与は発生しません`);
    if (!confirmed) return;

    setHiredStaff(prev => prev.filter(s => s.staffId !== staffId));
    showToast(`${staffInfo.emoji} ${staffInfo.name}を解雇しました`);
  }, [getStaffInfo, showToast]);

  const payStaffSalaries = useCallback(() => {
    if (hiredStaff.length === 0) return;

    let totalSalary = 0;
    let staffToPay: string[] = [];

    hiredStaff.forEach(staff => {
      const staffInfo = getStaffInfo(staff.staffId);
      // 30日ごとに給与支払い
      if (day - staff.lastSalaryPaid >= 30) {
        totalSalary += staffInfo.monthlySalary;
        staffToPay.push(staffInfo.name);
      }
    });

    if (totalSalary === 0) return;

    if (money < totalSalary) {
      showToast(`⚠️ 給与不足！${totalSalary}円必要ですが${money}円しかありません。スタッフのモチベーションが下がります...`);
      return;
    }

    setMoney(prev => prev - totalSalary);
    setHiredStaff(prev => prev.map(staff => ({
      ...staff,
      lastSalaryPaid: day,
      experience: Math.min(100, staff.experience + 5) // 給与支払い時に経験値アップ
    })));

    showToast(`💰 スタッフ給与支払い: ${totalSalary}円 (${staffToPay.length}名)`);
  }, [hiredStaff, day, money, getStaffInfo, showToast]);

  // スタッフの自動作業実行
  const executeStaffActions = useCallback(() => {
    if (hiredStaff.length === 0) return;

    hiredStaff.forEach(hiredStaffMember => {
      const staffInfo = getStaffInfo(hiredStaffMember.staffId);
      const efficiency = staffInfo.efficiency * (1 + hiredStaffMember.level * 0.1); // レベル分効率アップ

      staffInfo.autoActions.forEach(action => {
        switch (action) {
          case 'watering':
            // 水不足の畑に自動で水やり
            plots.filter(p => p.isPlanted && p.waterLevel < 30 && p.id <= unlockedPlots).forEach(plot => {
              if (water >= 10) {
                setWater(prev => Math.max(0, prev - 10));
                setPlots(prev => prev.map(p =>
                  p.id === plot.id
                    ? { ...p, waterLevel: Math.min(100, p.waterLevel + (20 * efficiency)) }
                    : p
                ));
              }
            });
            break;

          case 'fertilizing':
            // 肥料不足の畑に自動で施肥
            plots.filter(p => p.isPlanted && p.fertilizer < 20 && p.id <= unlockedPlots).forEach(plot => {
              if (fertilizer >= 5) {
                setFertilizer(prev => Math.max(0, prev - 5));
                setPlots(prev => prev.map(p =>
                  p.id === plot.id
                    ? { ...p, fertilizer: Math.min(100, p.fertilizer + (15 * efficiency)) }
                    : p
                ));
              }
            });
            break;

          case 'disease_treatment':
            // 病気の畑を自動で治療
            plots.filter(p => p.disease && p.id <= unlockedPlots).forEach(plot => {
              const disease = DISEASES.find(d => d.id === plot.disease);
              if (disease && money >= disease.treatmentCost) {
                setMoney(prev => prev - disease.treatmentCost);
                setPlots(prev => prev.map(p =>
                  p.id === plot.id
                    ? { ...p, disease: null, diseaseDay: 0, health: Math.min(100, p.health + (30 * efficiency)) }
                    : p
                ));
              }
            });
            break;

          case 'planting':
            // 空いた畑に自動で植付
            const emptyPlots = plots.filter(p => !p.isPlanted && p.id <= unlockedPlots);
            if (emptyPlots.length > 0 && money >= selectedGrapeType.price) {
              const plotToPlant = emptyPlots[0];
              setMoney(prev => prev - selectedGrapeType.price);
              setPlots(prev => prev.map(p =>
                p.id === plotToPlant.id
                  ? {
                      ...p,
                      isPlanted: true,
                      grapeType: selectedGrapeType.id,
                      plantedDay: day,
                      plantedSeason: currentSeasonIndex,
                      growth: 0
                    }
                  : p
              ));
            }
            break;

          case 'harvesting':
            // 収穫可能なブドウを自動で収穫してワイン製造
            plots.filter(p => p.isPlanted && p.growth >= 100 && p.canHarvest && p.id <= unlockedPlots).forEach(plot => {
              if (currentSeason.harvestPossible) {
                // harvestPlot関数を直接呼ばず、収穫処理を実行
                const grapeType = REGIONAL_GRAPE_TYPES[selectedRegion.id as keyof RegionalGrapeTypes]?.find(g => g.id === plot.grapeType);
                if (grapeType) {
                  // 自動収穫・ワイン製造（簡略版）
                  const plotTerroir = getTerroir(plot.terroir);
                  let quality = Math.min(100,
                    (plot.health * 0.4 +
                    plot.growth * 0.3 +
                    (plot.fertilizer > 70 ? 20 : plot.fertilizer * 0.2) +
                    grapeType.qualityBonus * 10) * plotTerroir.qualityMultiplier * efficiency
                  );

                  const wine = {
                    id: `wine_${Date.now()}_${plot.id}`,
                    name: `${selectedRegion.name} ${grapeType.name}`,
                    grapeType: grapeType.name,
                    region: selectedRegion.name,
                    quality: Math.floor(quality),
                    age: 0,
                    value: Math.floor(grapeType.price * quality / 50),
                    productionDate: day,
                    isSpecial: false,
                    agingPotential: grapeType.agingPotential,
                    peakAge: grapeType.peakAge * 365, // 年数を日数に変換
                    storedInCellar: false
                  };

                  setWines(prev => [...prev, wine]);
                  updateGoalProgress('wine_production', 1);
                  updateGoalProgress('quality_wines', wine.quality);
                  updateGoalProgress('master_quality', wine.quality);
                  updateGoalProgress('harvest', 1);

                  // プロットをリセット
                  setPlots(prev => prev.map(p =>
                    p.id === plot.id
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
                }
              }
            });
            break;
        }
      });

      // スタッフの経験値アップ（作業実行時）
      setHiredStaff(prev => prev.map(s =>
        s.staffId === hiredStaffMember.staffId
          ? { ...s, experience: Math.min(100, s.experience + 1) }
          : s
      ));
    });
  }, [hiredStaff, getStaffInfo, plots, unlockedPlots, water, fertilizer, money, selectedGrapeType, day, currentSeasonIndex, currentSeason.harvestPossible]);

  // 最近完了したゴールのトラッキング（重複通知を防ぐ）
  const [recentlyCompletedGoals, setRecentlyCompletedGoals] = useState<Set<string>>(new Set());

  // ゴール進捗を更新する関数
  const updateGoalProgress = useCallback((type: string, value: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.type === type && !goal.completed) {
        let newCurrent = goal.current;

        switch (type) {
          case 'money':
            newCurrent = money;
            break;
          case 'plots':
            newCurrent = unlockedPlots;
            break;
          case 'days_survived':
            newCurrent = day;
            break;
          case 'quality_wines':
          case 'master_quality':
            newCurrent = value >= (type === 'master_quality' ? 90 : 85) ? goal.current + 1 : goal.current;
            break;
          case 'climate_mastery':
            // マスターレベル（5）に達した気候区分数をカウント
            newCurrent = Object.values(regionExperience).filter(exp => getClimateMasteryLevel(exp) >= 5).length;
            break;
          case 'winter_upgrades':
            // 全ての冬季設備のレベル合計
            newCurrent = vineyardUpgrades.irrigationSystem + vineyardUpgrades.soilQuality +
                        vineyardUpgrades.weatherProtection + vineyardUpgrades.pruningTechnique;
            break;
          case 'special_wines':
            // 特別ワインの総数
            newCurrent = wines.filter(w => w.isSpecial).length;
            break;
          default:
            newCurrent = goal.current + value;
            break;
        }

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
  }, [money, unlockedPlots, day, regionExperience, getClimateMasteryLevel, vineyardUpgrades, wines, recentlyCompletedGoals, playSuccessSound, showToast]);

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

        // 秋の特別通知（収穫期の強調）
        if (newSeasonIndex === 2) { // 秋になった時
          const harvestableGrapes = plots.filter(p => p.growth >= 100).length;
          showToast(`🍂 秋になりました！収穫の季節です！`);

          if (harvestableGrapes > 0) {
            setTimeout(() => {
              showToast(`🍇 ${harvestableGrapes}個のブドウが収穫可能です！`);
            }, 2000);
          } else {
            setTimeout(() => {
              showToast(`🌱 まだ収穫できるブドウがありません。もう少し待ちましょう`);
            }, 2000);
          }
        }

        // その他季節の特別通知
        if (newSeasonIndex === 0) { // 春
          showToast(`🌸 春になりました！植え付けの季節です！`);
        } else if (newSeasonIndex === 1) { // 夏
          showToast(`🌞 夏になりました！成長の季節です！`);
        } else if (newSeasonIndex === 3) { // 冬
          showToast(`❄️ 冬になりました！設備投資の季節です！`);
        }

        // 季節ごとの品評会を開始
        setTimeout(() => {
          activateSeasonalCompetition();
        }, 3000); // 季節通知の後に品評会通知を表示

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
            setTimeout(() => showToast(message), 3500); // 他の通知の後に表示
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

      // テロワールの影響
      const terroir = getTerroir(plot.terroir);
      growthIncrease *= terroir.sunlightBonus; // 日照効果

      // 水分レベルの変化
      let waterChange = currentWeather.waterLoss; // 天気による変化
      waterChange += grapeType.waterNeeds; // ブドウの種類による消費

      // 灌漑システムの効果
      if (vineyardUpgrades.irrigationSystem > 0) {
        waterChange *= (1 - vineyardUpgrades.irrigationSystem * 0.2); // 水の消費を減らす
      }

      // テロワールの排水効果
      waterChange *= terroir.drainageBonus; // 排水が良いと水の減少が緩やか

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

    // スタッフ自動作業実行
    executeStaffActions();

    // 給与支払いチェック
    payStaffSalaries();

    // ランダムイベント処理
    checkRandomEvents();
    processActiveEvents();

    // ゲームオーバーチェック
    checkGameOver();

    // ミッション進捗の自動更新
    updateGoalProgress('days_survived', day);
    updateGoalProgress('plots', unlockedPlots);
    updateGoalProgress('climate_mastery', Object.values(regionExperience).filter(exp => getClimateMasteryLevel(exp) >= 5).length);
    updateGoalProgress('winter_upgrades', vineyardUpgrades.irrigationSystem + vineyardUpgrades.soilQuality + vineyardUpgrades.weatherProtection + vineyardUpgrades.pruningTechnique);
    updateGoalProgress('special_wines', wines.filter(w => w.isSpecial).length);
    updateGoalProgress('money', money);

    // 実績進捗の日次更新
    updateAchievementProgress('days_survived', day);
    updateAchievementProgress('max_money', money);
    updateAchievementProgress('daily_wine_production', gameStats.dailyWineProduction);

    // 地域訪問実績
    setGameStats(prev => ({
      ...prev,
      regionsVisited: new Set([...Array.from(prev.regionsVisited), selectedRegion.id]),
      dailyWineProduction: 0 // 日次生産数をリセット
    }));

    updateAchievementProgress('regions_visited', gameStats.regionsVisited.size + 1);

    // 気候マスタリー実績チェック
    const masteryLevel3Count = Object.values(regionExperience).filter(exp => getClimateMasteryLevel(exp) >= 3).length;
    updateAchievementProgress('climate_mastery_level_3', masteryLevel3Count);
  }, [currentWeather, currentSeason, selectedRegion, getRegionalWeather, day, currentSeasonIndex, gameOver, gameWon, getClimateMasteryLevel, getClimateMasteryInfo, showToast, getClimateWeatherExplanation, regionExperience, updateGoalProgress, unlockedPlots, vineyardUpgrades, wines, money, activateSeasonalCompetition, getTerroir, executeStaffActions, payStaffSalaries, checkRandomEvents, processActiveEvents, updateAchievementProgress, gameStats]);

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
      const plotTerroir = getTerroir(plot.terroir);
      let quality = Math.min(100,
        (plot.health * 0.4 +
        plot.growth * 0.3 +
        (plot.fertilizer > 70 ? 20 : plot.fertilizer * 0.2) +
        grapeType.qualityBonus * 10) * plotTerroir.qualityMultiplier
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
        masteryBonus,
        agingPotential: grapeType.agingPotential,
        peakAge: grapeType.peakAge * 365, // 年数を日数に変換
        storedInCellar: false
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
      updateGoalProgress('quality_wines', wine.quality); // 品質85以上のワイン用
      updateGoalProgress('master_quality', wine.quality); // 品質90以上のワイン用

      // 実績進捗更新
      updateAchievementProgress('wines_produced', 1);
      updateAchievementProgress('max_wine_quality', wine.quality);
      updateAchievementProgress('consecutive_quality_wines', wine.quality);

      // ゲーム統計更新
      setGameStats(prev => ({
        ...prev,
        totalWinesProduced: prev.totalWinesProduced + 1,
        maxWineQuality: Math.max(prev.maxWineQuality, wine.quality),
        dailyWineProduction: prev.dailyWineProduction + 1,
        consecutiveQualityWines: wine.quality >= 80 ? prev.consecutiveQualityWines + 1 : 0
      }));
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
  }, [plots, currentSeason, selectedRegion, day, updateGoalProgress, gameOver, gameWon, playHarvestSound, showToast, canCreateSpecialWine, getSpecialWineInfo, updateAchievementProgress, money]);

  // ワインを売る関数
  const sellWine = useCallback((wineId: string) => {
    if (gameOver || gameWon) return;

    const wine = wines.find(w => w.id === wineId);
    if (!wine) return;

    const ageBonus = Math.floor(wine.age / 10) * 0.1; // 10日ごとに10%ボーナス
    const eventEffects = getActiveEventEffects();
    const eventMultiplier = eventEffects.wineValueMultiplier || 1.0;

    const finalValue = Math.floor(wine.value * (1 + ageBonus) * eventMultiplier);

    setMoney(prev => prev + finalValue);
    setWines(prev => prev.filter(w => w.id !== wineId));

    // 実績進捗更新
    updateAchievementProgress('max_money', money + finalValue);

    // ゲーム統計更新
    setGameStats(prev => ({
      ...prev,
      maxMoney: Math.max(prev.maxMoney, money + finalValue)
    }));

    if (eventMultiplier > 1.0) {
      showToast(`🍷✨ 「${wine.name}」を${finalValue}円で売却！（市場効果+${Math.round((eventMultiplier - 1) * 100)}%）`);
    } else if (eventMultiplier < 1.0) {
      showToast(`🍷💧 「${wine.name}」を${finalValue}円で売却（市場効果${Math.round((eventMultiplier - 1) * 100)}%）`);
    } else {
      showToast(`🍷 「${wine.name}」を${finalValue}円で売却しました！`);
    }
  }, [wines, gameOver, gameWon, showToast, getActiveEventEffects]);

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

  // ワインセラー管理関数
  const purchaseCellar = useCallback((cellarId: string) => {
    const cellar = WINE_CELLARS.find(c => c.id === cellarId);
    if (!cellar || money < cellar.purchaseCost) return;

    setMoney(prev => prev - cellar.purchaseCost);
    setOwnedCellars(prev => [...prev, cellarId]);

    // セラーのスロットを初期化
    const slots: CellarSlot[] = Array.from({ length: cellar.capacity }, (_, index) => ({
      id: `${cellarId}_slot_${index}`,
      wineId: null,
      storedDay: 0,
      temperature: cellar.temperature,
      humidity: cellar.humidity
    }));

    setCellarSlots(prev => ({ ...prev, [cellarId]: slots }));
    showToast(`🏛️ ${cellar.name}を購入しました！容量: ${cellar.capacity}本`);
  }, [money, showToast]);

  const storeWineInCellar = useCallback((wineId: string, cellarId: string, slotId: string) => {
    const wine = wines.find(w => w.id === wineId);
    const cellar = WINE_CELLARS.find(c => c.id === cellarId);
    const slots = cellarSlots[cellarId];
    const slot = slots?.find(s => s.id === slotId);

    if (!wine || !cellar || !slot || slot.wineId || wine.storedInCellar) return;

    // ワインをセラーに保管
    setWines(prev => prev.map(w =>
      w.id === wineId
        ? { ...w, storedInCellar: true, cellarSlotId: slotId }
        : w
    ));

    // スロットを占有
    setCellarSlots(prev => ({
      ...prev,
      [cellarId]: prev[cellarId].map(s =>
        s.id === slotId
          ? { ...s, wineId, storedDay: day }
          : s
      )
    }));

    showToast(`🍷 「${wine.name}」を${cellar.name}に保管しました`);
  }, [wines, cellarSlots, day, showToast]);

  const removeWineFromCellar = useCallback((wineId: string) => {
    const wine = wines.find(w => w.id === wineId && w.storedInCellar);
    if (!wine || !wine.cellarSlotId) return;

    // ワインをセラーから取り出し
    setWines(prev => prev.map(w =>
      w.id === wineId
        ? { ...w, storedInCellar: false, cellarSlotId: undefined }
        : w
    ));

    // スロットを解放
    setCellarSlots(prev => {
      const newSlots = { ...prev };
      Object.keys(newSlots).forEach(cellarId => {
        newSlots[cellarId] = newSlots[cellarId].map(slot =>
          slot.id === wine.cellarSlotId
            ? { ...slot, wineId: null, storedDay: 0 }
            : slot
        );
      });
      return newSlots;
    });

    showToast(`🍷 「${wine.name}」をセラーから取り出しました`);
  }, [wines, showToast]);

  // マネーゴールをチェック
  React.useEffect(() => {
    updateGoalProgress('money', money);
  }, [money, updateGoalProgress]);

  // ゲーム勝利をチェック
  React.useEffect(() => {
    checkGameWin();
  }, [checkGameWin]);

  // ワイン熟成システム
  const calculateAgedQuality = useCallback((wine: Wine, ageInDays: number): number => {
    const ageInYears = ageInDays / 365;
    const peakYears = wine.peakAge / 365;

    // 基本品質からスタート
    let agedQuality = wine.quality;

    // セラー保管中の場合、効率的に熟成
    let agingEfficiency = 1.0;
    if (wine.storedInCellar && wine.cellarSlotId) {
      const cellarType = ownedCellars.find(id => {
        const cellar = WINE_CELLARS.find(c => c.id === id);
        return cellar && cellarSlots[id]?.some(slot => slot.wineId === wine.id);
      });
      if (cellarType) {
        const cellar = WINE_CELLARS.find(c => c.id === cellarType);
        agingEfficiency = cellar ? cellar.agingEfficiency : 1.0;
      }
    }

    if (ageInYears <= peakYears) {
      // ピーク年齢までは品質が向上
      const improvementRate = (wine.agingPotential / 100) * agingEfficiency;
      const progressTowardPeak = Math.min(1.0, ageInYears / peakYears);
      // 品質向上は曲線的（最初急激、後半緩やか）
      const qualityBonus = improvementRate * 30 * Math.sqrt(progressTowardPeak);
      agedQuality += qualityBonus;
    } else {
      // ピーク年齢を過ぎると緩やかに劣化
      const declineYears = ageInYears - peakYears;
      const declineRate = Math.min(0.5, declineYears / (peakYears * 2)); // 最大50%劣化
      const peakQuality = wine.quality + (wine.agingPotential / 100) * 30 * agingEfficiency;
      agedQuality = peakQuality * (1 - declineRate);
    }

    return Math.min(100, Math.max(wine.quality * 0.8, agedQuality)); // 最低でも元品質の80%は維持
  }, [ownedCellars, cellarSlots]);

  // ワインの熟成（毎日）
  React.useEffect(() => {
    setWines(prev => prev.map(wine => {
      const newAge = day - wine.productionDate;
      const newQuality = calculateAgedQuality(wine, newAge);

      return {
        ...wine,
        age: newAge,
        quality: Math.floor(newQuality),
        value: Math.floor((wine.value * newQuality) / wine.quality) // 品質に比例して価値も変化
      };
    }));
  }, [day, calculateAgedQuality]);

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
        <div className={`resource-item ${currentSeason.name === 'autumn' ? 'harvest-highlight' : ''}`}>
          <span>
            <span className="emoji">{currentSeason.emoji}</span>
            {currentSeason.name === 'autumn' ? (
              <span className="harvest-season-text">秋 - 収穫期！</span>
            ) : (
              currentSeason.name_jp
            )}
          </span>
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

          {/* 移住ボタン */}
          <div className="migration-section">
            <button
              onClick={() => setShowRegionMigration(true)}
              className="migration-btn"
              disabled={day < 30} // 最初の30日は移住不可
              title={day < 30 ? "30日経過後に移住可能になります" : "他の地域に移住して新しい気候を体験"}
            >
              🌍 地域移住
            </button>
            {day < 30 && <small className="migration-note">30日経過後に解禁</small>}
          </div>

          {/* スタッフ管理ボタン */}
          <div className="staff-section">
            <button
              onClick={() => setShowStaffPanel(true)}
              className="staff-btn"
              title="スタッフを雇用して作業を自動化"
            >
              👥 スタッフ管理 {hiredStaff.length > 0 && `(${hiredStaff.length}名)`}
            </button>
            <button
              onClick={() => setShowEventHistory(true)}
              className="event-history-btn"
              title="発生したイベントの履歴を確認"
            >
              📰 イベント履歴 {eventHistory.length > 0 && `(${eventHistory.length})`}
            </button>
            <button
              onClick={() => setShowAchievements(true)}
              className="achievements-btn"
              title="実績とタイトルを確認"
            >
              🏆 実績 {achievementProgress.filter(a => a.completed).length}/{ACHIEVEMENTS.length}
            </button>
          </div>
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
            {currentTitle && (
              <span className="current-title">
                🏷️ {getTitleByName(currentTitle)?.emoji} {getTitleByName(currentTitle)?.name}
              </span>
            )}
            <span className={currentSeason.name === 'autumn' ? 'harvest-highlight-text' : ''}>
              {currentSeason.emoji}
              {currentSeason.name === 'autumn' ? '秋 - 収穫期！' : currentSeason.name_jp}
            </span>
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
                  {goals.filter(goal => !goal.completed).map(goal => (
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

                  {/* ワインセラー管理ボタン */}
                  <div className="cellar-controls">
                    <button
                      onClick={() => setShowCellarPanel(true)}
                      className="game-action-btn cellar-btn"
                    >
                      🏛️ セラー管理
                    </button>
                    <span className="cellar-status">
                      保有セラー: {ownedCellars.length}個 |
                      保管中: {wines.filter(w => w.storedInCellar).length}本
                    </span>
                  </div>

                  <div className="wines-grid">
                    {wines.map(wine => {
                      const ageInYears = Math.floor(wine.age / 365);
                      const ageMonths = Math.floor((wine.age % 365) / 30);
                      const peakYears = Math.floor(wine.peakAge / 365);
                      const isAtPeak = ageInYears >= peakYears && ageInYears < peakYears + 2;
                      const isPastPeak = ageInYears >= peakYears + 2;

                      return (
                        <div key={wine.id} className={`wine-item ${wine.isSpecial ? 'special-wine' : ''} ${wine.storedInCellar ? 'stored-wine' : ''}`}>
                          <div className="wine-header">
                            <h4>
                              {wine.isSpecial && <span className="special-wine-icon">👑</span>}
                              {wine.storedInCellar && <span className="cellar-stored-icon">🏛️</span>}
                              {wine.name}
                              {wine.isSpecial && <span className="special-wine-badge">マスター級</span>}
                            </h4>
                            <span className="wine-age">
                              {ageInYears > 0 && `${ageInYears}年`}
                              {ageMonths > 0 && `${ageMonths}ヶ月`}
                              {ageInYears === 0 && ageMonths === 0 && `${wine.age}日`}熟成
                            </span>
                          </div>
                          <div className="wine-details">
                            <span className="wine-quality">
                              品質: ★{wine.quality}
                              {wine.masteryBonus && <small> (+{wine.masteryBonus})</small>}
                              {isAtPeak && <span className="peak-indicator">🌟 ピーク品質</span>}
                              {isPastPeak && <span className="past-peak-indicator">⏰ 過熟</span>}
                            </span>
                            <span className="wine-value">価値: {wine.value}円</span>
                            <div className="wine-aging-info">
                              <small>
                                熟成ポテンシャル: {wine.agingPotential}% |
                                ピーク: {peakYears}年目
                                {wine.storedInCellar && ' | セラー保管中'}
                              </small>
                            </div>
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
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 品評会 */}
              {competitions.some(c => c.isActive) && (
                <div className="competitions-section">
                  <h3>🏆 開催中の品評会</h3>
                  <div className="competitions-grid">
                    {competitions.filter(c => c.isActive).map(competition => (
                      <div key={competition.id} className="competition-item">
                        <div className="competition-header">
                          <h4>{competition.name}</h4>
                          <span className="competition-fee">参加費: {competition.entryFee}円</span>
                        </div>
                        <p className="competition-description">{competition.description}</p>
                        <div className="competition-requirements">
                          <span>最低品質: {competition.minQuality}</span>
                          <span>賞金: 🥇{competition.prizes[0]}円 🥈{competition.prizes[1]}円 🥉{competition.prizes[2]}円</span>
                        </div>
                        <div className="competition-participants">
                          <small>参加者: {competition.entries.length + 1}名</small>
                        </div>
                        <div className="eligible-wines">
                          <h5>参加可能ワイン:</h5>
                          {wines.filter(w => w.quality >= competition.minQuality).length === 0 ? (
                            <p className="no-eligible-wines">品質{competition.minQuality}以上のワインがありません</p>
                          ) : (
                            wines.filter(w => w.quality >= competition.minQuality).map(wine => (
                              <div key={wine.id} className="eligible-wine">
                                <span className="wine-info">
                                  {wine.isSpecial && '👑'} {wine.name} (品質: {wine.quality})
                                </span>
                                <button
                                  onClick={() => enterCompetition(competition.id, wine.id)}
                                  className="enter-competition-btn"
                                  disabled={money < competition.entryFee}
                                >
                                  参加する
                                </button>
                              </div>
                            ))
                          )}
                        </div>
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
                          (() => {
                            const plotTerroir = getTerroir(plot.terroir);
                            const terroirInfo = `${plotTerroir.emoji} ${plotTerroir.name} - ${plotTerroir.description}`;

                            if (!isUnlocked) {
                              return isNextToUnlock
                                ? `${terroirInfo}\n畑を拡張 - クリックで解放 (¥${Math.floor(getPlotExpansionCost(unlockedPlots) * plotTerroir.costMultiplier)})`
                                : `${terroirInfo}\n未解放の畑`;
                            } else if (!plot.isPlanted) {
                              return `${terroirInfo}\n空き地 - クリックで${selectedGrapeType.name}を植える (¥${selectedGrapeType.price})`;
                            } else if (plot.growth >= 100) {
                              return `${terroirInfo}\n収穫可能！クリックで収穫`;
                            } else if (plot.disease) {
                              return `${terroirInfo}\n病気: ${DISEASES.find(d => d.id === plot.disease)?.name} - 治療費: ${DISEASES.find(d => d.id === plot.disease)?.treatmentCost}円`;
                            } else if (plot.lastDisaster && (day - plot.disasterDay) <= 3) {
                              return `${terroirInfo}\n災害被害: ${DISASTERS.find(d => d.id === plot.lastDisaster)?.name} (${3 - (day - plot.disasterDay)}日前) - ${DISASTERS.find(d => d.id === plot.lastDisaster)?.damage}`;
                            } else {
                              return `${terroirInfo}\n${REGIONAL_GRAPE_TYPES[selectedRegion.id as keyof RegionalGrapeTypes]?.find(g => g.id === plot.grapeType)?.name || 'ブドウ'} - 成長: ${Math.floor(plot.growth)}% / 水: ${Math.floor(plot.waterLevel)}% / 肥料: ${Math.floor(plot.fertilizer)}% / 健康: ${Math.floor(plot.health)}%`;
                            }
                          })()
                        }
                      >
                        {!isUnlocked
                          ? isNextToUnlock
                            ? '🔓'  // 次に解放可能
                            : '🔒'  // 未解放
                          : getPlotDisplay(plot)
                        }
                        {isUnlocked && (
                          <div className="terroir-badge" style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {getTerroir(plot.terroir).emoji}
                          </div>
                        )}
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
                  <p className={`season-info ${currentSeason.harvestPossible ? 'harvest-season' : ''}`}>
                    {currentSeason.name === 'autumn' && (
                      <span className="autumn-highlight">
                        🍂 秋 - 収穫の季節！
                        {plots.filter(p => p.growth >= 100 && p.canHarvest).length > 0 &&
                          <span className="harvestable-count">
                            ({plots.filter(p => p.growth >= 100 && p.canHarvest).length}個収穫可能)
                          </span>
                        }
                      </span>
                    )}
                    {currentSeason.name !== 'autumn' && (
                      <>
                        {currentSeason.plantingOptimal && '🌱 植え付け時期'}
                        {currentSeason.harvestPossible && '🍇 収穫時期'}
                        {!currentSeason.plantingOptimal && !currentSeason.harvestPossible && '🕰️ 管理時期'}
                      </>
                    )}
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


        {/* スタッフ管理パネル */}
        {showStaffPanel && (
          <div className="staff-overlay">
            <div className="staff-modal">
              <div className="staff-header">
                <h3>👥 スタッフ管理</h3>
                <button
                  onClick={() => setShowStaffPanel(false)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
              <div className="staff-content">
                {/* 雇用済みスタッフ */}
                {hiredStaff.length > 0 && (
                  <div className="hired-staff-section">
                    <h4>💼 雇用中のスタッフ ({hiredStaff.length}名)</h4>
                    <div className="hired-staff-list">
                      {hiredStaff.map(staff => {
                        const staffInfo = getStaffInfo(staff.staffId);
                        const daysSinceHired = day - staff.hiredDay;
                        const daysSinceLastPay = day - staff.lastSalaryPaid;
                        const needsSalary = daysSinceLastPay >= 30;

                        return (
                          <div key={staff.staffId} className={`hired-staff-item ${needsSalary ? 'needs-salary' : ''}`}>
                            <div className="staff-info">
                              <div className="staff-name">
                                {staffInfo.emoji} {staffInfo.name}
                              </div>
                              <div className="staff-details">
                                <small>
                                  雇用: {daysSinceHired}日前 | 経験値: {staff.experience}/100 | Lv.{staff.level}
                                </small>
                              </div>
                              <div className="staff-specialties">
                                専門: {staffInfo.specialties.join(', ')}
                              </div>
                              {needsSalary && (
                                <div className="salary-warning">
                                  ⚠️ 給与支払い必要: {staffInfo.monthlySalary}円
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => fireStaff(staff.staffId)}
                              className="fire-btn"
                            >
                              解雇
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 雇用可能スタッフ */}
                <div className="available-staff-section">
                  <h4>🔍 雇用可能スタッフ</h4>
                  <div className="available-staff-list">
                    {AVAILABLE_STAFF.map(staff => {
                      const isHired = hiredStaff.some(s => s.staffId === staff.id);

                      return (
                        <div key={staff.id} className={`available-staff-item ${isHired ? 'already-hired' : ''}`}>
                          <div className="staff-card">
                            <div className="staff-header">
                              <h5>{staff.emoji} {staff.name}</h5>
                              <div className="staff-cost">
                                雇用費: {staff.hiringCost}円 | 月給: {staff.monthlySalary}円
                              </div>
                            </div>
                            <p className="staff-description">{staff.description}</p>
                            <div className="staff-specialties">
                              <strong>専門分野:</strong> {staff.specialties.join(', ')}
                            </div>
                            <div className="staff-efficiency">
                              <strong>効率:</strong> {Math.round(staff.efficiency * 100)}%
                            </div>
                            <div className="auto-actions">
                              <strong>自動実行:</strong>
                              <ul>
                                {staff.autoActions.map(action => (
                                  <li key={action}>
                                    {(() => {
                                      switch(action) {
                                        case 'watering': return '💧 水やり（水分30%未満の畑）';
                                        case 'fertilizing': return '🌱 施肥（肥料20%未満の畑）';
                                        case 'harvesting': return '🍇 収穫（収穫可能なブドウ）';
                                        case 'planting': return '🌱 植付（空いている畑）';
                                        case 'disease_treatment': return '💊 病気治療（病気の畑）';
                                        case 'premium_winemaking': return '🍷 高品質ワイン製造';
                                        default: return action;
                                      }
                                    })()}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <button
                              onClick={() => hireStaff(staff.id)}
                              className="hire-btn"
                              disabled={isHired || money < staff.hiringCost}
                            >
                              {isHired ? '雇用済み' : money >= staff.hiringCost ? '雇用する' : '資金不足'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* スタッフ管理情報 */}
                <div className="staff-info-section">
                  <h4>ℹ️ スタッフ管理について</h4>
                  <ul>
                    <li>スタッフは30日ごとに給与支払いが必要です</li>
                    <li>給与未払いだと作業効率が低下します</li>
                    <li>スタッフは経験を積むとレベルアップし、効率が向上します</li>
                    <li>自動作業は毎日実行されます</li>
                    <li>スタッフの専門分野に応じて作業内容が異なります</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 地域移住モーダル */}
        {showRegionMigration && (
          <div className="migration-overlay">
            <div className="migration-modal">
              <div className="migration-header">
                <h3>🌍 地域移住</h3>
                <button
                  onClick={() => setShowRegionMigration(false)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
              <div className="migration-content">
                <div className="current-region-info">
                  <h4>現在の地域: {selectedRegion.emoji} {selectedRegion.name}</h4>
                  <p>{selectedRegion.koppenCode} - {selectedRegion.description}</p>
                  <div className="mastery-status">
                    {(() => {
                      const exp = regionExperience[selectedRegion.koppenCode || ''] || 0;
                      const masteryInfo = getClimateMasteryInfo(selectedRegion.koppenCode || '');
                      return (
                        <span>
                          {masteryInfo.levelIcon} {masteryInfo.levelName} ({exp}XP)
                          {masteryInfo.isMaster && ' ✅'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="available-regions">
                  <h4>移住可能な地域:</h4>
                  <div className="regions-grid">
                    {WINE_REGIONS.filter(region => region.id !== selectedRegion.id).map(region => {
                      const migrationCost = getMigrationCost(region.id);
                      const exp = regionExperience[region.koppenCode || ''] || 0;
                      const masteryInfo = getClimateMasteryInfo(region.koppenCode || '');

                      return (
                        <div key={region.id} className="region-option">
                          <div className="region-header">
                            <h5>{region.emoji} {region.name}</h5>
                            <div className="region-climate">{region.koppenCode}</div>
                          </div>
                          <p className="region-description">{region.description}</p>
                          <div className="region-mastery">
                            マスタリー: {masteryInfo.levelIcon} {masteryInfo.levelName} ({exp}XP)
                            {masteryInfo.isMaster && ' ✅'}
                          </div>
                          <div className="migration-cost">
                            移住費用: {migrationCost}円
                          </div>
                          <button
                            onClick={() => migrateToRegion(region.id)}
                            className="migrate-btn"
                            disabled={money < migrationCost}
                          >
                            {money >= migrationCost ? '移住する' : '資金不足'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="migration-warning">
                  <h4>⚠️ 移住時の注意</h4>
                  <ul>
                    <li>植えられているブドウはすべて失われます</li>
                    <li>保管中のワインはすべて失われます</li>
                    <li>気候マスタリー経験値は保持されます</li>
                    <li>畑の拡張状況とテロワールは保持されます</li>
                    <li>設備投資（剪定技術等）は保持されます</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 品評会結果モーダル */}
        {competitionResults && (
          <div className="competition-results-overlay">
            <div className="competition-results-modal">
              <div className="results-content">
                <pre className="results-text">{competitionResults}</pre>
                <button
                  onClick={() => setCompetitionResults(null)}
                  className="close-results-btn"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ランダムイベントモーダル */}
        {showEventModal && currentEvent && (
          <div className="event-overlay">
            <div className="event-modal">
              <div className="event-header">
                <h3>{currentEvent.emoji} {currentEvent.name}</h3>
                <div className="event-type-badge">{currentEvent.type}</div>
              </div>
              <div className="event-content">
                <p className="event-description">{currentEvent.description}</p>

                {/* 効果の表示 */}
                <div className="event-effects">
                  {currentEvent.effects.money && (
                    <div className={`effect-item ${currentEvent.effects.money > 0 ? 'positive' : 'negative'}`}>
                      💰 {currentEvent.effects.money > 0 ? '+' : ''}{currentEvent.effects.money}円
                    </div>
                  )}
                  {currentEvent.effects.wineValue && currentEvent.effects.wineValue !== 1.0 && (
                    <div className={`effect-item ${currentEvent.effects.wineValue > 1.0 ? 'positive' : 'negative'}`}>
                      🍷 ワイン価値 {Math.round((currentEvent.effects.wineValue - 1) * 100)}%
                      {currentEvent.effects.duration && ` (${currentEvent.effects.duration}日間)`}
                    </div>
                  )}
                  {currentEvent.effects.plotDamage && (
                    <div className="effect-item negative">
                      🌱 畑への影響 -{currentEvent.effects.plotDamage}%
                    </div>
                  )}
                  {currentEvent.effects.duration && !currentEvent.effects.wineValue && (
                    <div className="effect-item">
                      ⏰ {currentEvent.effects.duration}日間継続
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowEventModal(false)}
                className="event-close-btn"
              >
                了解
              </button>
            </div>
          </div>
        )}

        {/* イベント履歴モーダル */}
        {showEventHistory && (
          <div className="event-history-overlay">
            <div className="event-history-modal">
              <div className="event-history-header">
                <h3>📰 イベント履歴</h3>
                <button
                  onClick={() => setShowEventHistory(false)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
              <div className="event-history-content">
                {eventHistory.length === 0 ? (
                  <div className="no-events">
                    <p>まだイベントが発生していません</p>
                    <small>ゲームを進めると様々なイベントが発生します！</small>
                  </div>
                ) : (
                  <div className="event-history-list">
                    {eventHistory
                      .slice()
                      .reverse()
                      .map((event, index) => (
                        <div key={index} className="history-event-item">
                          <div className="event-day">Day {event.day}</div>
                          <div className="event-info">
                            <div className="event-name">
                              {event.emoji} {event.name}
                            </div>
                            <div className="event-type-small">{event.type}</div>
                            <div className="event-desc">{event.description}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 実績システムモーダル */}
        {showAchievements && (
          <div className="achievements-overlay">
            <div className="achievements-modal">
              <div className="achievements-header">
                <div className="achievements-title">
                  <h3>🏆 実績システム</h3>
                  <div className="achievement-stats">
                    {achievementProgress.filter(a => a.completed).length}/{ACHIEVEMENTS.length} 実績達成
                  </div>
                </div>
                <button
                  onClick={() => setShowAchievements(false)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>

              <div className="achievements-content">
                {/* タイトル選択セクション */}
                {unlockedTitles.length > 0 && (
                  <div className="title-selection-section">
                    <h4>🏷️ 獲得タイトル</h4>
                    <div className="titles-grid">
                      <button
                        onClick={() => setCurrentTitle(null)}
                        className={`title-option ${currentTitle === null ? 'active' : ''}`}
                      >
                        なし
                      </button>
                      {unlockedTitles.map(titleId => {
                        const title = getTitleByName(titleId);
                        if (!title) return null;

                        return (
                          <button
                            key={titleId}
                            onClick={() => setCurrentTitle(titleId)}
                            className={`title-option ${currentTitle === titleId ? 'active' : ''}`}
                            title={title.description}
                          >
                            {title.emoji} {title.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 実績カテゴリータブ */}
                <div className="achievement-categories">
                  {['production', 'quality', 'economic', 'exploration', 'special', 'mastery'].map(category => {
                    const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category);
                    const completedCount = achievementProgress.filter(p =>
                      p.completed && categoryAchievements.some(a => a.id === p.achievementId)
                    ).length;

                    const categoryEmojis = {
                      production: '🏭',
                      quality: '⭐',
                      economic: '💰',
                      exploration: '🌍',
                      special: '🎪',
                      mastery: '👑'
                    };

                    const categoryNames = {
                      production: '生産',
                      quality: '品質',
                      economic: '経済',
                      exploration: '探索',
                      special: '特殊',
                      mastery: 'マスタリー'
                    };

                    return (
                      <div key={category} className="achievement-category">
                        <h4>
                          {categoryEmojis[category as keyof typeof categoryEmojis]} {categoryNames[category as keyof typeof categoryNames]}
                          ({completedCount}/{categoryAchievements.length})
                        </h4>
                        <div className="achievements-grid">
                          {categoryAchievements.map(achievement => {
                            const progress = achievementProgress.find(p => p.achievementId === achievement.id);
                            const isCompleted = progress?.completed || false;
                            const isSecret = achievement.isSecret && !isCompleted;

                            const tierColors = {
                              bronze: '#CD7F32',
                              silver: '#C0C0C0',
                              gold: '#FFD700',
                              diamond: '#B9F2FF',
                              legendary: '#FF69B4'
                            };

                            return (
                              <div
                                key={achievement.id}
                                className={`achievement-item ${isCompleted ? 'completed' : 'incomplete'} tier-${achievement.tier}`}
                                style={{ borderColor: tierColors[achievement.tier] }}
                              >
                                <div className="achievement-icon">
                                  {isSecret ? '❓' : achievement.emoji}
                                </div>
                                <div className="achievement-info">
                                  <div className="achievement-name">
                                    {isSecret ? '????' : achievement.name}
                                    <span className="achievement-tier">
                                      {achievement.tier === 'bronze' && '🥉'}
                                      {achievement.tier === 'silver' && '🥈'}
                                      {achievement.tier === 'gold' && '🥇'}
                                      {achievement.tier === 'diamond' && '💎'}
                                      {achievement.tier === 'legendary' && '👑'}
                                    </span>
                                  </div>
                                  <div className="achievement-desc">
                                    {isSecret ? '隠し実績です' : achievement.description}
                                  </div>
                                  {progress && !isSecret && (
                                    <div className="achievement-progress">
                                      {achievement.requirements.map((req, index) => {
                                        const currentValue = progress.progress[req.type] || 0;
                                        const progressPercent = Math.min((currentValue / req.target) * 100, 100);

                                        return (
                                          <div key={index} className="progress-bar">
                                            <div className="progress-text">
                                              {currentValue} / {req.target}
                                            </div>
                                            <div className="progress-bar-bg">
                                              <div
                                                className="progress-bar-fill"
                                                style={{ width: `${progressPercent}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {isCompleted && progress?.unlockedDay && (
                                    <div className="unlock-day">
                                      Day {progress.unlockedDay} に達成
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* アクティブイベント表示 */}
        {activeEvents.length > 0 && (
          <div className="active-events-panel">
            <div className="active-events-header">
              <h4>📅 進行中のイベント</h4>
            </div>
            <div className="active-events-list">
              {activeEvents.map(activeEvent => {
                const eventData = RANDOM_EVENTS.find(e => e.id === activeEvent.eventId);
                if (!eventData) return null;

                return (
                  <div key={activeEvent.eventId} className="active-event-item">
                    <div className="event-name">
                      {eventData.emoji} {eventData.name}
                    </div>
                    <div className="event-remaining">
                      残り{activeEvent.remainingDays}日
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ワインセラー管理パネル */}
        {showCellarPanel && (
          <div className="cellar-panel-overlay">
            <div className="cellar-panel">
              <div className="cellar-panel-header">
                <h3>🏛️ ワインセラー管理</h3>
                <button
                  onClick={() => setShowCellarPanel(false)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>

              <div className="cellar-panel-content">
                {/* セラー購入セクション */}
                <div className="cellar-purchase-section">
                  <h4>セラーを購入</h4>
                  <div className="available-cellars">
                    {WINE_CELLARS.map(cellar => {
                      const isOwned = ownedCellars.includes(cellar.id);
                      const canAfford = money >= cellar.purchaseCost;

                      return (
                        <div key={cellar.id} className={`cellar-option ${isOwned ? 'owned' : ''}`}>
                          <div className="cellar-info">
                            <h5>{cellar.emoji} {cellar.name}</h5>
                            <p>{cellar.description}</p>
                            <div className="cellar-specs">
                              <span>容量: {cellar.capacity}本</span>
                              <span>熟成効率: {Math.round(cellar.agingEfficiency * 100)}%</span>
                              <span>維持費: {cellar.maintenanceCost}円/月</span>
                            </div>
                          </div>
                          <div className="cellar-purchase">
                            <div className="price">{cellar.purchaseCost}円</div>
                            <button
                              onClick={() => purchaseCellar(cellar.id)}
                              className="purchase-btn"
                              disabled={isOwned || !canAfford}
                            >
                              {isOwned ? '所有済み' : canAfford ? '購入' : '資金不足'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 保有セラー管理セクション */}
                {ownedCellars.length > 0 && (
                  <div className="owned-cellars-section">
                    <h4>保有セラー</h4>
                    {ownedCellars.map(cellarId => {
                      const cellar = WINE_CELLARS.find(c => c.id === cellarId);
                      const slots = cellarSlots[cellarId] || [];
                      const occupiedSlots = slots.filter(s => s.wineId).length;

                      if (!cellar) return null;

                      return (
                        <div key={cellarId} className="owned-cellar">
                          <div className="cellar-header">
                            <h5>{cellar.emoji} {cellar.name}</h5>
                            <span className="capacity-info">
                              {occupiedSlots}/{cellar.capacity}本保管中
                            </span>
                          </div>

                          <div className="cellar-slots">
                            {slots.map(slot => {
                              const storedWine = slot.wineId ? wines.find(w => w.id === slot.wineId) : null;

                              return (
                                <div key={slot.id} className={`cellar-slot ${slot.wineId ? 'occupied' : 'empty'}`}>
                                  {storedWine ? (
                                    <div className="stored-wine">
                                      <div className="wine-name">{storedWine.name}</div>
                                      <div className="wine-details">
                                        品質: {storedWine.quality} | {Math.floor((day - slot.storedDay) / 365)}年熟成
                                      </div>
                                      <button
                                        onClick={() => removeWineFromCellar(storedWine.id)}
                                        className="remove-wine-btn"
                                      >
                                        取出
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="empty-slot">
                                      空きスロット
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* 未保管ワインの保管 */}
                          <div className="wine-storage-section">
                            <h6>ワインを保管:</h6>
                            <div className="available-wines">
                              {wines.filter(w => !w.storedInCellar).map(wine => {
                                const emptySlot = slots.find(s => !s.wineId);

                                return (
                                  <div key={wine.id} className="storable-wine">
                                    <span>{wine.name} (品質: {wine.quality})</span>
                                    <button
                                      onClick={() => emptySlot && storeWineInCellar(wine.id, cellarId, emptySlot.id)}
                                      className="store-wine-btn"
                                      disabled={!emptySlot}
                                    >
                                      {emptySlot ? '保管' : '満杯'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* セラー情報 */}
                <div className="cellar-info-section">
                  <h4>ℹ️ セラーについて</h4>
                  <ul>
                    <li>セラーに保管されたワインは効率的に熟成します</li>
                    <li>熟成効率はセラーの種類によって異なります</li>
                    <li>セラーには月額維持費がかかります</li>
                    <li>ワインはいつでも取り出せます</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

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