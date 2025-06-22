
import React from 'react';
import { AppMode } from '../types';

interface NavbarProps {
  currentMode: AppMode;
  onSetMode: (mode: AppMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentMode, onSetMode }) => {
  return (
    <nav className="flex justify-around bg-sky-500 p-2 shadow">
      {(Object.values(AppMode) as AppMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onSetMode(mode)}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors
            ${currentMode === mode 
              ? 'bg-white text-sky-600 shadow-inner' 
              : 'text-white hover:bg-sky-400'
            }`}
        >
          {mode}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;