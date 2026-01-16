import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { WineResponse } from '../App';

// アプリケーション状態の型定義
interface AppState {
  // UI状態
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  // ワイン関連
  currentWineResult: WineResponse | null;
  searchHistory: SearchHistoryItem[];
  favoriteWines: FavoriteWine[];

  // ユーザー設定
  userPreferences: UserPreferences;

  // 統計情報
  totalSearches: number;
  totalQuizzesTaken: number;

  // ネットワーク・アクティビティ状態
  isOnline: boolean;
  isUserActive: boolean;
}

// 検索履歴の型
interface SearchHistoryItem {
  id: string;
  query: string;
  result: WineResponse | null;
  timestamp: Date;
  source: 'search' | 'random' | 'quiz';
}

// お気に入りワインの型
interface FavoriteWine {
  id: string;
  name: string;
  description: string;
  notes?: string;
  addedAt: Date;
}

// ユーザー設定の型
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'ja' | 'en';
  showNotifications: boolean;
  autoSaveSearchHistory: boolean;
  quizDifficulty: 'beginner' | 'intermediate' | 'advanced';
  soundEnabled: boolean;
}

// アクションの型定義
type AppAction =
  // UI関連
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS_MESSAGE'; payload: string | null }

  // ワイン関連
  | { type: 'SET_WINE_RESULT'; payload: WineResponse | null }
  | { type: 'ADD_SEARCH_HISTORY'; payload: Omit<SearchHistoryItem, 'id' | 'timestamp'> }
  | { type: 'CLEAR_SEARCH_HISTORY' }
  | { type: 'ADD_FAVORITE_WINE'; payload: Omit<FavoriteWine, 'id' | 'addedAt'> }
  | { type: 'REMOVE_FAVORITE_WINE'; payload: string }

  // ユーザー設定
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_USER_PREFERENCES' }

  // 統計
  | { type: 'INCREMENT_TOTAL_SEARCHES' }
  | { type: 'INCREMENT_TOTAL_QUIZZES' }

  // ネットワーク・アクティビティ
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_USER_ACTIVE'; payload: boolean }

  // 初期化
  | { type: 'LOAD_FROM_STORAGE'; payload: Partial<AppState> };

// 初期状態
const initialState: AppState = {
  isLoading: false,
  error: null,
  successMessage: null,
  currentWineResult: null,
  searchHistory: [],
  favoriteWines: [],
  userPreferences: {
    theme: 'auto',
    language: 'ja',
    showNotifications: true,
    autoSaveSearchHistory: true,
    quizDifficulty: 'intermediate',
    soundEnabled: true
  },
  totalSearches: 0,
  totalQuizzesTaken: 0,
  isOnline: navigator.onLine,
  isUserActive: true
};

// リデューサー関数
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        successMessage: action.payload ? null : state.successMessage
      };

    case 'SET_SUCCESS_MESSAGE':
      return {
        ...state,
        successMessage: action.payload,
        error: action.payload ? null : state.error
      };

    case 'SET_WINE_RESULT':
      return { ...state, currentWineResult: action.payload };

    case 'ADD_SEARCH_HISTORY':
      const newHistoryItem: SearchHistoryItem = {
        ...action.payload,
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      const updatedHistory = [newHistoryItem, ...state.searchHistory].slice(0, 50); // 最大50件
      return {
        ...state,
        searchHistory: updatedHistory
      };

    case 'CLEAR_SEARCH_HISTORY':
      return { ...state, searchHistory: [] };

    case 'ADD_FAVORITE_WINE':
      const newFavorite: FavoriteWine = {
        ...action.payload,
        id: `favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: new Date()
      };
      return {
        ...state,
        favoriteWines: [newFavorite, ...state.favoriteWines]
      };

    case 'REMOVE_FAVORITE_WINE':
      return {
        ...state,
        favoriteWines: state.favoriteWines.filter(wine => wine.id !== action.payload)
      };

    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, ...action.payload }
      };

    case 'RESET_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: initialState.userPreferences
      };

    case 'INCREMENT_TOTAL_SEARCHES':
      return { ...state, totalSearches: state.totalSearches + 1 };

    case 'INCREMENT_TOTAL_QUIZZES':
      return { ...state, totalQuizzesTaken: state.totalQuizzesTaken + 1 };

    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };

    case 'SET_USER_ACTIVE':
      return { ...state, isUserActive: action.payload };

    case 'LOAD_FROM_STORAGE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Context作成
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// プロバイダーコンポーネント
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // localStorage からの初期化
  useEffect(() => {
    const loadStoredData = () => {
      try {
        // 検索履歴の読み込み
        const storedHistory = localStorage.getItem('wine-search-history');
        const searchHistory = storedHistory ? JSON.parse(storedHistory) : [];

        // お気に入りの読み込み
        const storedFavorites = localStorage.getItem('wine-favorites');
        const favoriteWines = storedFavorites ? JSON.parse(storedFavorites) : [];

        // ユーザー設定の読み込み
        const storedPreferences = localStorage.getItem('wine-user-preferences');
        const userPreferences = storedPreferences
          ? { ...initialState.userPreferences, ...JSON.parse(storedPreferences) }
          : initialState.userPreferences;

        // 統計情報の読み込み
        const storedStats = localStorage.getItem('wine-app-stats');
        const stats = storedStats ? JSON.parse(storedStats) : { totalSearches: 0, totalQuizzesTaken: 0 };

        dispatch({
          type: 'LOAD_FROM_STORAGE',
          payload: {
            searchHistory: searchHistory.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
            })),
            favoriteWines: favoriteWines.map((item: any) => ({
              ...item,
              addedAt: new Date(item.addedAt)
            })),
            userPreferences,
            totalSearches: stats.totalSearches,
            totalQuizzesTaken: stats.totalQuizzesTaken
          }
        });
      } catch (error) {
        console.warn('Failed to load data from localStorage:', error);
      }
    };

    loadStoredData();
  }, []);

  // localStorage への保存
  useEffect(() => {
    try {
      localStorage.setItem('wine-search-history', JSON.stringify(state.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, [state.searchHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('wine-favorites', JSON.stringify(state.favoriteWines));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  }, [state.favoriteWines]);

  useEffect(() => {
    try {
      localStorage.setItem('wine-user-preferences', JSON.stringify(state.userPreferences));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }, [state.userPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem('wine-app-stats', JSON.stringify({
        totalSearches: state.totalSearches,
        totalQuizzesTaken: state.totalQuizzesTaken
      }));
    } catch (error) {
      console.warn('Failed to save app stats:', error);
    }
  }, [state.totalSearches, state.totalQuizzesTaken]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// カスタムフック
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// エクスポート
export type {
  AppState,
  AppAction,
  SearchHistoryItem,
  FavoriteWine,
  UserPreferences
};