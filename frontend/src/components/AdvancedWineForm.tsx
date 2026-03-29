import React, { useReducer, useEffect, useState } from 'react';

// フォーム状態の型定義
interface WineFormState {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  errors: Record<string, string>;

  // 基本情報
  basicInfo: {
    name: string;
    winery: string;
    vintage: string;
    region: string;
    country: string;
    type: 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | '';
    price: string;
  };

  // テイスティングノート
  tastingNotes: {
    appearance: {
      color: string;
      clarity: 'brilliant' | 'clear' | 'hazy' | '';
      intensity: 'light' | 'medium' | 'deep' | '';
    };
    aroma: {
      intensity: 'light' | 'medium' | 'pronounced' | '';
      characteristics: string[];
      notes: string;
    };
    taste: {
      sweetness: 'bone-dry' | 'dry' | 'off-dry' | 'medium-sweet' | 'sweet' | '';
      acidity: 'low' | 'medium-' | 'medium' | 'medium+' | 'high' | '';
      tannin: 'low' | 'medium-' | 'medium' | 'medium+' | 'high' | '';
      body: 'light' | 'medium-' | 'medium' | 'medium+' | 'full' | '';
      alcohol: 'low' | 'medium' | 'high' | '';
      flavor: string;
      finish: 'short' | 'medium' | 'long' | '';
    };
  };

  // 評価
  rating: {
    overall: number;
    value: number;
    drinkNow: boolean;
    ageingPotential: 'drink-now' | '1-3-years' | '3-5-years' | '5-10-years' | '10+-years' | '';
    foodPairing: string[];
    personalNotes: string;
  };

  // バリデーション状態
  validationState: {
    basicInfo: boolean;
    tastingNotes: boolean;
    rating: boolean;
  };
}

// アクションタイプ
type WineFormAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERROR'; field: string; message: string }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'UPDATE_BASIC_INFO'; field: keyof WineFormState['basicInfo']; value: string }
  | { type: 'UPDATE_APPEARANCE'; field: keyof WineFormState['tastingNotes']['appearance']; value: string }
  | { type: 'UPDATE_AROMA'; field: keyof WineFormState['tastingNotes']['aroma']; value: string | string[] }
  | { type: 'UPDATE_TASTE'; field: keyof WineFormState['tastingNotes']['taste']; value: string }
  | { type: 'UPDATE_RATING'; field: keyof WineFormState['rating']; value: number | boolean | string | string[] }
  | { type: 'ADD_AROMA_CHARACTERISTIC'; characteristic: string }
  | { type: 'REMOVE_AROMA_CHARACTERISTIC'; characteristic: string }
  | { type: 'ADD_FOOD_PAIRING'; pairing: string }
  | { type: 'REMOVE_FOOD_PAIRING'; pairing: string }
  | { type: 'VALIDATE_STEP'; step: number }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_DRAFT'; draft: Partial<WineFormState> };

// 初期状態
const initialState: WineFormState = {
  currentStep: 1,
  totalSteps: 3,
  isSubmitting: false,
  errors: {},

  basicInfo: {
    name: '',
    winery: '',
    vintage: '',
    region: '',
    country: '',
    type: '',
    price: ''
  },

  tastingNotes: {
    appearance: {
      color: '',
      clarity: '',
      intensity: ''
    },
    aroma: {
      intensity: '',
      characteristics: [],
      notes: ''
    },
    taste: {
      sweetness: '',
      acidity: '',
      tannin: '',
      body: '',
      alcohol: '',
      flavor: '',
      finish: ''
    }
  },

  rating: {
    overall: 0,
    value: 0,
    drinkNow: false,
    ageingPotential: '',
    foodPairing: [],
    personalNotes: ''
  },

  validationState: {
    basicInfo: false,
    tastingNotes: false,
    rating: false
  }
};

// リデューサー関数
function wineFormReducer(state: WineFormState, action: WineFormAction): WineFormState {
  switch (action.type) {
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps)
      };

    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 1)
      };

    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: Math.max(1, Math.min(action.step, state.totalSteps))
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.field]: action.message
        }
      };

    case 'CLEAR_ERROR':
      const { [action.field]: removed, ...remainingErrors } = state.errors;
      return {
        ...state,
        errors: remainingErrors
      };

    case 'CLEAR_ALL_ERRORS':
      return {
        ...state,
        errors: {}
      };

    case 'UPDATE_BASIC_INFO':
      return {
        ...state,
        basicInfo: {
          ...state.basicInfo,
          [action.field]: action.value
        }
      };

    case 'UPDATE_APPEARANCE':
      return {
        ...state,
        tastingNotes: {
          ...state.tastingNotes,
          appearance: {
            ...state.tastingNotes.appearance,
            [action.field]: action.value
          }
        }
      };

    case 'UPDATE_AROMA':
      return {
        ...state,
        tastingNotes: {
          ...state.tastingNotes,
          aroma: {
            ...state.tastingNotes.aroma,
            [action.field]: action.value
          }
        }
      };

    case 'UPDATE_TASTE':
      return {
        ...state,
        tastingNotes: {
          ...state.tastingNotes,
          taste: {
            ...state.tastingNotes.taste,
            [action.field]: action.value
          }
        }
      };

    case 'UPDATE_RATING':
      return {
        ...state,
        rating: {
          ...state.rating,
          [action.field]: action.value
        }
      };

    case 'ADD_AROMA_CHARACTERISTIC':
      if (state.tastingNotes.aroma.characteristics.includes(action.characteristic)) {
        return state;
      }
      return {
        ...state,
        tastingNotes: {
          ...state.tastingNotes,
          aroma: {
            ...state.tastingNotes.aroma,
            characteristics: [...state.tastingNotes.aroma.characteristics, action.characteristic]
          }
        }
      };

    case 'REMOVE_AROMA_CHARACTERISTIC':
      return {
        ...state,
        tastingNotes: {
          ...state.tastingNotes,
          aroma: {
            ...state.tastingNotes.aroma,
            characteristics: state.tastingNotes.aroma.characteristics.filter(c => c !== action.characteristic)
          }
        }
      };

    case 'ADD_FOOD_PAIRING':
      if (state.rating.foodPairing.includes(action.pairing)) {
        return state;
      }
      return {
        ...state,
        rating: {
          ...state.rating,
          foodPairing: [...state.rating.foodPairing, action.pairing]
        }
      };

    case 'REMOVE_FOOD_PAIRING':
      return {
        ...state,
        rating: {
          ...state.rating,
          foodPairing: state.rating.foodPairing.filter(p => p !== action.pairing)
        }
      };

    case 'VALIDATE_STEP':
      const validationState = { ...state.validationState };

      switch (action.step) {
        case 1:
          validationState.basicInfo =
            state.basicInfo.name.length > 0 &&
            state.basicInfo.winery.length > 0 &&
            state.basicInfo.type !== '';
          break;
        case 2:
          validationState.tastingNotes =
            state.tastingNotes.appearance.color.length > 0 &&
            state.tastingNotes.aroma.intensity !== '' &&
            state.tastingNotes.taste.sweetness !== '';
          break;
        case 3:
          validationState.rating = state.rating.overall > 0;
          break;
      }

      return {
        ...state,
        validationState
      };

    case 'RESET_FORM':
      return initialState;

    case 'LOAD_DRAFT':
      return {
        ...state,
        ...action.draft
      };

    default:
      return state;
  }
}

// コンポーネント定義
interface AdvancedWineFormProps {
  onSubmit: (formData: WineFormState) => Promise<void>;
  onCancel: () => void;
}

const AdvancedWineForm: React.FC<AdvancedWineFormProps> = ({ onSubmit, onCancel }) => {
  const [state, dispatch] = useReducer(wineFormReducer, initialState);
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  // 自動保存（ドラフト）機能
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('wine-form-draft', JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to save draft:', error);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [state]);

  // 初回読み込み時にドラフトチェック
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wine-form-draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.basicInfo.name || draft.basicInfo.winery) {
          setShowDraftDialog(true);
        }
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
    }
  }, []);

  const handleLoadDraft = () => {
    try {
      const saved = localStorage.getItem('wine-form-draft');
      if (saved) {
        const draft = JSON.parse(saved);
        dispatch({ type: 'LOAD_DRAFT', draft });
        setShowDraftDialog(false);
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('wine-form-draft');
    setShowDraftDialog(false);
  };

  const handleNext = () => {
    dispatch({ type: 'VALIDATE_STEP', step: state.currentStep });

    // バリデーションチェック
    let isValid = false;
    switch (state.currentStep) {
      case 1:
        isValid = state.basicInfo.name.length > 0 &&
                 state.basicInfo.winery.length > 0 &&
                 state.basicInfo.type !== '';
        if (!isValid) {
          if (!state.basicInfo.name) dispatch({ type: 'SET_ERROR', field: 'name', message: 'ワイン名は必須です' });
          if (!state.basicInfo.winery) dispatch({ type: 'SET_ERROR', field: 'winery', message: 'ワイナリー名は必須です' });
          if (!state.basicInfo.type) dispatch({ type: 'SET_ERROR', field: 'type', message: 'ワインタイプは必須です' });
        }
        break;
      case 2:
        isValid = state.tastingNotes.appearance.color.length > 0 &&
                 state.tastingNotes.aroma.intensity !== '';
        if (!isValid) {
          if (!state.tastingNotes.appearance.color) dispatch({ type: 'SET_ERROR', field: 'color', message: '色は必須です' });
          if (!state.tastingNotes.aroma.intensity) dispatch({ type: 'SET_ERROR', field: 'aroma_intensity', message: '香りの強さは必須です' });
        }
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      dispatch({ type: 'CLEAR_ALL_ERRORS' });
      dispatch({ type: 'NEXT_STEP' });
    }
  };

  const handlePrev = () => {
    dispatch({ type: 'PREV_STEP' });
  };

  const handleSubmit = async () => {
    dispatch({ type: 'VALIDATE_STEP', step: 3 });

    if (state.rating.overall === 0) {
      dispatch({ type: 'SET_ERROR', field: 'overall_rating', message: '総合評価は必須です' });
      return;
    }

    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });

    try {
      await onSubmit(state);
      localStorage.removeItem('wine-form-draft');
      dispatch({ type: 'RESET_FORM' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', field: 'submit', message: '送信に失敗しました' });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  };

  const getStepTitle = () => {
    switch (state.currentStep) {
      case 1: return '基本情報';
      case 2: return 'テイスティングノート';
      case 3: return '評価・ペアリング';
      default: return '';
    }
  };

  const aromaCharacteristics = [
    'フルーティー', 'フローラル', 'スパイシー', 'ハーブ', 'ミネラル',
    'オーク', 'バニラ', 'ベリー系', '柑橘系', 'トロピカル',
    '土っぽい', '草っぽい', 'ナッツ系', 'チョコレート', 'コーヒー'
  ];

  const foodPairings = [
    '赤身肉', '白身肉', '鶏肉', '魚介類', 'チーズ',
    'サラダ', 'パスタ', 'リゾット', 'グリル料理', '揚げ物',
    'スパイシー料理', '和食', '中華料理', 'イタリアン', 'フレンチ'
  ];

  return (
    <div className="advanced-wine-form-overlay">
      {/* ドラフト復元ダイアログ */}
      {showDraftDialog && (
        <div className="draft-dialog">
          <div className="dialog-content">
            <h3>保存されたドラフトがあります</h3>
            <p>前回の入力を復元しますか？</p>
            <div className="dialog-actions">
              <button onClick={handleDiscardDraft} className="discard-btn">
                新規作成
              </button>
              <button onClick={handleLoadDraft} className="load-btn">
                復元する
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="advanced-wine-form">
        {/* ヘッダー */}
        <div className="form-header">
          <h2>🍷 詳細ワイン登録</h2>
          <button onClick={onCancel} className="close-btn">✕</button>
        </div>

        {/* プログレスバー */}
        <div className="progress-bar">
          <div className="progress-steps">
            {Array.from({ length: state.totalSteps }, (_, i) => (
              <div
                key={i + 1}
                className={`progress-step ${
                  i + 1 === state.currentStep ? 'active' :
                  i + 1 < state.currentStep ? 'completed' : 'pending'
                }`}
                onClick={() => dispatch({ type: 'GO_TO_STEP', step: i + 1 })}
              >
                <span className="step-number">{i + 1}</span>
                <span className="step-title">
                  {i === 0 ? '基本情報' : i === 1 ? 'テイスティング' : '評価'}
                </span>
              </div>
            ))}
          </div>
          <div
            className="progress-fill"
            style={{ width: `${(state.currentStep / state.totalSteps) * 100}%` }}
          />
        </div>

        {/* フォーム内容 */}
        <div className="form-content">
          <h3>{getStepTitle()}</h3>

          {/* ステップ1: 基本情報 */}
          {state.currentStep === 1 && (
            <div className="step-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>ワイン名 *</label>
                  <input
                    type="text"
                    value={state.basicInfo.name}
                    onChange={(e) => dispatch({ type: 'UPDATE_BASIC_INFO', field: 'name', value: e.target.value })}
                    className={state.errors.name ? 'error' : ''}
                  />
                  {state.errors.name && <span className="error-message">{state.errors.name}</span>}
                </div>

                <div className="form-group">
                  <label>ワイナリー *</label>
                  <input
                    type="text"
                    value={state.basicInfo.winery}
                    onChange={(e) => dispatch({ type: 'UPDATE_BASIC_INFO', field: 'winery', value: e.target.value })}
                    className={state.errors.winery ? 'error' : ''}
                  />
                  {state.errors.winery && <span className="error-message">{state.errors.winery}</span>}
                </div>

                <div className="form-group">
                  <label>ヴィンテージ</label>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={state.basicInfo.vintage}
                    onChange={(e) => dispatch({ type: 'UPDATE_BASIC_INFO', field: 'vintage', value: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>ワインタイプ *</label>
                  <select
                    value={state.basicInfo.type}
                    onChange={(e) => dispatch({ type: 'UPDATE_BASIC_INFO', field: 'type', value: e.target.value })}
                    className={state.errors.type ? 'error' : ''}
                  >
                    <option value="">選択してください</option>
                    <option value="red">赤ワイン</option>
                    <option value="white">白ワイン</option>
                    <option value="rose">ロゼワイン</option>
                    <option value="sparkling">スパークリング</option>
                    <option value="dessert">デザートワイン</option>
                  </select>
                  {state.errors.type && <span className="error-message">{state.errors.type}</span>}
                </div>

                <div className="form-group">
                  <label>産地</label>
                  <input
                    type="text"
                    value={state.basicInfo.region}
                    onChange={(e) => dispatch({ type: 'UPDATE_BASIC_INFO', field: 'region', value: e.target.value })}
                    placeholder="ボルドー、ブルゴーニュなど"
                  />
                </div>

                <div className="form-group">
                  <label>国</label>
                  <input
                    type="text"
                    value={state.basicInfo.country}
                    onChange={(e) => dispatch({ type: 'UPDATE_BASIC_INFO', field: 'country', value: e.target.value })}
                    placeholder="フランス、イタリアなど"
                  />
                </div>

                <div className="form-group">
                  <label>価格</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={state.basicInfo.price}
                    onChange={(e) => dispatch({ type: 'UPDATE_BASIC_INFO', field: 'price', value: e.target.value })}
                    placeholder="円"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ステップ2: テイスティングノート */}
          {state.currentStep === 2 && (
            <div className="step-content">
              {/* 外観 */}
              <div className="tasting-section">
                <h4>👁️ 外観</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>色 *</label>
                    <input
                      type="text"
                      value={state.tastingNotes.appearance.color}
                      onChange={(e) => dispatch({ type: 'UPDATE_APPEARANCE', field: 'color', value: e.target.value })}
                      placeholder="ルビー、ゴールドなど"
                      className={state.errors.color ? 'error' : ''}
                    />
                    {state.errors.color && <span className="error-message">{state.errors.color}</span>}
                  </div>

                  <div className="form-group">
                    <label>透明度</label>
                    <select
                      value={state.tastingNotes.appearance.clarity}
                      onChange={(e) => dispatch({ type: 'UPDATE_APPEARANCE', field: 'clarity', value: e.target.value })}
                    >
                      <option value="">選択</option>
                      <option value="brilliant">クリスタル</option>
                      <option value="clear">クリア</option>
                      <option value="hazy">濁り</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>色の濃さ</label>
                    <select
                      value={state.tastingNotes.appearance.intensity}
                      onChange={(e) => dispatch({ type: 'UPDATE_APPEARANCE', field: 'intensity', value: e.target.value })}
                    >
                      <option value="">選択</option>
                      <option value="light">淡い</option>
                      <option value="medium">中程度</option>
                      <option value="deep">濃い</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 香り */}
              <div className="tasting-section">
                <h4>👃 香り</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>強さ *</label>
                    <select
                      value={state.tastingNotes.aroma.intensity}
                      onChange={(e) => dispatch({ type: 'UPDATE_AROMA', field: 'intensity', value: e.target.value })}
                      className={state.errors.aroma_intensity ? 'error' : ''}
                    >
                      <option value="">選択</option>
                      <option value="light">弱い</option>
                      <option value="medium">中程度</option>
                      <option value="pronounced">強い</option>
                    </select>
                    {state.errors.aroma_intensity && <span className="error-message">{state.errors.aroma_intensity}</span>}
                  </div>

                  <div className="form-group full-width">
                    <label>特徴</label>
                    <div className="characteristics-grid">
                      {aromaCharacteristics.map(char => (
                        <button
                          key={char}
                          type="button"
                          className={`characteristic-btn ${state.tastingNotes.aroma.characteristics.includes(char) ? 'selected' : ''}`}
                          onClick={() => {
                            if (state.tastingNotes.aroma.characteristics.includes(char)) {
                              dispatch({ type: 'REMOVE_AROMA_CHARACTERISTIC', characteristic: char });
                            } else {
                              dispatch({ type: 'ADD_AROMA_CHARACTERISTIC', characteristic: char });
                            }
                          }}
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>詳細メモ</label>
                    <textarea
                      value={state.tastingNotes.aroma.notes}
                      onChange={(e) => dispatch({ type: 'UPDATE_AROMA', field: 'notes', value: e.target.value })}
                      placeholder="具体的な香りの印象を記録..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* 味わい */}
              <div className="tasting-section">
                <h4>👅 味わい</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>甘さ</label>
                    <select
                      value={state.tastingNotes.taste.sweetness}
                      onChange={(e) => dispatch({ type: 'UPDATE_TASTE', field: 'sweetness', value: e.target.value })}
                    >
                      <option value="">選択</option>
                      <option value="bone-dry">辛口</option>
                      <option value="dry">ドライ</option>
                      <option value="off-dry">オフドライ</option>
                      <option value="medium-sweet">中甘口</option>
                      <option value="sweet">甘口</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>酸味</label>
                    <select
                      value={state.tastingNotes.taste.acidity}
                      onChange={(e) => dispatch({ type: 'UPDATE_TASTE', field: 'acidity', value: e.target.value })}
                    >
                      <option value="">選択</option>
                      <option value="low">低</option>
                      <option value="medium-">中-</option>
                      <option value="medium">中</option>
                      <option value="medium+">中+</option>
                      <option value="high">高</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>タンニン</label>
                    <select
                      value={state.tastingNotes.taste.tannin}
                      onChange={(e) => dispatch({ type: 'UPDATE_TASTE', field: 'tannin', value: e.target.value })}
                    >
                      <option value="">選択</option>
                      <option value="low">低</option>
                      <option value="medium-">中-</option>
                      <option value="medium">中</option>
                      <option value="medium+">中+</option>
                      <option value="high">高</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>ボディ</label>
                    <select
                      value={state.tastingNotes.taste.body}
                      onChange={(e) => dispatch({ type: 'UPDATE_TASTE', field: 'body', value: e.target.value })}
                    >
                      <option value="">選択</option>
                      <option value="light">ライト</option>
                      <option value="medium-">ミディアム-</option>
                      <option value="medium">ミディアム</option>
                      <option value="medium+">ミディアム+</option>
                      <option value="full">フル</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>アルコール</label>
                    <select
                      value={state.tastingNotes.taste.alcohol}
                      onChange={(e) => dispatch({ type: 'UPDATE_TASTE', field: 'alcohol', value: e.target.value })}
                    >
                      <option value="">選択</option>
                      <option value="low">低（11%未満）</option>
                      <option value="medium">中（11-14%）</option>
                      <option value="high">高（14%以上）</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>余韻</label>
                    <select
                      value={state.tastingNotes.taste.finish}
                      onChange={(e) => dispatch({ type: 'UPDATE_TASTE', field: 'finish', value: e.target.value })}
                    >
                      <option value="">選択</option>
                      <option value="short">短い</option>
                      <option value="medium">中程度</option>
                      <option value="long">長い</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>フレーバー</label>
                    <textarea
                      value={state.tastingNotes.taste.flavor}
                      onChange={(e) => dispatch({ type: 'UPDATE_TASTE', field: 'flavor', value: e.target.value })}
                      placeholder="具体的な味わいの印象..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ステップ3: 評価・ペアリング */}
          {state.currentStep === 3 && (
            <div className="step-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>総合評価 * (1-5)</label>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= state.rating.overall ? 'filled' : ''}`}
                        onClick={() => dispatch({ type: 'UPDATE_RATING', field: 'overall', value: star })}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  {state.errors.overall_rating && <span className="error-message">{state.errors.overall_rating}</span>}
                </div>

                <div className="form-group">
                  <label>コスパ評価 (1-5)</label>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= state.rating.value ? 'filled' : ''}`}
                        onClick={() => dispatch({ type: 'UPDATE_RATING', field: 'value', value: star })}
                      >
                        💰
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>熟成ポテンシャル</label>
                  <select
                    value={state.rating.ageingPotential}
                    onChange={(e) => dispatch({ type: 'UPDATE_RATING', field: 'ageingPotential', value: e.target.value })}
                  >
                    <option value="">選択</option>
                    <option value="drink-now">今すぐ飲み頃</option>
                    <option value="1-3-years">1-3年</option>
                    <option value="3-5-years">3-5年</option>
                    <option value="5-10-years">5-10年</option>
                    <option value="10+-years">10年以上</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={state.rating.drinkNow}
                      onChange={(e) => dispatch({ type: 'UPDATE_RATING', field: 'drinkNow', value: e.target.checked })}
                    />
                    今飲み頃
                  </label>
                </div>

                <div className="form-group full-width">
                  <label>フードペアリング</label>
                  <div className="characteristics-grid">
                    {foodPairings.map(pairing => (
                      <button
                        key={pairing}
                        type="button"
                        className={`characteristic-btn ${state.rating.foodPairing.includes(pairing) ? 'selected' : ''}`}
                        onClick={() => {
                          if (state.rating.foodPairing.includes(pairing)) {
                            dispatch({ type: 'REMOVE_FOOD_PAIRING', pairing });
                          } else {
                            dispatch({ type: 'ADD_FOOD_PAIRING', pairing });
                          }
                        }}
                      >
                        {pairing}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>個人的メモ</label>
                  <textarea
                    value={state.rating.personalNotes}
                    onChange={(e) => dispatch({ type: 'UPDATE_RATING', field: 'personalNotes', value: e.target.value })}
                    placeholder="このワインについての個人的な感想や記録..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="form-footer">
          <div className="footer-left">
            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET_FORM' })}
              className="reset-btn"
            >
              🗑️ リセット
            </button>
          </div>

          <div className="footer-right">
            {state.currentStep > 1 && (
              <button onClick={handlePrev} className="prev-btn">
                ← 前へ
              </button>
            )}

            {state.currentStep < state.totalSteps ? (
              <button onClick={handleNext} className="next-btn">
                次へ →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={state.isSubmitting}
                className="submit-btn"
              >
                {state.isSubmitting ? '送信中...' : '🍷 ワインを登録'}
              </button>
            )}
          </div>
        </div>

        {/* エラー表示 */}
        {state.errors.submit && (
          <div className="submit-error">
            {state.errors.submit}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedWineForm;