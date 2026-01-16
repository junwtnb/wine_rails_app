import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

// テーマ関連の型定義
type ThemeMode = 'light' | 'dark' | 'auto';
type ActualTheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  actualTheme: ActualTheme;
  systemTheme: ActualTheme;
  isTransitioning: boolean;
  autoThemeBasedOn: 'system' | 'time';
}

// テーマアクションの型定義
type ThemeAction =
  | { type: 'SET_THEME_MODE'; payload: ThemeMode }
  | { type: 'SET_ACTUAL_THEME'; payload: ActualTheme }
  | { type: 'SET_SYSTEM_THEME'; payload: ActualTheme }
  | { type: 'SET_TRANSITIONING'; payload: boolean }
  | { type: 'SET_AUTO_THEME_BASIS'; payload: 'system' | 'time' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'INIT_THEME'; payload: Partial<ThemeState> };

// 初期状態
const initialThemeState: ThemeState = {
  mode: 'auto',
  actualTheme: 'light',
  systemTheme: 'light',
  isTransitioning: false,
  autoThemeBasedOn: 'time'
};

// リデューサー関数
function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME_MODE':
      return { ...state, mode: action.payload };

    case 'SET_ACTUAL_THEME':
      return { ...state, actualTheme: action.payload };

    case 'SET_SYSTEM_THEME':
      return { ...state, systemTheme: action.payload };

    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.payload };

    case 'SET_AUTO_THEME_BASIS':
      return { ...state, autoThemeBasedOn: action.payload };

    case 'TOGGLE_THEME':
      const nextMode: ThemeMode = state.mode === 'light' ? 'dark' :
                                  state.mode === 'dark' ? 'auto' : 'light';
      return { ...state, mode: nextMode };

    case 'INIT_THEME':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// Context作成
const ThemeContext = createContext<{
  state: ThemeState;
  dispatch: React.Dispatch<ThemeAction>;
  actions: {
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    setAutoThemeBasis: (basis: 'system' | 'time') => void;
  };
} | undefined>(undefined);

// プロバイダーコンポーネント
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialThemeState);

  // アクション関数
  const actions = {
    setThemeMode: (mode: ThemeMode) => {
      dispatch({ type: 'SET_TRANSITIONING', payload: true });
      dispatch({ type: 'SET_THEME_MODE', payload: mode });

      // トランジション終了
      setTimeout(() => {
        dispatch({ type: 'SET_TRANSITIONING', payload: false });
      }, 300);
    },

    toggleTheme: () => {
      dispatch({ type: 'SET_TRANSITIONING', payload: true });
      dispatch({ type: 'TOGGLE_THEME' });

      setTimeout(() => {
        dispatch({ type: 'SET_TRANSITIONING', payload: false });
      }, 300);
    },

    setAutoThemeBasis: (basis: 'system' | 'time') => {
      dispatch({ type: 'SET_AUTO_THEME_BASIS', payload: basis });
    }
  };

  // localStorage からの初期化
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('wine-theme-settings');
      if (savedTheme) {
        const themeSettings = JSON.parse(savedTheme);
        dispatch({
          type: 'INIT_THEME',
          payload: {
            mode: themeSettings.mode || 'auto',
            autoThemeBasedOn: themeSettings.autoThemeBasedOn || 'time'
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load theme settings:', error);
    }
  }, []);

  // システムテーマの監視
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      dispatch({
        type: 'SET_SYSTEM_THEME',
        payload: e.matches ? 'dark' : 'light'
      });
    };

    updateSystemTheme(mediaQuery);
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, []);

  // 実際のテーマの決定
  useEffect(() => {
    let actualTheme: ActualTheme;

    if (state.mode === 'light') {
      actualTheme = 'light';
    } else if (state.mode === 'dark') {
      actualTheme = 'dark';
    } else {
      // auto モードの場合
      if (state.autoThemeBasedOn === 'system') {
        actualTheme = state.systemTheme;
      } else {
        // 時間ベースの自動テーマ
        const hour = new Date().getHours();
        actualTheme = (hour >= 18 || hour < 7) ? 'dark' : 'light';
      }
    }

    if (actualTheme !== state.actualTheme) {
      dispatch({ type: 'SET_ACTUAL_THEME', payload: actualTheme });
    }
  }, [state.mode, state.systemTheme, state.autoThemeBasedOn, state.actualTheme]);

  // 時間ベースの自動テーマ更新
  useEffect(() => {
    if (state.mode === 'auto' && state.autoThemeBasedOn === 'time') {
      const checkInterval = setInterval(() => {
        const hour = new Date().getHours();
        const timeBasedTheme: ActualTheme = (hour >= 18 || hour < 7) ? 'dark' : 'light';

        if (timeBasedTheme !== state.actualTheme) {
          dispatch({ type: 'SET_ACTUAL_THEME', payload: timeBasedTheme });
        }
      }, 60000); // 1分ごとにチェック

      return () => clearInterval(checkInterval);
    }
  }, [state.mode, state.autoThemeBasedOn, state.actualTheme]);

  // DOMへのテーマ適用
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.actualTheme);
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    document.body.classList.add(`theme-${state.actualTheme}`);

    if (state.isTransitioning) {
      document.body.classList.add('theme-transitioning');
    } else {
      document.body.classList.remove('theme-transitioning');
    }

    // テーマ変更イベントを記録
    const themeEvent = {
      timestamp: new Date().toISOString(),
      mode: state.mode,
      actualTheme: state.actualTheme,
      systemTheme: state.systemTheme,
      autoThemeBasedOn: state.autoThemeBasedOn,
      hour: new Date().getHours()
    };

    try {
      const events = JSON.parse(localStorage.getItem('theme-change-events') || '[]');
      events.push(themeEvent);

      if (events.length > 20) {
        events.splice(0, events.length - 20);
      }

      localStorage.setItem('theme-change-events', JSON.stringify(events));
    } catch (error) {
      console.warn('Failed to save theme event:', error);
    }
  }, [state.actualTheme, state.isTransitioning]);

  // localStorage への設定保存
  useEffect(() => {
    try {
      const themeSettings = {
        mode: state.mode,
        autoThemeBasedOn: state.autoThemeBasedOn
      };
      localStorage.setItem('wine-theme-settings', JSON.stringify(themeSettings));
    } catch (error) {
      console.warn('Failed to save theme settings:', error);
    }
  }, [state.mode, state.autoThemeBasedOn]);

  return (
    <ThemeContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </ThemeContext.Provider>
  );
};

// カスタムフック
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ユーティリティ関数
export const getThemeIcon = (theme: ActualTheme, mode: ThemeMode): string => {
  if (mode === 'auto') {
    return '🌅';
  }
  return theme === 'dark' ? '🌙' : '☀️';
};

export const getThemeName = (mode: ThemeMode, actualTheme: ActualTheme, language: 'ja' | 'en' = 'ja'): string => {
  if (language === 'en') {
    switch (mode) {
      case 'light': return 'Light Mode';
      case 'dark': return 'Dark Mode';
      case 'auto': return `Auto (${actualTheme === 'dark' ? 'Dark' : 'Light'})`;
    }
  } else {
    switch (mode) {
      case 'light': return 'ライトモード';
      case 'dark': return 'ダークモード';
      case 'auto': return `自動 (現在: ${actualTheme === 'dark' ? 'ダーク' : 'ライト'})`;
    }
  }
};

// エクスポート
export type { ThemeMode, ActualTheme, ThemeState, ThemeAction };