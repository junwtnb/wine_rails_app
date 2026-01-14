import React, { useState, useEffect } from 'react';

interface NetworkStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
  showNotification?: boolean;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({
  onStatusChange,
  showNotification = true
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  // Track network status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date());

      if (wasOffline) {
        // Show reconnection message
        if (showNotification) {
          showNotificationMessage('🌐 インターネット接続が復旧しました！', 'success');
        }
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);

      if (showNotification) {
        showNotificationMessage('⚠️ インターネット接続が切断されました', 'warning');
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, showNotification]);

  // Monitor connection type (if available)
  useEffect(() => {
    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          setConnectionType(connection.effectiveType || 'unknown');
        }
      }
    };

    updateConnectionInfo();

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', updateConnectionInfo);

        return () => {
          connection.removeEventListener('change', updateConnectionInfo);
        };
      }
    }
  }, []);

  // Periodic connection check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to fetch a small resource to verify actual connectivity
        await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
          mode: 'no-cors'
        });

        if (!isOnline) {
          // We were offline but the fetch succeeded
          setIsOnline(true);
          setLastOnlineTime(new Date());
        }
      } catch {
        if (isOnline) {
          // We were online but the fetch failed
          setIsOnline(false);
          setWasOffline(true);
        }
      }
    };

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Notify parent component of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(isOnline);
    }
  }, [isOnline, onStatusChange]);

  // Save network events to localStorage for analytics
  useEffect(() => {
    const networkEvent = {
      timestamp: new Date().toISOString(),
      isOnline,
      connectionType,
      userAgent: navigator.userAgent
    };

    const events = JSON.parse(localStorage.getItem('network-events') || '[]');
    events.push(networkEvent);

    // Keep only last 50 events
    if (events.length > 50) {
      events.splice(0, events.length - 50);
    }

    localStorage.setItem('network-events', JSON.stringify(events));
  }, [isOnline, connectionType]);

  const showNotificationMessage = (message: string, type: 'success' | 'warning' | 'error') => {
    // Create and show a temporary notification
    const notification = document.createElement('div');
    notification.className = `network-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#F44336'};
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const getStatusIcon = () => {
    if (isOnline) {
      switch (connectionType) {
        case '4g':
          return '📶';
        case '3g':
          return '📶';
        case '2g':
          return '📱';
        case 'slow-2g':
          return '📶';
        default:
          return '🌐';
      }
    }
    return '🔌';
  };

  const getStatusText = () => {
    if (isOnline) {
      return connectionType !== 'unknown'
        ? `オンライン (${connectionType.toUpperCase()})`
        : 'オンライン';
    }
    return 'オフライン';
  };

  const formatLastOnlineTime = () => {
    if (!lastOnlineTime) return '';

    const now = new Date();
    const diff = now.getTime() - lastOnlineTime.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '1分以内前にオンライン';
    if (minutes < 60) return `${minutes}分前にオンライン`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前にオンライン`;

    const days = Math.floor(hours / 24);
    return `${days}日前にオンライン`;
  };

  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="status-indicator">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>

      {!isOnline && (
        <div className="offline-info">
          <div className="offline-message">
            一部の機能が制限されている可能性があります
          </div>
          {lastOnlineTime && (
            <div className="last-online">
              {formatLastOnlineTime()}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default NetworkStatus;