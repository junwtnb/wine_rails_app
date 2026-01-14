import React, { useState, useEffect } from 'react';

interface ThemeManagerProps {
  children?: React.ReactNode;
}

type ThemeMode = 'light' | 'dark' | 'auto';
type ActualTheme = 'light' | 'dark';

const ThemeManager: React.FC<ThemeManagerProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [actualTheme, setActualTheme] = useState<ActualTheme>('light');
  const [systemTheme, setSystemTheme] = useState<ActualTheme>('light');

  // Load saved theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('wine-app-theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Monitor system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial system theme
    updateSystemTheme(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', updateSystemTheme);

    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, []);

  // Auto theme based on time of day
  useEffect(() => {
    if (themeMode !== 'auto') return;

    const updateTimeBasedTheme = () => {
      const now = new Date();
      const hour = now.getHours();

      // Dark theme between 6 PM (18:00) and 7 AM (07:00)
      const shouldBeDark = hour >= 18 || hour < 7;

      // Use system preference as fallback, but prioritize time-based logic
      const timeBasedTheme: ActualTheme = shouldBeDark ? 'dark' : 'light';
      setActualTheme(timeBasedTheme);
    };

    // Update immediately
    updateTimeBasedTheme();

    // Check every minute for time changes
    const interval = setInterval(updateTimeBasedTheme, 60000);

    return () => clearInterval(interval);
  }, [themeMode]);

  // Determine actual theme based on mode
  useEffect(() => {
    if (themeMode === 'light') {
      setActualTheme('light');
    } else if (themeMode === 'dark') {
      setActualTheme('dark');
    } else if (themeMode === 'auto') {
      // Time-based auto theme is handled in the previous useEffect
      // This is just a fallback
      setActualTheme(systemTheme);
    }
  }, [themeMode, systemTheme]);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', actualTheme);
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    document.body.classList.add(`theme-${actualTheme}`);

    // Save to localStorage for analytics
    const themeEvent = {
      timestamp: new Date().toISOString(),
      themeMode,
      actualTheme,
      systemTheme,
      hour: new Date().getHours()
    };

    const events = JSON.parse(localStorage.getItem('theme-events') || '[]');
    events.push(themeEvent);

    // Keep only last 20 theme changes
    if (events.length > 20) {
      events.splice(0, events.length - 20);
    }

    localStorage.setItem('theme-events', JSON.stringify(events));
  }, [actualTheme, themeMode, systemTheme]);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('wine-app-theme', themeMode);
  }, [themeMode]);

  // Handle theme change with smooth transition
  const changeTheme = (newTheme: ThemeMode) => {
    // Add transition class to prevent jarring changes
    document.body.classList.add('theme-transitioning');

    setThemeMode(newTheme);

    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 300);
  };

  const getThemeIcon = () => {
    switch (actualTheme) {
      case 'dark':
        return '🌙';
      case 'light':
        return '☀️';
      default:
        return '🌅';
    }
  };

  const getThemeName = () => {
    switch (themeMode) {
      case 'light':
        return 'ライトモード';
      case 'dark':
        return 'ダークモード';
      case 'auto':
        return `自動 (現在: ${actualTheme === 'dark' ? 'ダーク' : 'ライト'})`;
      default:
        return 'テーマ';
    }
  };

  const getNextTheme = (): ThemeMode => {
    switch (themeMode) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'auto';
      case 'auto':
        return 'light';
      default:
        return 'light';
    }
  };

  return (
    <div className="theme-manager">
      {/* Theme toggle button */}
      <button
        onClick={() => changeTheme(getNextTheme())}
        className="theme-toggle-btn"
        title={`現在: ${getThemeName()} - クリックして切り替え`}
      >
        <span className="theme-icon">{getThemeIcon()}</span>
        <span className="theme-text">{getThemeName()}</span>
      </button>

      {/* Theme info (for development/debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="theme-debug-info">
          <small>
            Mode: {themeMode} | Actual: {actualTheme} | System: {systemTheme} |
            Time: {new Date().getHours()}:00
          </small>
        </div>
      )}

      {children}
    </div>
  );
};

export default ThemeManager;