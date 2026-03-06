import React, { useState, useRef, useEffect } from 'react';
import { useTheme, getThemeIcon, getThemeName } from '../contexts/ThemeContext';
import NetworkStatus from './NetworkStatus';

interface HeaderControlsProps {
  showNotifications: boolean;
  onShowAdvancedForm: () => void;
  onShowSearchHistory: () => void;
  onShowVineyardGame: () => void;
  onShowUserSettings: () => void;
}

const HeaderControls: React.FC<HeaderControlsProps> = ({
  showNotifications,
  onShowAdvancedForm,
  onShowSearchHistory,
  onShowVineyardGame,
  onShowUserSettings,
}) => {
  const { state: themeState, actions: themeActions } = useTheme();
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [toolsPosition, setToolsPosition] = useState({ top: 0, right: 0 });
  const [userPosition, setUserPosition] = useState({ top: 0, right: 0 });
  const toolsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setShowToolsDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 位置計算関数
  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { top: 0, right: 0 };
    const rect = ref.current.getBoundingClientRect();
    return {
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right
    };
  };

  // ドロップダウン開閉ハンドラー
  const handleToolsToggle = () => {
    if (!showToolsDropdown) {
      setToolsPosition(calculatePosition(toolsRef));
    }
    setShowToolsDropdown(!showToolsDropdown);
  };

  const handleUserToggle = () => {
    if (!showUserDropdown) {
      setUserPosition(calculatePosition(userRef));
    }
    setShowUserDropdown(!showUserDropdown);
  };

  return (
    <div className="header-controls">
      {/* ツール系のドロップダウン */}
      <div className="dropdown-container" ref={toolsRef}>
        <button
          onClick={handleToolsToggle}
          className="header-btn dropdown-trigger"
          title="ツール"
          aria-label="ツールメニューを開く"
          aria-expanded={showToolsDropdown}
          aria-haspopup="true"
        >
          🛠️
        </button>
        {showToolsDropdown && (
          <div
            className="dropdown-menu"
            role="menu"
            aria-label="ツールメニュー"
            style={{
              position: 'fixed',
              top: `${toolsPosition.top}px`,
              right: `${toolsPosition.right}px`
            }}
          >
            <button
              onClick={() => {
                onShowAdvancedForm();
                setShowToolsDropdown(false);
              }}
              className="dropdown-item"
              role="menuitem"
              aria-label="詳細ワイン登録画面を開く"
            >
              <span className="dropdown-icon">📝</span>
              <span className="dropdown-label">詳細ワイン登録</span>
            </button>
            <button
              onClick={() => {
                onShowSearchHistory();
                setShowToolsDropdown(false);
              }}
              className="dropdown-item"
              role="menuitem"
              aria-label="検索履歴を表示"
            >
              <span className="dropdown-icon">🕒</span>
              <span className="dropdown-label">検索履歴</span>
            </button>
            <button
              onClick={() => {
                onShowVineyardGame();
                setShowToolsDropdown(false);
              }}
              className="dropdown-item"
              role="menuitem"
              aria-label="ぶどう畑ゲームを開始"
            >
              <span className="dropdown-icon">🍇</span>
              <span className="dropdown-label">ぶどう畑ゲーム</span>
            </button>
          </div>
        )}
      </div>

      {/* ユーザー設定系のドロップダウン */}
      <div className="dropdown-container" ref={userRef}>
        <button
          onClick={handleUserToggle}
          className="header-btn dropdown-trigger"
          title="アカウント・設定"
          aria-label="ユーザー設定メニューを開く"
          aria-expanded={showUserDropdown}
          aria-haspopup="true"
        >
          👤
        </button>
        {showUserDropdown && (
          <div
            className="dropdown-menu"
            role="menu"
            aria-label="ユーザー設定メニュー"
            style={{
              position: 'fixed',
              top: `${userPosition.top}px`,
              right: `${userPosition.right}px`
            }}
          >
            <button
              onClick={() => {
                onShowUserSettings();
                setShowUserDropdown(false);
              }}
              className="dropdown-item"
              role="menuitem"
              aria-label="ユーザー設定を開く"
            >
              <span className="dropdown-icon">⚙️</span>
              <span className="dropdown-label">設定</span>
            </button>
            <button
              onClick={() => {
                themeActions.toggleTheme();
                setShowUserDropdown(false);
              }}
              className="dropdown-item"
              role="menuitem"
              aria-label={`テーマを${themeState.mode === 'dark' ? 'ライト' : 'ダーク'}モードに変更`}
            >
              <span className="dropdown-icon">
                {getThemeIcon(themeState.actualTheme, themeState.mode)}
              </span>
              <span className="dropdown-label">
                {getThemeName(themeState.mode, themeState.actualTheme)}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ネットワークステータス（独立） */}
      <NetworkStatus showNotification={showNotifications} />
    </div>
  );
};

export default HeaderControls;