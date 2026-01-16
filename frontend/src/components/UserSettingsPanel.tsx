import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useTheme, getThemeIcon, getThemeName } from '../contexts/ThemeContext';

interface UserSettingsPanelProps {
  onClose: () => void;
}

const UserSettingsPanel: React.FC<UserSettingsPanelProps> = ({ onClose }) => {
  const { state, dispatch } = useApp();
  const { state: themeState, actions: themeActions } = useTheme();
  const { userPreferences } = state;

  const [tempPreferences, setTempPreferences] = useState(userPreferences);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handlePreferenceChange = <K extends keyof typeof userPreferences>(
    key: K,
    value: typeof userPreferences[K]
  ) => {
    setTempPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_USER_PREFERENCES',
      payload: tempPreferences
    });

    // テーマ設定の同期
    if (tempPreferences.theme !== themeState.mode) {
      themeActions.setThemeMode(tempPreferences.theme);
    }

    onClose();
  };

  const handleReset = () => {
    if (showConfirmReset) {
      dispatch({ type: 'RESET_USER_PREFERENCES' });
      themeActions.setThemeMode('auto');
      setTempPreferences({
        theme: 'auto',
        language: 'ja',
        showNotifications: true,
        autoSaveSearchHistory: true,
        quizDifficulty: 'intermediate',
        soundEnabled: true
      });
      setShowConfirmReset(false);
    } else {
      setShowConfirmReset(true);
      setTimeout(() => setShowConfirmReset(false), 5000);
    }
  };

  const handleCancel = () => {
    setTempPreferences(userPreferences);
    onClose();
  };

  const exportSettings = () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        userPreferences: tempPreferences,
        themeSettings: {
          mode: themeState.mode,
          autoThemeBasedOn: themeState.autoThemeBasedOn
        },
        statistics: {
          totalSearches: state.totalSearches,
          totalQuizzesTaken: state.totalQuizzesTaken,
          searchHistoryCount: state.searchHistory.length,
          favoritesCount: state.favoriteWines.length
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `wine-app-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export settings:', error);
    }
  };

  const hasUnsavedChanges = JSON.stringify(tempPreferences) !== JSON.stringify(userPreferences);

  return (
    <div className="user-settings-overlay">
      <div className="user-settings-panel">
        {/* ヘッダー */}
        <div className="panel-header">
          <h2>⚙️ ユーザー設定</h2>
          <button onClick={hasUnsavedChanges ? handleCancel : onClose} className="close-btn">
            ✕
          </button>
        </div>

        {/* 変更通知 */}
        {hasUnsavedChanges && (
          <div className="unsaved-changes-notice">
            ⚠️ 未保存の変更があります
          </div>
        )}

        {/* 設定セクション */}
        <div className="settings-content">
          {/* 外観設定 */}
          <section className="settings-section">
            <h3>🎨 外観</h3>

            <div className="setting-item">
              <label htmlFor="theme-select">テーマ</label>
              <select
                id="theme-select"
                value={tempPreferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value as any)}
              >
                <option value="light">ライトモード</option>
                <option value="dark">ダークモード</option>
                <option value="auto">自動</option>
              </select>
              <small>
                現在: {getThemeIcon(themeState.actualTheme, themeState.mode)} {getThemeName(themeState.mode, themeState.actualTheme)}
              </small>
            </div>

            <div className="setting-item">
              <label htmlFor="language-select">言語</label>
              <select
                id="language-select"
                value={tempPreferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value as any)}
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>
          </section>

          {/* 通知設定 */}
          <section className="settings-section">
            <h3>🔔 通知</h3>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tempPreferences.showNotifications}
                  onChange={(e) => handlePreferenceChange('showNotifications', e.target.checked)}
                />
                <span>通知を表示</span>
              </label>
              <small>ネットワーク状況やエラーの通知を表示します</small>
            </div>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tempPreferences.soundEnabled}
                  onChange={(e) => handlePreferenceChange('soundEnabled', e.target.checked)}
                />
                <span>効果音を有効</span>
              </label>
              <small>タイマーやクイズで効果音を再生します</small>
            </div>
          </section>

          {/* データ管理 */}
          <section className="settings-section">
            <h3>💾 データ管理</h3>

            <div className="setting-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tempPreferences.autoSaveSearchHistory}
                  onChange={(e) => handlePreferenceChange('autoSaveSearchHistory', e.target.checked)}
                />
                <span>検索履歴を自動保存</span>
              </label>
              <small>検索結果を自動的に履歴に保存します</small>
            </div>
          </section>

          {/* クイズ設定 */}
          <section className="settings-section">
            <h3>🧠 クイズ</h3>

            <div className="setting-item">
              <label htmlFor="quiz-difficulty-select">デフォルト難易度</label>
              <select
                id="quiz-difficulty-select"
                value={tempPreferences.quizDifficulty}
                onChange={(e) => handlePreferenceChange('quizDifficulty', e.target.value as any)}
              >
                <option value="beginner">初級</option>
                <option value="intermediate">中級</option>
                <option value="advanced">上級</option>
              </select>
              <small>クイズ開始時のデフォルト難易度です</small>
            </div>
          </section>

          {/* 統計情報 */}
          <section className="settings-section">
            <h3>📊 統計情報</h3>

            <div className="stats-grid">
              <div className="stat-item">
                <strong>総検索数</strong>
                <span>{state.totalSearches.toLocaleString()}回</span>
              </div>
              <div className="stat-item">
                <strong>クイズ実施数</strong>
                <span>{state.totalQuizzesTaken.toLocaleString()}回</span>
              </div>
              <div className="stat-item">
                <strong>検索履歴</strong>
                <span>{state.searchHistory.length.toLocaleString()}件</span>
              </div>
              <div className="stat-item">
                <strong>お気に入り</strong>
                <span>{state.favoriteWines.length.toLocaleString()}件</span>
              </div>
            </div>
          </section>
        </div>

        {/* アクションボタン */}
        <div className="panel-actions">
          <div className="secondary-actions">
            <button onClick={exportSettings} className="export-btn">
              📥 設定をエクスポート
            </button>
            <button
              onClick={handleReset}
              className={`reset-btn ${showConfirmReset ? 'confirm' : ''}`}
            >
              {showConfirmReset ? '🗑️ 本当にリセット？' : '↺ 設定をリセット'}
            </button>
          </div>

          <div className="primary-actions">
            <button onClick={handleCancel} className="cancel-btn">
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className={`save-btn ${hasUnsavedChanges ? 'has-changes' : ''}`}
              disabled={!hasUnsavedChanges}
            >
              {hasUnsavedChanges ? '💾 変更を保存' : '保存済み'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPanel;