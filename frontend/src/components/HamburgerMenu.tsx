import React, { useState } from 'react';

interface HamburgerMenuProps {
  onShowWineList: () => void;
  onShowAddForm: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onShowWineList, onShowAddForm }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="hamburger-menu">
      <button
        className={`hamburger-button ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="メニュー"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {isOpen && (
        <>
          <div className="menu-overlay" onClick={() => setIsOpen(false)} />
          <div className="menu-dropdown">
            <button
              className="menu-item"
              onClick={() => handleMenuItemClick(onShowAddForm)}
            >
              📝 感想を追加
            </button>
            <button
              className="menu-item"
              onClick={() => handleMenuItemClick(onShowWineList)}
            >
              📋 レビュー一覧
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HamburgerMenu;