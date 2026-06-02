import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { School, LogOut, ShieldAlert, Sparkles, HelpCircle, BookOpen, Library } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle";
import LandingPage from "./components/LandingPage";
import StudentDashboard from "./components/StudentDashboard";
import AdminDashboard from "./components/AdminDashboard";
import BrandingSplashScreen from "./components/BrandingSplashScreen";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [showSplash, setShowSplash] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check local preferences
    const saved = localStorage.getItem("dbatu_theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  // Track session on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem("dbatu_session_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("dbatu_session_user");
      }
    }
  }, []);

  // Sync Tailwind Dark Class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("dbatu_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("dbatu_theme", "light");
    }
  }, [isDark]);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    localStorage.setItem("dbatu_session_user", JSON.stringify(loggedInUser));
    setShowSplash(true);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("dbatu_session_user");
  };

  return (
    <div
      id="app-theme-container"
      className="relative min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 transition-colors duration-300 flex flex-col font-sans overflow-x-hidden"
    >
      {/* Decorative organic background blobs for luxury Frosted Glass refractive depth */}
      <div className="absolute top-[10%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-blue-400/10 to-indigo-400/10 dark:from-blue-600/5 dark:to-indigo-650/5 blur-[120px] pointer-events-none -z-10 select-none" />
      <div className="absolute bottom-[15%] right-[-15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-purple-400/10 to-rose-400/10 dark:from-purple-650/5 dark:to-rose-650/5 blur-[120px] pointer-events-none -z-10 select-none" />
      <div className="absolute top-[55%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 dark:from-emerald-600/5 dark:to-cyan-600/5 blur-[120px] pointer-events-none -z-10 select-none" />

      {/* Central Portal Header */}
      {user && (
        <header
          id="app-main-header"
          className="sticky top-0 z-40 bg-white/80 dark:bg-slate-905/80 backdrop-blur-md border-b border-slate-150 dark:border-slate-800 shadow-3xs"
        >
          <div id="header-max-width" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div id="header-logo-group" className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-xs premium-glow-blue border border-white/10">
                <Library className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <span className="text-base font-black tracking-widest block text-slate-900 dark:text-white uppercase font-sans">
                  D-LIB
                </span>
                <span className="text-[9px] text-slate-455 dark:text-slate-300 font-mono tracking-widest block uppercase font-bold">
                  D-LIB
                </span>
              </div>
            </div>

            <div id="header-interactive-controls" className="flex items-center gap-3.5">
              <div id="session-use-badge-or-role" className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                  {user.name} ({user.role === 'admin' ? 'Librarian' : 'Student'})
                </span>
              </div>

              {/* Light/Dark Toggle */}
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />

              <button
                id="logout-action-btn"
                onClick={handleLogout}
                className="p-2.5 rounded-xl border border-rose-100 dark:border-rose-950 text-rose-600 dark:text-rose-400 bg-rose-50/40 hover:bg-rose-50 dark:bg-rose-955/10 hover:text-rose-700 dark:hover:bg-rose-955/40 transition-all flex items-center justify-center cursor-pointer font-bold gap-1.5"
                title="Sign out from Session"
                aria-label="Sign out Button"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span className="text-xs font-bold hidden md:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main id="app-main-view" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          <LandingPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          /* Enforced Modular Dashboard Routing */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {user.role === 'admin' ? (
              <AdminDashboard user={user} onLogout={handleLogout} />
            ) : (
              <StudentDashboard user={user} onLogout={handleLogout} />
            )}
          </motion.div>
        )}
      </main>

      {/* Academic Footer */}
      <footer
        id="app-main-footer"
        className="bg-white dark:bg-slate-905 border-t border-slate-150 dark:border-slate-850 py-6 text-center text-slate-455 dark:text-slate-500 text-[11px] font-sans"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium">
            © 2026 D-LIB Smart Digital Library Ecosystem. All Rights Reserved.
          </p>
          <div className="flex gap-4 font-mono font-semibold tracking-wide uppercase text-[9px]">
            <span>D-LIB CENTRAL SYSTEMS</span>
            <span className="text-slate-300 dark:text-slate-800">|</span>
            <span>INTELLIGENT KNOWLEDGE HUB</span>
          </div>
        </div>
      </footer>

      {/* Cinematic Splash transition Overlay */}
      {showSplash && (
        <BrandingSplashScreen onComplete={() => setShowSplash(false)} />
      )}
    </div>
  );
}
