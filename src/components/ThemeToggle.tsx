import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  id?: string;
}

export default function ThemeToggle({ isDark, onToggle, id }: ThemeToggleProps) {
  return (
    <button
      id={id || "theme-toggle-btn"}
      onClick={onToggle}
      className="relative flex h-8 w-14 items-center rounded-full bg-slate-205 dark:bg-slate-800 p-1 cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-1 focus:ring-blue-700/30"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Theme Toggle Button"
    >
      <div
        className={`h-6 w-6 rounded-full bg-white dark:bg-slate-900 shadow-xs flex items-center justify-center transition-transform duration-300 transform ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
    </button>
  );
}
