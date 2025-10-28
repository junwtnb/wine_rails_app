import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'white' | 'dark';
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'medium', color = 'white' }) => {
  return (
    <div className={`spinner spinner-${size} spinner-${color}`}>
      <div className="spinner-circle"></div>
    </div>
  );
};

export default Spinner;