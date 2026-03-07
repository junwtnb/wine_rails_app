import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 登場アニメーション
    setIsVisible(true);

    // 自動消去タイマー
    const duration = toast.duration || 4000;
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div
      className={`toast-notification toast-${toast.type} ${isVisible ? 'toast-visible' : ''} ${isExiting ? 'toast-exiting' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-text">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-message">{toast.message}</div>
        </div>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="toast-action"
            aria-label={toast.action.label}
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={handleClose}
          className="toast-close"
          aria-label="通知を閉じる"
        >
          ✕
        </button>
      </div>
      <div className="toast-progress">
        <div
          className="toast-progress-bar"
          style={{
            animationDuration: `${toast.duration || 4000}ms`
          }}
        />
      </div>
    </div>
  );
};

export default ToastNotification;