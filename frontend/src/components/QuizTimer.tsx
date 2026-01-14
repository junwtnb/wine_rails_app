import React, { useRef, useEffect } from 'react';

interface QuizTimerProps {
  timeLeft: number;
  totalTime: number;
  isPlaying: boolean;
  onTimeUp: () => void;
  onTick?: (newTime: number) => void;
}

const QuizTimer: React.FC<QuizTimerProps> = ({
  timeLeft,
  totalTime,
  isPlaying,
  onTimeUp,
  onTick
}) => {
  const timerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const warningPlayedRef = useRef(false);

  // Create audio context for timer sounds (optional)
  useEffect(() => {
    // Initialize audio for timer warnings (you can add actual audio files)
    audioRef.current = new Audio();
  }, []);

  // Handle timer visual effects
  useEffect(() => {
    if (!timerRef.current) return;

    const element = timerRef.current;

    // Add visual effects based on time left
    if (timeLeft <= 5 && timeLeft > 0) {
      element.classList.add('timer-urgent');

      // Play warning sound once when reaching 5 seconds
      if (timeLeft === 5 && !warningPlayedRef.current) {
        // Create a simple beep using Web Audio API
        playWarningSound();
        warningPlayedRef.current = true;
      }
    } else {
      element.classList.remove('timer-urgent');
    }

    if (timeLeft <= 10) {
      element.classList.add('timer-warning');
    } else {
      element.classList.remove('timer-warning');
    }

    // Reset warning flag when timer resets
    if (timeLeft > 25) {
      warningPlayedRef.current = false;
    }

    // Pulse effect on every second
    if (isPlaying && timeLeft > 0) {
      element.classList.add('timer-pulse');
      setTimeout(() => {
        element.classList.remove('timer-pulse');
      }, 200);
    }
  }, [timeLeft, isPlaying]);

  const playWarningSound = () => {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // High pitch beep
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1); // 0.1 second beep
    } catch (e) {
      // Fallback: console beep or no sound
      console.log('🔔 Timer warning: 5 seconds left!');
    }
  };

  // Calculate progress percentage
  const progressPercentage = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  // Format time display
  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={timerRef} className="quiz-timer">
      {/* Circular progress indicator */}
      <div className="timer-circle">
        <svg className="timer-svg" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="timer-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            className="timer-progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={timeLeft <= 5 ? "#ff4444" : timeLeft <= 10 ? "#ff8800" : "#4CAF50"}
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              strokeDasharray: `${2 * Math.PI * 45}`,
              strokeDashoffset: `${2 * Math.PI * 45 * (1 - progressPercentage / 100)}`,
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.3s ease'
            }}
          />
        </svg>

        {/* Time display */}
        <div className="timer-display">
          <span className="timer-number">{timeLeft}</span>
          <span className="timer-unit">秒</span>
        </div>
      </div>

      {/* Additional info */}
      <div className="timer-info">
        <div className="timer-total">
          総経過時間: {formatTime(Math.max(0, totalTime - timeLeft))}
        </div>
        {timeLeft <= 10 && timeLeft > 0 && (
          <div className="timer-warning-text">
            ⚠️ 残り{timeLeft}秒！
          </div>
        )}
        {timeLeft === 0 && (
          <div className="timer-timeout-text">
            ⏰ 時間切れ！
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizTimer;