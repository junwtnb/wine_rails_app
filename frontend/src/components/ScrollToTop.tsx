import React, { useState, useEffect, useRef } from 'react';

interface ScrollToTopProps {
  threshold?: number;
  smoothBehavior?: boolean;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  threshold = 300,
  smoothBehavior = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const toggleVisibility = () => {
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Show button immediately when scrolling down
      if (window.pageYOffset > threshold) {
        setIsVisible(true);
      } else {
        // Hide button with slight delay when scrolling up
        scrollTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 150);
      }
    };

    const handleScroll = () => {
      toggleVisibility();
    };

    // Add event listener
    window.addEventListener('scroll', handleScroll);

    // Keyboard shortcut (Home key or Ctrl/Cmd + ↑)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Home' ||
          ((event.ctrlKey || event.metaKey) && event.key === 'ArrowUp')) {
        event.preventDefault();
        scrollToTop();

        // Give visual feedback by briefly focusing the button
        if (buttonRef.current && isVisible) {
          buttonRef.current.focus();
          setTimeout(() => buttonRef.current?.blur(), 200);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [threshold, isVisible]);

  const scrollToTop = () => {
    if (smoothBehavior) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  if (!isVisible) return null;

  return (
    <button
      ref={buttonRef}
      onClick={scrollToTop}
      className="scroll-to-top"
      title="ページトップへ戻る (Home キー)"
      aria-label="ページトップへ戻る"
    >
      <span className="scroll-icon">↑</span>
      <span className="scroll-text">TOP</span>
    </button>
  );
};

export default ScrollToTop;