import React, { useEffect, useState, useRef, useCallback } from 'react';

interface UserActivityTrackerProps {
  onActivityChange?: (isActive: boolean, activityData: ActivityData) => void;
  showStats?: boolean;
}

interface ActivityData {
  totalTimeActive: number;
  totalTimeInactive: number;
  mouseMovements: number;
  keyboardEvents: number;
  clicks: number;
  scrollEvents: number;
  lastActiveTime: Date;
  sessionStartTime: Date;
  focusEvents: number;
  blurEvents: number;
}

const UserActivityTracker: React.FC<UserActivityTrackerProps> = ({
  onActivityChange,
  showStats = false
}) => {
  const [isActive, setIsActive] = useState(true);
  const [activityData, setActivityData] = useState<ActivityData>(() => ({
    totalTimeActive: 0,
    totalTimeInactive: 0,
    mouseMovements: 0,
    keyboardEvents: 0,
    clicks: 0,
    scrollEvents: 0,
    lastActiveTime: new Date(),
    sessionStartTime: new Date(),
    focusEvents: 0,
    blurEvents: 0
  }));

  const lastActiveTimeRef = useRef(new Date());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previousActivityStateRef = useRef(true);

  // Configuration
  const INACTIVITY_THRESHOLD = 30000; // 30 seconds
  const ACTIVITY_CHECK_INTERVAL = 1000; // 1 second

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    lastActiveTimeRef.current = new Date();

    if (!isActive) {
      setIsActive(true);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setIsActive(false);
    }, INACTIVITY_THRESHOLD);
  }, [isActive]);

  // Track mouse movements
  useEffect(() => {
    const handleMouseMove = () => {
      setActivityData(prev => ({
        ...prev,
        mouseMovements: prev.mouseMovements + 1,
        lastActiveTime: new Date()
      }));
      resetInactivityTimer();
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [resetInactivityTimer]);

  // Track keyboard events
  useEffect(() => {
    const handleKeyPress = () => {
      setActivityData(prev => ({
        ...prev,
        keyboardEvents: prev.keyboardEvents + 1,
        lastActiveTime: new Date()
      }));
      resetInactivityTimer();
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [resetInactivityTimer]);

  // Track clicks
  useEffect(() => {
    const handleClick = () => {
      setActivityData(prev => ({
        ...prev,
        clicks: prev.clicks + 1,
        lastActiveTime: new Date()
      }));
      resetInactivityTimer();
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [resetInactivityTimer]);

  // Track scroll events
  useEffect(() => {
    const handleScroll = () => {
      setActivityData(prev => ({
        ...prev,
        scrollEvents: prev.scrollEvents + 1,
        lastActiveTime: new Date()
      }));
      resetInactivityTimer();
    };

    document.addEventListener('scroll', handleScroll);
    return () => document.removeEventListener('scroll', handleScroll);
  }, [resetInactivityTimer]);

  // Track window focus/blur events
  useEffect(() => {
    const handleFocus = () => {
      setActivityData(prev => ({
        ...prev,
        focusEvents: prev.focusEvents + 1,
        lastActiveTime: new Date()
      }));
      resetInactivityTimer();
    };

    const handleBlur = () => {
      setActivityData(prev => ({
        ...prev,
        blurEvents: prev.blurEvents + 1
      }));
      setIsActive(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [resetInactivityTimer]);

  // Track time spent active/inactive
  useEffect(() => {
    activityTimerRef.current = setInterval(() => {
      setActivityData(prev => {
        if (isActive) {
          return {
            ...prev,
            totalTimeActive: prev.totalTimeActive + 1
          };
        } else {
          return {
            ...prev,
            totalTimeInactive: prev.totalTimeInactive + 1
          };
        }
      });
    }, ACTIVITY_CHECK_INTERVAL);

    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, [isActive]);

  // Initial inactivity timer setup
  useEffect(() => {
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // Notify parent component of activity changes
  useEffect(() => {
    if (previousActivityStateRef.current !== isActive && onActivityChange) {
      onActivityChange(isActive, activityData);
    }
    previousActivityStateRef.current = isActive;
  }, [isActive, activityData, onActivityChange]);

  // Save activity data to localStorage periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const activitySession = {
        timestamp: new Date().toISOString(),
        ...activityData,
        isActive
      };

      const sessions = JSON.parse(localStorage.getItem('user-activity-sessions') || '[]');
      sessions.push(activitySession);

      // Keep only last 10 sessions
      if (sessions.length > 10) {
        sessions.splice(0, sessions.length - 10);
      }

      localStorage.setItem('user-activity-sessions', JSON.stringify(sessions));
    }, 60000); // Save every minute

    return () => clearInterval(saveInterval);
  }, [activityData, isActive]);

  // Page visibility API integration
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsActive(false);
      } else {
        resetInactivityTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [resetInactivityTimer]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const getEngagementLevel = (): string => {
    const totalTime = activityData.totalTimeActive + activityData.totalTimeInactive;
    const activePercentage = totalTime > 0 ? (activityData.totalTimeActive / totalTime) * 100 : 0;

    if (activePercentage >= 80) return '🔥 非常にアクティブ';
    if (activePercentage >= 60) return '⚡ アクティブ';
    if (activePercentage >= 40) return '👍 普通';
    if (activePercentage >= 20) return '😴 少し非アクティブ';
    return '💤 非アクティブ';
  };

  if (!showStats) {
    return null; // Hidden tracker
  }

  return (
    <div className={`user-activity-tracker ${isActive ? 'active' : 'inactive'}`}>
      <div className="activity-status">
        <div className="status-indicator">
          <span className="status-icon">
            {isActive ? '👁️' : '😴'}
          </span>
          <span className="status-text">
            {isActive ? 'アクティブ' : '非アクティブ'}
          </span>
        </div>
        <div className="engagement-level">
          {getEngagementLevel()}
        </div>
      </div>

      <div className="activity-stats">
        <div className="stat-item">
          <strong>アクティブ時間:</strong> {formatTime(activityData.totalTimeActive)}
        </div>
        <div className="stat-item">
          <strong>マウス移動:</strong> {activityData.mouseMovements.toLocaleString()}回
        </div>
        <div className="stat-item">
          <strong>キー入力:</strong> {activityData.keyboardEvents.toLocaleString()}回
        </div>
        <div className="stat-item">
          <strong>クリック:</strong> {activityData.clicks.toLocaleString()}回
        </div>
        <div className="stat-item">
          <strong>スクロール:</strong> {activityData.scrollEvents.toLocaleString()}回
        </div>
        <div className="stat-item">
          <strong>セッション開始:</strong> {activityData.sessionStartTime.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default UserActivityTracker;