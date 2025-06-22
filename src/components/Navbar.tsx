
import React from 'react';
import { AppMode } from '../types';

interface NavbarProps {
  currentMode: AppMode;
  onSetMode: (mode: AppMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentMode, onSetMode }) => {
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '0.5rem', backgroundColor: '#e0e0e0' }}>
      {(Object.values(AppMode) as AppMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onSetMode(mode)}
          style={{ 
            padding: '0.5rem 1rem', 
            border: currentMode === mode ? '2px solid blue' : '1px solid #ccc',
            fontWeight: currentMode === mode ? 'bold' : 'normal'
          }}
        >
          {mode}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;