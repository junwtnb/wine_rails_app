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

  return (
    <div className="header-controls">
      {/* ツール系のドロップダウン */}
      <div className="dropdown-container" ref={toolsRef}>
        <button
          onClick={() => setShowToolsDropdown(!showToolsDropdown)}
          className="header-btn dropdown-trigger"
          title="ツール"
        >
          🛠️
        </button>
        {showToolsDropdown && (
          <div className="dropdown-menu">
            <button
              onClick={() => {
                onShowAdvancedForm();
                setShowToolsDropdown(false);
              }}
              className="dropdown-item"
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
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="header-btn dropdown-trigger"
          title="アカウント・設定"
        >
          👤
        </button>
        {showUserDropdown && (
          <div className="dropdown-menu">
            <button
              onClick={() => {
                onShowUserSettings();
                setShowUserDropdown(false);
              }}
              className="dropdown-item"
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