/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, LogOut, Bell, Sparkles, User, LayoutDashboard, Compass, Map, Clock, MessageSquare, LineChart, ShieldAlert, CheckSquare, X, Menu, Flame, Award, Sun, Moon } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { AuthSystem } from './components/AuthSystem';
import { LibraryView } from './components/LibraryView';
import { RoadmapGenerator } from './components/RoadmapGenerator';
import { StudyPlanner } from './components/StudyPlanner';
import { ChatbotPanel } from './components/ChatbotPanel';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { AdminDashboard } from './components/AdminDashboard';
import { AppNotification } from './types';
import { AcademicIntelligenceDashboard } from './components/AcademicIntelligenceDashboard';
import { AiAcademicCopilot } from './components/AiAcademicCopilot';
import { LoginSplash } from './components/LoginSplash';

export default function App() {
  const [route, setRoute] = useState<'landing' | 'auth' | 'splash' | 'app'>('landing');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Theme controllers (light vs dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('hub_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('hub_theme', theme);
  }, [theme]);

  // Tablet responsive side drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active student widget tracking
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'roadmaps' | 'planner' | 'chatbot' | 'analytics'>('dashboard');

  // Trigger metrics update loops
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Real-time notifications count
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // DB connection status
  const [dbStatus, setDbStatus] = useState<{ connectionType: string; isMongoActive: boolean } | null>(null);

  // Global flash toast
  const [toast, setToast] = useState<{ title: string; text: string; type: 'success' | 'danger' } | null>(null);

  useEffect(() => {
    // Restore session on Mount if present
    const cachedToken = localStorage.getItem('hub_token');
    const cachedUser = localStorage.getItem('hub_user');
    const cachedRole = localStorage.getItem('hub_role');
    if (cachedToken && cachedUser) {
      setToken(cachedToken);
      const parsedUser = JSON.parse(cachedUser);
      setUser(parsedUser);
      setRole((cachedRole || 'student') as any);
      setRoute('app');
      if (parsedUser.role === 'admin') {
        setActiveTab('analytics');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, []);

  useEffect(() => {
    fetch('/api/db-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDbStatus({
            connectionType: data.connectionType,
            isMongoActive: data.isMongoActive
          });
        }
      })
      .catch(err => console.error('Failed to load db status:', err));
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token, updateTrigger]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAllNotif = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartPortal = (initialRole?: 'student' | 'admin') => {
    if (initialRole) setRole(initialRole);
    setRoute('auth');
  };

  const handleLoginSuccess = (newToken: string, loggedUser: any) => {
    setToken(newToken);
    setUser(loggedUser);
    setRole(loggedUser.role);
    localStorage.setItem('hub_token', newToken);
    localStorage.setItem('hub_user', JSON.stringify(loggedUser));
    localStorage.setItem('hub_role', loggedUser.role);
    
    showToast("Authentication Connected", `Welcome back, ${loggedUser.name}! Dashboard synched.`, "success");
    setRoute('splash');
    
    // Choose starting tab
    if (loggedUser.role === 'admin') {
      setActiveTab('analytics'); // Admin/Librarian lands immediately on approvals & requests panel
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hub_token');
    localStorage.removeItem('hub_user');
    localStorage.removeItem('hub_role');
    showToast("Session disconnected", "Credentails scrubbed from memory caches standard.", "success");
    setRoute('landing');
  };

  const showToast = (title: string, text: string, type: 'success' | 'danger' = 'success') => {
    setToast({ title, text, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const refreshProfileStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('hub_user', JSON.stringify(data.user));
        setUpdateTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`${route === 'app' ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen overflow-x-hidden'} ${theme} ${theme === 'light' ? 'bg-slate-50 text-slate-950' : 'bg-[#0d1325] text-slate-100'} flex flex-col font-sans select-none relative transition-colors duration-350`}>
      
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-amber-500/8 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Toast Alert Box */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-bounce">
          <div className={`p-1.5 rounded-lg shrink-0 ${toast.type === 'success' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-500'}`}>
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-white">{toast.title}</h5>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">{toast.text}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white transition p-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* RENDER MASTER VIEWS */}
      {route === 'landing' && <LandingPage onStart={handleStartPortal} theme={theme} setTheme={setTheme} />}
      
      {route === 'auth' && (
        <AuthSystem
          initialRole={role}
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setRoute('landing')}
        />
      )}

      {route === 'splash' && (
        <LoginSplash
          userName={user?.name}
          theme={theme}
          onComplete={() => setRoute('app')}
        />
      )}

      {route === 'app' && (
        <div className="flex-1 flex h-screen max-h-screen overflow-hidden z-10 relative">
          
          {/* Mobile sidebar overlay backdrop */}
          {sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)} 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" 
            />
          )}

          {/* Dashboard Left Sidebar navigation chassis */}
          <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-[#0d1325] md:bg-white/[0.03] backdrop-blur-md flex flex-col justify-between transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shrink-0 md:relative md:h-screen h-full max-h-screen overflow-hidden`}>
            <div className="p-6 space-y-8 select-none flex-grow overflow-y-auto min-h-0">
              
              {/* Brand Logo Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl shadow-lg shadow-blue-500/10">
                    <BookOpen className="h-5.5 w-5.5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-sm font-extrabold text-white">D-Lib</h1>
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase block font-semibold">Active Session Portal</span>
                  </div>
                </div>

                {/* Mobile direct close button */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-white/5 transition border border-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation button arrays */}
              <nav className="space-y-1.5">
                
                {user?.role === 'student' && (
                  <>
                    <button
                      onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-600/70 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <LayoutDashboard className="h-4.5 w-4.5" />
                      <span>Student Dashboard</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('library'); setSidebarOpen(false); }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'library' ? 'bg-blue-600/70 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Compass className="h-4.5 w-4.5" />
                      <span>Textbook Catalog</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('roadmaps'); setSidebarOpen(false); }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'roadmaps' ? 'bg-blue-600/70 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Map className="h-4.5 w-4.5" />
                      <span>AI Skill Roadmaps</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('planner'); setSidebarOpen(false); }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'planner' ? 'bg-blue-600/70 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Clock className="h-4.5 w-4.5" />
                      <span>Planner & Scheduler</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('chatbot'); setSidebarOpen(false); }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'chatbot' ? 'bg-blue-600/70 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                      <span>Campus Chat AI</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'analytics' ? 'bg-blue-600/70 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <LineChart className="h-4.5 w-4.5" />
                      <span>Scores & Leaderboard</span>
                    </button>
                  </>
                )}

                {user?.role === 'admin' && (
                  <>
                    <button
                      onClick={() => { setActiveTab('analytics'); setSidebarOpen(false); }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'analytics' ? 'bg-blue-600/70 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <CheckSquare className="h-4.5 w-4.5" />
                      <span>Requests & Approvals Desk</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('library'); setSidebarOpen(false); }}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'library' ? 'bg-blue-600/70 text-white shadow-lg shadow-blue-500/20 backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <BookOpen className="h-4.5 w-4.5" />
                      <span>Syllabus Catalogue</span>
                    </button>
                  </>
                )}

              </nav>
            </div>

            {/* Logout panel footer */}
            <div className="p-6 border-t border-white/10 space-y-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3 min-w-0 backdrop-blur-md">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {user?.name?.slice(0, 2) || 'US'}
                </div>
                <div className="min-w-0 leading-tight">
                  <h4 className="text-xs font-bold text-white truncate">{user?.name || 'Unmesh Sutar'}</h4>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">{user?.email || 'student@hub.edu'}</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full py-2 bg-white/5 hover:bg-rose-950/20 text-slate-300 hover:text-rose-400 border border-white/10 hover:border-rose-900/50 font-semibold text-xs rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95"
              >
                <LogOut className="h-4 w-4" /> Disconnect Session
              </button>
            </div>
          </aside>

          {/* Master Panel Right body */}
          <main className="flex-grow flex flex-col min-w-0 bg-transparent overflow-hidden relative">
            
            {/* Header bar section */}
            <header className="h-16 border-b border-white/10 backdrop-blur-md bg-white/[0.03] flex items-center justify-between px-6 shrink-0 z-30">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1 px-1.5 bg-white/10 text-slate-300 hover:text-white rounded-lg md:hidden border border-white/10"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <h2 className={`text-sm sm:text-base font-extrabold tracking-tight ${theme === 'light' ? 'text-slate-800' : 'text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300'}`}>
                  {activeTab === 'dashboard' ? 'Student Workspace' :
                   activeTab === 'library' && user?.role === 'admin' ? 'Librarian Catalog Controls' :
                   activeTab === 'library' ? 'Explore Textbooks Stock' :
                   activeTab === 'roadmaps' ? 'AI Syllabus Builder' :
                   activeTab === 'planner' ? 'Study Tracker & Focus clock' :
                   activeTab === 'chatbot' ? 'Librarian Academic AI' :
                   activeTab === 'analytics' && user?.role === 'admin' ? 'Staff Reports Administration' :
                   'Academic Scoreboards'}
                </h2>
              </div>

              {/* Real-time Notifications dropdown bell & DB badge */}
              <div className="flex items-center gap-3 relative">
                {dbStatus && (
                  <div
                    id="db-status-badge"
                    className={`hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-tight transition ${
                      dbStatus.isMongoActive
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dbStatus.isMongoActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                    <span>DB: {dbStatus.connectionType}</span>
                  </div>
                )}

                {/* Theme Toggle Button (Light vs Dark mode) */}
                <button
                  id="theme-toggle-btn"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition shrink-0 relative cursor-pointer backdrop-blur-md"
                  title={theme === 'light' ? 'Switch to Dark Cyber Theme' : 'Switch to Light Emerald Theme'}
                >
                  {theme === 'light' ? (
                    <Moon className="h-4 w-4 text-slate-700 font-bold" />
                  ) : (
                    <Sun className="h-4 w-4 text-amber-400" />
                  )}
                </button>

                <button
                  id="notifications-bell-btn"
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown) handleReadAllNotif();
                  }}
                  className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition shrink-0 relative cursor-pointer backdrop-blur-md"
                >
                  <Bell className="h-4 w-4 text-slate-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                  )}
                </button>

                {/* Notifications dropdown card visual */}
                {showNotifDropdown && (
                  <div className="absolute right-0 top-12 w-80 bg-slate-905/90 border border-white/15 rounded-3xl p-4 shadow-2xl space-y-4 z-50 backdrop-blur-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold text-white">Alert Messages ({notifications.length})</span>
                      <button
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-[10px] text-slate-400 hover:text-white font-mono"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="text-center text-xs text-slate-500 py-4">No recent academic alerts.</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-left space-y-1 backdrop-blur-md">
                            <span className="text-[10px] font-bold text-blue-400 block">{n.title}</span>
                            <p className="text-[11px] text-slate-300 leading-normal">{n.message}</p>
                            <span className="text-[9px] text-slate-500 block font-mono">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Scrollable primary visual body content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              
              {/* STUDENT WORKSPACE DASHBOARD DEFAULT TAB */}
              {activeTab === 'dashboard' && user?.role === 'student' && (
                <div className="space-y-8 select-none">
                  
                  {/* Big Hero Banner with streak counts */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-teal-500/20 border border-white/20 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full filter blur-3xl pointer-events-none" />
                    
                    <div className="space-y-3 max-w-xl text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-slate-300 backdrop-blur-md">
                        <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
                        <span className="text-xs font-semibold font-mono">My Reading Streak: {user?.readingStreak || 5} days running!</span>
                      </div>
                      <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight text-white leading-tight">Welcome, {user?.name || 'Scholar Student'}</h2>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Track syllabus checklists, build micro-resumes, or query our floating academic librarian bot. Start checking items off to scale academic scores.
                      </p>
                    </div>

                    {/* Quick Streak Score Widget */}
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center shrink-0 w-full md:w-48 text-left space-y-2 relative backdrop-blur-md">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">Total Merit points</span>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-extrabold text-blue-400">{user?.streakPoints || 240}</span>
                        <span className="text-xs text-slate-400 font-mono">pts</span>
                      </div>
                      <span className="text-[11px] text-teal-400 block font-semibold flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> High tier badge active
                      </span>
                    </div>
                  </div>

                  {/* Student Quick links blocks */}
                  <div className="grid md:grid-cols-3 gap-6">
                    
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-white/25 hover:bg-white/10 transition text-left space-y-4 backdrop-blur-md">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-2xl w-fit border border-white/10">
                        <Clock className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white mb-1">Weekly study planner</h4>
                        <p className="text-xs text-slate-400">Configure lecture blocks, review slots, or run focus Pomodoro blocks timers.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('planner')}
                        className="py-1.5 px-4 bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-semibold rounded-lg transition border border-white/10"
                      >
                        Launch scheduler
                      </button>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-white/25 hover:bg-white/10 transition text-left space-y-4 backdrop-blur-md">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-2xl w-fit border border-white/10">
                        <Map className="h-6 w-6 text-teal-400" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white mb-1">AI Syllabus learning pathways</h4>
                        <p className="text-xs text-slate-400">Validate roadmaps parsed with Gemini, claim graduation certificates and diplomas.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('roadmaps')}
                        className="py-1.5 px-4 bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-semibold rounded-lg transition border border-white/10"
                      >
                        Assemble syllabus
                      </button>
                    </div>

                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-white/25 hover:bg-white/10 transition text-left space-y-4 backdrop-blur-md">
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-2xl w-fit border border-white/10">
                        <MessageSquare className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-white mb-1">Grounded chatbot assistant</h4>
                        <p className="text-xs text-slate-400">Explain academic formulas or ask which textbooks are available immediately on shelves.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('chatbot')}
                        className="py-1.5 px-4 bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-semibold rounded-lg transition border border-white/10"
                      >
                        Launch assistant
                      </button>
                    </div>

                  </div>

                  {/* HIGH-FIDELITY ACADEMIC INTELLIGENCE AND PROGRESS ANALYTICS PANEL */}
                  <AcademicIntelligenceDashboard token={token!} user={user!} />

                  {/* COGNITIVE HUB COPILOT COMPANION */}
                  <AiAcademicCopilot token={token!} user={user!} showMessage={showToast} />

                </div>
              )}

              {/* RENDER ACTIVE GENERAL CORE TABS */}
              {activeTab === 'library' && (
                <LibraryView
                  token={token!}
                  user={user!}
                  onUpdateStats={refreshProfileStats}
                  showMessage={showToast}
                />
              )}

              {activeTab === 'roadmaps' && (
                <RoadmapGenerator
                  token={token!}
                  user={user!}
                  onUpdateStats={refreshProfileStats}
                  showMessage={showToast}
                />
              )}

              {activeTab === 'planner' && (
                <StudyPlanner
                  token={token!}
                  user={user!}
                  onUpdateStats={refreshProfileStats}
                  showMessage={showToast}
                />
              )}

              {activeTab === 'chatbot' && (
                <ChatbotPanel token={token!} />
              )}

              {activeTab === 'analytics' && user?.role === 'admin' && (
                <AdminDashboard
                  token={token!}
                  showMessage={showToast}
                />
              )}

              {activeTab === 'analytics' && user?.role === 'student' && (
                <AnalyticsCharts
                  token={token!}
                  user={user!}
                  updateTrigger={updateTrigger}
                />
              )}

            </div>
          </main>
        </div>
      )}

    </div>
  );
}

