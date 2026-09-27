import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeMode } from '../types';

interface ThemeToggleProps {
  variant?: 'segmented' | 'compact' | 'button';
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'compact',
  className = '',
  showLabels = false
}) => {
  const { themeMode, setThemeMode, isDark, toggleTheme, showToast } = useApp();

  if (variant === 'button') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => {
          toggleTheme();
          showToast(`Switched to ${!isDark ? 'Dark' : 'Light'} Mode`, 'info');
        }}
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-200 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${className}`}
        title={`Current: ${isDark ? 'Dark Mode' : 'Light Mode'} (Click to toggle)`}
      >
        <div className="relative flex items-center justify-center w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110">
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400 drop-shadow-xs transition-transform duration-300" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500 drop-shadow-xs transition-transform duration-300" />
          )}
        </div>
        <span className="text-xs font-semibold select-none text-slate-800 dark:text-slate-200">
          {isDark ? 'Dark' : 'Light'}
        </span>
        <div className="flex items-center w-7 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full p-0.5 ml-1 transition-colors duration-200">
          <div
            className={`w-2.5 h-2.5 rounded-full bg-white dark:bg-indigo-400 shadow-xs transform transition-transform duration-200 ${
              isDark ? 'translate-x-3.5' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    );
  }

  if (variant === 'segmented') {
    const modes: Array<{ id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
      { id: 'light', label: 'Light', icon: Sun },
      { id: 'dark', label: 'Dark', icon: Moon },
      { id: 'system', label: 'System', icon: Laptop }
    ];

    return (
      <div 
        className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 ${className}`}
        role="group"
        aria-label="Theme mode selector"
      >
        {modes.map(({ id, label, icon: Icon }) => {
          const isActive = themeMode === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setThemeMode(id);
                showToast(`Theme set to ${label}`, 'info');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title={`Switch to ${label} theme`}
            >
              <Icon className={`w-3.5 h-3.5 ${
                isActive && id === 'light' ? 'text-amber-500' :
                isActive && id === 'dark' ? 'text-indigo-400' :
                isActive && id === 'system' ? 'text-cyan-500' : 'text-current'
              }`} />
              {showLabels && <span>{label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // Default compact switch (Light/Dark quick toggle with System indicator)
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => {
          toggleTheme();
          showToast(`Switched to ${!isDark ? 'Dark' : 'Light'} Mode`, 'info');
        }}
        className="group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-200 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        title={`Current: ${themeMode === 'system' ? `System (${isDark ? 'Dark' : 'Light'})` : (isDark ? 'Dark Mode' : 'Light Mode')} - Click to toggle`}
      >
        <div className="relative flex items-center justify-center w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110">
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>

        <span className="text-xs font-semibold select-none text-slate-800 dark:text-slate-200 hidden sm:inline">
          {isDark ? 'Dark' : 'Light'}
        </span>

        {/* Tactile track & thumb */}
        <div className="flex items-center w-7 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full p-0.5 transition-colors duration-200">
          <div
            className={`w-2.5 h-2.5 rounded-full bg-white dark:bg-indigo-400 shadow-xs transform transition-transform duration-200 ${
              isDark ? 'translate-x-3.5' : 'translate-x-0'
            }`}
          />
        </div>
      </button>

      {/* System Sync Indicator / Button */}
      <button
        type="button"
        onClick={() => {
          setThemeMode(themeMode === 'system' ? (isDark ? 'dark' : 'light') : 'system');
          showToast(themeMode === 'system' ? 'Manual theme active' : 'System auto-match active', 'info');
        }}
        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
          themeMode === 'system'
            ? 'border-indigo-400/40 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
        title={themeMode === 'system' ? "System theme sync active (follows OS theme)" : "Click to follow System OS theme automatically"}
        aria-label="Sync with system OS theme"
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
