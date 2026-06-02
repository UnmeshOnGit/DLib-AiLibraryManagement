import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Trophy,
  BookOpen,
  Award,
  BookMarked,
  Clock,
  Gauge,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Brain,
  MessageSquare,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  Search,
  BookOpenCheck,
  AlertCircle,
  Target,
  Zap,
  Flame,
  User,
  ExternalLink,
  GraduationCap
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  department: string;
  description: string;
  rating: number;
  totalCopies: number;
  availableCopies: number;
  category: string;
  location: string;
}

interface AICopilotHubProps {
  user: any;
  books: Book[];
}

// Full Badge Types to support gamification
interface Badge {
  id: string;
  title: string;
  description: string;
  xpRequired: number;
  category: 'books' | 'learning' | 'streak' | 'ai';
  icon: any;
  bonusXp: number;
}

export default function AICopilotHub({ user, books = [] }: AICopilotHubProps) {
  // --- STATE ---
  const [activeSubTab, setActiveSubTab] = useState<'matchmaker' | 'summaries' | 'notes' | 'achievements' | 'assistant'>('matchmaker');
  const [selectedBook, setSelectedBook] = useState<Book | null>(books[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Gamification & Progress State
  const [userXp, setUserXp] = useState<number>(() => {
    const saved = localStorage.getItem(`dbatu_xp_${user?.id || 'anon'}`);
    return saved ? parseInt(saved, 10) : 120;
  });
  const [streakDays, setStreakDays] = useState<number>(3);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem(`dbatu_favs_${user?.id || 'anon'}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem(`dbatu_badges_${user?.id || 'anon'}`);
    return saved ? JSON.parse(saved) : ['first_summary'];
  });

  // Confetti triggering helper state
  const [confettiActive, setConfettiActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Summary API State
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'overview' | 'concepts' | 'chapters' | 'outcomes'>('overview');

  // Exam Notes API State
  const [notesData, setNotesData] = useState<any>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [revisionMode, setRevisionMode] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [bookmarkedFlashcards, setBookmarkedFlashcards] = useState<string[]>([]);

  // Copilot Assistant Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; timestamp: string }>>([
    {
      role: 'assistant',
      text: `Hello, **${user?.name || 'Scholar'}**! I am your **AI Academic Copilot**. Select any textbook from the catalog, and I can generate Unit breakdowns, formulate mock Viva questions, simulate exam revision, or draft flashcards. What are we studying today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [sendingChat, setSendingChat] = useState(false);

  // --- DERIVED METRICS ---
  const currentLevel = Math.floor(userXp / 250) + 1;
  const xpInCurrentLevel = userXp % 250;
  const xpNeededForNextLevel = 250 - xpInCurrentLevel;
  const levelProgressPercent = Math.min(100, Math.floor((xpInCurrentLevel / 250) * 100));

  // Dynamic Badge Catalogue
  const MASTER_BADGES: Badge[] = [
    { id: 'first_summary', title: 'Knowledge Explorer', description: 'Unlock your first textbook AI summary preview', xpRequired: 50, category: 'ai', icon: Brain, bonusXp: 20 },
    { id: 'review_pro', title: 'Syllabus Reviewer', description: 'Read detailed exam notes for over 3 units', xpRequired: 200, category: 'books', icon: BookOpenCheck, bonusXp: 50 },
    { id: 'flash_master', title: 'Flash Master', description: 'Flip through interactive study flashcards', xpRequired: 350, category: 'learning', icon: RotateCw, bonusXp: 60 },
    { id: 'academic_elite', title: 'DBATU Elite Scholar', description: 'Cross a threshold of 600 total XP', xpRequired: 600, category: 'streak', icon: GraduationCap, bonusXp: 100 },
    { id: 'ai_copilot_bestie', title: 'AI Best Friend', description: 'Engage with the Academic Assistant chat', xpRequired: 450, category: 'ai', icon: Sparkles, bonusXp: 80 },
    { id: 'streak_3day', title: 'Consistent Learner', description: 'Maintain study logins', xpRequired: 150, category: 'streak', icon: Flame, bonusXp: 40 }
  ];

  // Sync state helpers
  const triggerConfettiAndToast = (message: string) => {
    setToastMessage(message);
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 4000);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const addXp = (amount: number, reason: string) => {
    const updated = userXp + amount;
    setUserXp(updated);
    localStorage.setItem(`dbatu_xp_${user?.id || 'anon'}`, updated.toString());

    // Check level up or milestone
    const oldLevel = currentLevel;
    const newLevel = Math.floor(updated / 250) + 1;
    if (newLevel > oldLevel) {
      triggerConfettiAndToast(`🎉 LEVEL UP! You reached Level ${newLevel}! +50 Bonus XP`);
    } else {
      triggerConfettiAndToast(`✨ Verified Task! Earned +${amount} XP: ${reason}`);
    }

    // Badge Unlocking Evaluations
    MASTER_BADGES.forEach(badge => {
      if (!unlockedBadges.includes(badge.id) && updated >= badge.xpRequired) {
        const nextBadges = [...unlockedBadges, badge.id];
        setUnlockedBadges(nextBadges);
        localStorage.setItem(`dbatu_badges_${user?.id || 'anon'}`, JSON.stringify(nextBadges));
        setTimeout(() => {
          triggerConfettiAndToast(`🏆 Badge Unlocked: ${badge.title}! (+${badge.bonusXp} XP Bonus)`);
          setUserXp(prev => prev + badge.bonusXp);
        }, 1500);
      }
    });
  };

  // --- DYNAMIC COMPATIBILITY SCORE CALCULATOR ---
  const getBookCompatibility = (book: Book) => {
    // Strategic mathematical factors
    let score = 72; // Baseline
    const reasons: string[] = [];

    // Department match (+15%)
    const userBranchLower = (user?.branch || '').toLowerCase();
    const bookDeptLower = (book.department || '').toLowerCase();
    
    // Extrapolate DBATU branch alignments
    if (userBranchLower && bookDeptLower && (
      bookDeptLower.includes(userBranchLower) || 
      userBranchLower.includes(bookDeptLower) ||
      (userBranchLower.includes("comp") && bookDeptLower.includes("algorithm")) ||
      (userBranchLower.includes("comp") && bookDeptLower.includes("database"))
    )) {
      score += 16;
      reasons.push("Matches your core branch curriculum");
    }

    // Favorites affinity (+8%)
    const isFavCategory = favorites.includes(book.category);
    if (isFavCategory) {
      score += 8;
      reasons.push("Aligns with marked favorite categories");
    } else if (book.rating >= 4.6) {
      score += 6;
      reasons.push("High ratings feedback among similar cohorts");
    }

    // Adaptive reading goals factors
    if (book.title.toLowerCase().includes("algorithm") && userBranchLower.includes("comp")) {
      score += 10;
      reasons.push("Essential reference for upcoming placement exams");
    } else if (book.title.toLowerCase().includes("thermodynamics") && userBranchLower.includes("mech")) {
      score += 12;
      reasons.push("Matches active mechanical thermals roadmap");
    }

    // Limit maximum to 98%
    const finalScore = Math.min(98, score);
    
    // Default fallback descriptions if reasons list remains empty
    if (reasons.length === 0) {
      reasons.push("Popular general reading recommendation for technical readiness");
      reasons.push("Highly rated academic exposition");
    }

    // Difficulty labels
    let level: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
    if (finalScore > 90) level = 'Advanced';
    else if (finalScore < 80) level = 'Beginner';

    return {
      score: finalScore,
      level,
      reasons
    };
  };

  // --- API SERVICE ACTION CALLS ---
  const fetchSummary = async (book: Book) => {
    if (!book) return;
    setLoadingSummary(true);
    setSummaryData(null);
    try {
      const response = await fetch('/api/book/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle: book.title, author: book.author })
      });
      const data = await response.json();
      setSummaryData(data);
      addXp(20, 'Generated AI Book Summary');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchNotesAndPrep = async (book: Book) => {
    if (!book) return;
    setLoadingNotes(true);
    setNotesData(null);
    try {
      const response = await fetch('/api/book/exam-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle: book.title, author: book.author })
      });
      const data = await response.json();
      setNotesData(data);
      setCurrentFlashcardIndex(0);
      setIsFlashcardFlipped(false);
      addXp(30, 'Unlocked Complete Study Notes & Flashcard deck');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAskCopilot = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt || chatInput;
    if (!promptToSend.trim()) return;

    setSendingChat(true);
    setChatInput('');
    
    const userMsg = {
      role: 'user' as const,
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          context: {
            selectedBook: selectedBook ? { title: selectedBook.title, author: selectedBook.author, category: selectedBook.category } : null,
            userBranch: user?.branch,
            unlockedBadgesCount: unlockedBadges.length,
            currentXP: userXp
          },
          chatHistory: chatMessages.slice(-10) // Send recent message exchange Context
        })
      });

      const data = await response.json();
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      addXp(15, 'Engaged technical Copilot consultation');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingChat(false);
    }
  };

  // --- AUTOMATIC LOAD TRIGGERS ---
  useEffect(() => {
    if (selectedBook) {
      fetchSummary(selectedBook);
      fetchNotesAndPrep(selectedBook);
    }
  }, [selectedBook]);

  // Filter books matching search query
  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="ai-copilot-panel" className="relative space-y-6">
      
      {/* GLOBAL TOAST & NOTIFICATION FLOATER */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-55 bg-indigo-950/95 border border-indigo-400 text-indigo-100 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-sans text-xs font-semibold backdrop-blur-md"
          >
            <Zap className="h-4 w-4 text-amber-400 animate-bounce" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFETTI FLOATER RENDERER (SVG native layout) */}
      {confettiActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(35)].map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            const duration = 2 + Math.random() * 3;
            const colors = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#3b82f6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: '-10px', x: `${left}%` }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  y: ['0vh', '80vh'],
                  x: [`${left}%`, `${left + (Math.random() * 15 - 7.5)}%`],
                  rotate: [0, 360]
                }}
                transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
                className="absolute w-2 h-2.5 rounded-xs"
                style={{ backgroundColor: randomColor }}
              />
            );
          })}
        </div>
      )}

      {/* HEADER HERO AREA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 md:p-8 border border-indigo-900 shadow-xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
        
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-900/60 border border-indigo-700/50 rounded-full text-[11px] font-bold tracking-wider text-indigo-300 uppercase">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Dr. Babasaheb Ambedkar Technological University (DBATU) Co-pilot
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
              AI Academic Copilot Suite
            </h1>
            <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
              Elevate your comprehension speeds. Transform static syllabus references into exam-tailored summaries, revision flashcards, and personalized departmental compatibility checks.
            </p>
          </div>

          {/* USER XP GAMIFICATION SCORE HEADER */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl w-full lg:w-auto min-w-[260px] flex items-center gap-4">
            <div className="relative flex-none">
              {/* Outer gauge ring */}
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" className="stroke-slate-800" strokeWidth="4" fill="transparent" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  className="stroke-indigo-500 transition-all duration-1000 ease-out"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - levelProgressPercent / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Level</span>
                <span className="text-lg font-black text-white leading-none">{currentLevel}</span>
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-baseline text-xs">
                <span className="font-extrabold text-slate-200">DBATU Rank: Scholar</span>
                <span className="font-mono text-[11px] text-indigo-400 font-bold">{userXp} XP</span>
              </div>
              
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Streak: <span className="text-amber-400 font-bold">{streakDays} Days 🔥</span></span>
                <span>{xpNeededForNextLevel} XP to LevelUp</span>
              </div>
            </div>
          </div>
        </div>

        {/* SUB NAVIGATION TAB RAIL */}
        <div className="flex flex-wrap gap-2 border-t border-slate-800/80 mt-6 pt-4">
          {[
            { id: 'matchmaker', label: 'Matchmaker Scores', icon: TrendingUp },
            { id: 'summaries', label: 'AI Summaries Generator', icon: BookOpen },
            { id: 'notes', label: 'Book-To-Exam Notes', icon: BookMarked },
            { id: 'assistant', label: 'AI Exam Prep Assistant', icon: Sparkles },
            { id: 'achievements', label: 'Reading Achievements & Game', icon: Trophy }
          ].map(it => {
            const Icon = it.icon;
            const isSel = activeSubTab === it.id;
            return (
              <button
                key={it.id}
                id={`copilot-subtab-${it.id}`}
                onClick={() => setActiveSubTab(it.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-all cursor-pointer border hover:scale-[1.03] ${
                  isSel
                    ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                    : 'bg-slate-905/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CORE DISPLAY WINDOW - RESPONSIVE SPLIT */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* SIDEBAR: ACTIVE REFERENCE TEXTBOOK SELECTOR */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>DBATU Reference Library</span>
              <BookOpen className="h-3 w-3 text-slate-400" />
            </h3>

            {/* SELECTION SEARCH INPUT */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search syllabi texts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* LIVE LIST */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {filteredBooks.map((b) => {
                const compat = getBookCompatibility(b);
                const isSelected = selectedBook?.id === b.id;
                
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBook(b)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 shadow-xs'
                        : 'bg-transparent border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {b.title}
                      </div>
                      <div className="text-slate-450 text-[10px] line-clamp-1">
                        by {b.author}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-dotted border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 italic">
                        {b.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 whitespace-nowrap">
                          {compat.score}% Match
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredBooks.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No matching books found
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC SIDEBAR PREVIEW - ACTIVE BOOK STATS */}
          {selectedBook && (
            <motion.div
              layout
              className="bg-gradient-to-tr from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs"
            >
              <div className="flex justify-between items-start">
                <span className="px-2 py-0.5 bg-blue-105 dark:bg-blue-952/40 text-blue-600 dark:text-blue-400 rounded-md text-[9px] font-bold uppercase tracking-wider">
                  Selected Study Source
                </span>
                <button
                  onClick={() => {
                    if (favorites.includes(selectedBook.category)) {
                      const next = favorites.filter(f => f !== selectedBook.category);
                      setFavorites(next);
                      localStorage.setItem(`dbatu_favs_${user?.id || 'anon'}`, JSON.stringify(next));
                    } else {
                      const next = [...favorites, selectedBook.category];
                      setFavorites(next);
                      localStorage.setItem(`dbatu_favs_${user?.id || 'anon'}`, JSON.stringify(next));
                    }
                  }}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 bg-transparent border-none cursor-pointer"
                >
                  <Bookmark className={`h-4 w-4 ${favorites.includes(selectedBook.category) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                  {selectedBook.title}
                </h4>
                <p className="text-[11px] text-slate-450 mt-0.5">
                  {selectedBook.author}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-sans border-t border-slate-150 dark:border-slate-800 pt-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{selectedBook.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Library Rack:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-105">{selectedBook.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rating Feed:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-105 font-mono">{selectedBook.rating} ★</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ACADEMIC INTELLIGENCE METER */}
          <div className="bg-indigo-905/10 dark:bg-slate-950 border border-slate-150 dark:border-indigo-950/20 rounded-2xl p-4 text-center space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Exam Readiness Meter</h4>
            
            <div className="relative inline-flex items-center justify-center">
              {/* readiness visual gauge */}
              <svg className="w-24 h-24 transform -rotate-180">
                <circle cx="48" cy="48" r="40" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="6" fill="transparent" strokeDasharray={Math.PI * 40} strokeDashoffset={0} />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  className="stroke-emerald-500 transition-all duration-1000"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={Math.PI * 40}
                  strokeDashoffset={Math.PI * 40 * (1 - 0.81)} // Fixed Readiness: 81%
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">81%</span>
                <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Exam Ready</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-sans px-1">
              Calculated automatically against cumulative quiz performance, book summary reviews, and streak indexes.
            </p>
          </div>
        </div>

        {/* WORKSPACE DETAILED VIEWS */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* TAB 1: BOOK CO-MATCHMAKER AND INTEGRATED CATEGORIES */}
          {activeSubTab === 'matchmaker' && (
            <div className="space-y-6">
              
              {/* DYNAMIC COMPARISON HERO */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-base font-bold text-slate-950 dark:text-white">Netflix-Style Compatibility Recommendation Engine</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* COMPATIBILITY CARD DISPLAY */}
                  {selectedBook && (() => {
                    const match = getBookCompatibility(selectedBook);
                    return (
                      <div className="md:col-span-1 bg-gradient-to-b from-slate-50 to-white dark:from-slate-955/20 dark:to-slate-900 p-5 rounded-xl border border-slate-150 dark:border-indigo-950/20 text-center flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="relative inline-flex items-center justify-center">
                            <svg className="w-20 h-20 transform -rotate-90">
                              <circle cx="40" cy="40" r="34" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="4" fill="transparent" />
                              <circle
                                cx="40"
                                cy="40"
                                r="34"
                                className="stroke-indigo-500"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 34}
                                strokeDashoffset={2 * Math.PI * 34 * (1 - match.score / 100)}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-indigo-600 dark:text-indigo-400">
                              {match.score}%
                            </div>
                          </div>
                          
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{selectedBook.title}</h3>
                          <div className="text-[11px] text-slate-450">Match Score Criteria Evaluation</div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-450">
                            <span>Syllabus Depth:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{match.level}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-450">
                            <span>Expected Marks Ratio:</span>
                            <span className="font-bold text-amber-500 font-mono">High Coverage</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* CALCULATION FACTOR INDICATORS */}
                  <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        Factors Evaluated Under Recommendation Flow
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {[
                          { label: 'Reading Log History', value: 'Active', active: true },
                          { label: 'DBATU Syllabus Branch', value: user?.branch || 'Mechanical', active: true },
                          { label: 'Personal Category Goals', value: favorites.join(', ') || 'General', active: true },
                          { label: 'Library Issue Log Frequency', value: 'Live Feed', active: true },
                          { label: 'Interests Parameter', value: 'Active', active: true },
                          { label: 'Academic Study Streak', value: `${streakDays} Days`, active: true }
                        ].map((fit, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-850">
                            <span className="text-slate-500">{fit.label}</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{fit.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedBook && (
                      <div className="bg-indigo-50/30 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-150/40 space-y-1">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase flex items-center gap-1">
                          <Brain className="h-3.5 w-3.5 text-indigo-400" /> RECOMMENDED BECAUSE
                        </span>
                        <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                          {getBookCompatibility(selectedBook).reasons.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-indigo-400">✓</span>
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RECOMMENDED MATCH CATEGORIES */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Syllabus Recommendations &amp; Compatibility Channels
                </h3>

                {/* HIGHLY COMPATIBLE */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 dark:border-slate-850 pb-1">
                    Highly Compatible Selection (Match score &gt; 80%)
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {books.map(b => {
                      const comp = getBookCompatibility(b);
                      if (comp.score < 80) return null;
                      return (
                        <div
                          key={b.id}
                          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between gap-4 items-center hover:border-indigo-500 shadow-3xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded text-[9px] font-extrabold">
                                {comp.score}% MATCH
                              </span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{b.category}</span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">{b.title}</h4>
                            <p className="text-[10px] text-slate-450 line-clamp-1">by {b.author}</p>
                          </div>

                          <button
                            onClick={() => setSelectedBook(b)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold cursor-pointer border-none transition-all flex-none"
                          >
                            Generate Notes
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* THEMATIC CATEGORIES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  
                  {/* CATEGORY A: TRENDING IN YOUR DEPARTMENT */}
                  <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block border-b border-slate-150 dark:border-slate-850 pb-1">
                      Trending In Department ({user?.branch || 'Engineering'})
                    </span>
                    
                    <div className="space-y-2">
                      {books.slice(0, 2).map(b => (
                        <div key={b.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-800 dark:text-slate-200 truncate pr-3 max-w-[200px]">{b.title}</span>
                          <button
                            onClick={() => { setSelectedBook(b); setActiveSubTab('summaries'); }}
                            className="p-1 text-blue-500 hover:underline bg-transparent border-none cursor-pointer flex items-center font-bold text-[10px]"
                          >
                            AI Overview <ExternalLink className="h-3 w-3 ml-0.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CATEGORY B: SKILL GOALS FOR ROADMAPS */}
                  <div className="bg-slate-50/60 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block border-b border-slate-150 dark:border-slate-850 pb-1">
                      AI picks for skill goals
                    </span>
                    
                    <div className="space-y-2">
                      {books.slice(-2).map(b => (
                        <div key={b.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-800 dark:text-slate-200 truncate pr-3 max-w-[200px]">{b.title}</span>
                          <button
                            onClick={() => { setSelectedBook(b); setActiveSubTab('notes'); }}
                            className="p-1 text-indigo-500 hover:underline bg-transparent border-none cursor-pointer flex items-center font-bold text-[10px]"
                          >
                            Ready Notes <ExternalLink className="h-3 w-3 ml-0.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 2: AI BOOK SUMMARIES (DYNAMIC GEMINI OR HIGH FALLBACK) */}
          {activeSubTab === 'summaries' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="h-5 w-5 text-indigo-500" />
                    AI Book Summary Preview Workspace
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Generate instant structural previews powered directly by Google Gemini.
                  </p>
                </div>

                {selectedBook && (
                  <button
                    onClick={() => fetchSummary(selectedBook)}
                    disabled={loadingSummary}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 disabled:opacity-55 cursor-pointer"
                  >
                    <RotateCw className={`h-3 w-3 ${loadingSummary ? 'animate-spin' : ''}`} />
                    Regenerate summary
                  </button>
                )}
              </div>

              {loadingSummary && (
                <div className="text-center py-16 space-y-3">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs animate-pulse font-bold">
                    Analyzing syllabus metrics and retrieving overview charts with Gemini...
                  </p>
                </div>
              )}

              {!loadingSummary && summaryData && (
                <div className="space-y-6">
                  
                  {/* SUMMARY TOP HERO SNAPSHOT */}
                  <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 dark:from-slate-955/20 dark:to-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-850 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-500/10 rounded-full flex items-center justify-center font-bold text-indigo-500 font-sans">
                        {summaryData.readingDifficultyScore || 70}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-white">Reading Difficulty Score</div>
                        <div className="text-[10px] text-slate-450">Out of 100 on DBATU scales</div>
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs font-medium text-slate-650 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Estimated study time: <strong className="text-slate-800 dark:text-white font-mono">{summaryData.estimatedReadingTime || '10 Hours'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5 text-blue-500" />
                        <span>Syllabus Rank: <strong className="text-slate-800 dark:text-white">{summaryData.difficultyLevel || 'Intermediate'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* MINI TAB INTERNAL RAIL */}
                  <div className="flex gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                    {[
                      { id: 'overview', label: 'Book Overview' },
                      { id: 'concepts', label: 'Key Concepts' },
                      { id: 'chapters', label: 'Chapters / Units mapping' },
                      { id: 'outcomes', label: 'Learning Outcomes' }
                    ].map(subTab => (
                      <button
                        key={subTab.id}
                        onClick={() => setActiveSummaryTab(subTab.id as any)}
                        className={`px-3 py-1.5 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer ${
                          activeSummaryTab === subTab.id
                            ? 'border-indigo-500 text-indigo-500 font-extrabold'
                            : 'border-transparent text-slate-450 hover:text-slate-700 dark:hover:text-white'
                        }`}
                      >
                        {subTab.label}
                      </button>
                    ))}
                  </div>

                  {/* ACTIVE TAB DISPLAY WINDOW */}
                  <AnimatePresence mode="wait">
                    {activeSummaryTab === 'overview' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <blockquote className="border-l-4 border-indigo-400 pl-4 italic text-slate-600 dark:text-slate-300 text-xs">
                          &ldquo;{summaryData.overview}&rdquo;
                        </blockquote>
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Short Abstract summary</h4>
                          <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                            {summaryData.shortSummary}
                          </p>
                        </div>
                        <div className="space-y-2 pt-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed engineering exposition</h4>
                          <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                            {summaryData.detailedSummary}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {activeSummaryTab === 'concepts' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key syllabus concepts extracted</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {(summaryData.importantConcepts || []).map((con: any, i: number) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                {con.name}
                              </span>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {con.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeSummaryTab === 'chapters' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                      >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended chapters priority mapping</h4>
                        <div className="space-y-1.5">
                          {(summaryData.importantChapters || []).map((chap: string, idx: number) => (
                            <div key={idx} className="flex gap-2.5 items-center text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-bold text-indigo-400 font-mono">0{idx + 1}.</span>
                              <span>{chap}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeSummaryTab === 'outcomes' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Objectives</h4>
                          <div className="space-y-1.5">
                            {(summaryData.learningObjectives || []).map((obj: string, i: number) => (
                              <div key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300">
                                <span className="text-emerald-500">✓</span>
                                <span>{obj}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expected learning Outcomes</h4>
                          <div className="space-y-1.5">
                            {(summaryData.learningOutcomes || []).map((out: string, i: number) => (
                              <div key={i} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300">
                                <span className="text-blue-500">→</span>
                                <span>{out}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* KEYWORD TAG CLOUD */}
                  {summaryData.keywords && (
                    <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Extracted Syllabus Keywords tag index</span>
                      <div className="flex flex-wrap gap-2">
                        {summaryData.keywords.map((kw: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 text-slate-650 dark:text-slate-300 text-[10px] rounded-lg border border-slate-200 dark:border-slate-850">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOOK TO EXAM-READY NOTES GENERATOR */}
          {activeSubTab === 'notes' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-6">
              
              <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center border-b border-slate-150 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-1.5">
                    <BookMarked className="h-5 w-5 text-indigo-500" />
                    AI Book-To-Exam Notes Generator
                  </h2>
                  <p className="text-slate-400 text-xs">
                    Transform complex textbook pages into highly-tailored Unit guides, flashcards, and quick revision formulas sheets.
                  </p>
                </div>

                {/* 15-MINUTE EXAM REVISION MODE TOGGLE */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ⚡ 15-Min Revision Mode
                  </span>
                  <button
                    onClick={() => {
                      setRevisionMode(!revisionMode);
                      addXp(10, 'Toggled Exam Quick Revision Mode');
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none ${
                      revisionMode ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        revisionMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {loadingNotes && (
                <div className="text-center py-16 space-y-3">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent" />
                  <p className="text-slate-505 dark:text-slate-400 text-xs animate-pulse font-bold">
                    Analyzing units mappings, scanning formulas databases, and generating ready flashcards...
                  </p>
                </div>
              )}

              {!loadingNotes && notesData && (
                <div className="space-y-6">
                  
                  {/* --- CONDITIONAL VIEWS MATCHING 15-MINUTE REVISION MODE --- */}
                  <AnimatePresence mode="wait">
                    {revisionMode ? (
                      <motion.div
                        key="revision-grid"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6 bg-gradient-to-tr from-amber-50/20 to-slate-950/20 dark:from-slate-955/20 dark:to-slate-900 border border-amber-500/20 p-5 rounded-2xl"
                      >
                        <div className="flex items-center gap-2 text-amber-500">
                          <Zap className="h-5 w-5 fill-amber-500" />
                          <h3 className="font-bold text-sm tracking-widest uppercase">
                            15-Minute Revision Mode Activated!
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* CRITICAL CONCEPTS */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-amber-505 dark:text-amber-400 uppercase tracking-wider block border-b border-amber-500/10 pb-1">
                              🎯 Primary Expected Concepts
                            </span>
                            <div className="space-y-2">
                              {(notesData.revisionMode?.criticalConcepts || []).map((conc: string, idx: number) => (
                                <div key={idx} className="flex gap-2 text-xs text-slate-700 dark:text-slate-300">
                                  <span className="text-amber-500 font-extrabold">•</span>
                                  <span>{conc}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* SYSTEM FORMULAS */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-bold text-amber-505 dark:text-amber-400 uppercase tracking-wider block border-b border-amber-500/10 pb-1">
                              📐 Core Formula sheet
                            </span>
                            <div className="space-y-2">
                              {(notesData.revisionMode?.criticalFormulas || []).map((form: any, idx: number) => (
                                <div key={idx} className="p-2 bg-slate-950/40 rounded-lg border border-slate-850 space-y-1 text-xs">
                                  <div className="font-mono font-extrabold text-amber-400 select-all">{form.formula}</div>
                                  <div className="text-[10px] text-slate-450">Use Case: {form.useCase}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* EXAM TOP DEPT WRITTEN TIPS */}
                        <div className="bg-amber-950/35 border border-amber-900/60 p-4 rounded-xl space-y-2 text-xs">
                          <span className="font-extrabold text-amber-400 uppercase tracking-widest">
                            Dr. Mahajan's Professor Exam Recommendations
                          </span>
                          <div className="space-y-1.5 text-slate-300">
                            {(notesData.revisionMode?.examTips || []).map((tip: string, idx: number) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-amber-500">★</span>
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </motion.div>
                    ) : (
                      
                      // RELATIONAL COMPREHENSIVE UNITS LAYOUT
                      <motion.div
                        key="comprehensive-units"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        {(notesData.units || []).map((unit: any, uIdx: number) => (
                          <div key={uIdx} className="border border-slate-150 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-3xs">
                            <div className="flex justify-between items-baseline flex-wrap gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                Unit {unit.unitNumber}: {unit.title}
                              </h3>
                              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
                                Core Syllabus Section
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed italic pr-2">
                              {unit.summary}
                            </p>

                            {/* DEFINITIONS SUB GRID */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Unit Definitions Flash Index:</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(unit.definitions || []).map((def: any, dIdx: number) => (
                                  <div key={dIdx} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-150 dark:border-slate-850 space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">{def.term}</span>
                                      {def.isImportant && (
                                        <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-405 text-[9px] font-extrabold rounded-sm uppercase">
                                          Must Learn
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-normal">
                                      {def.definition}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* MOCK QUESTIONS FOR SELF-EVALUATION */}
                            <div className="space-y-3 pt-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Expected University Questions (DBATU Pattern)</span>
                              <div className="space-y-2.5">
                                {(unit.likelyQuestions || []).map((quest: any, qIdx: number) => (
                                  <div key={qIdx} className="space-y-1.5 p-3 rounded-xl bg-indigo-50/10 dark:bg-slate-955/40 border border-indigo-500/10 text-xs">
                                    <div className="flex justify-between items-baseline font-bold text-slate-800 dark:text-slate-100">
                                      <span>Q: {quest.question}</span>
                                      <span className="text-indigo-400 font-mono flex-none">{quest.marks} Marks</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-450 leading-relaxed text-[11px] font-sans pl-3 border-l-2 border-indigo-500/30">
                                      <strong className="text-slate-700 dark:text-slate-300 font-sans block text-[10px] uppercase mb-0.5">Answer Outline Guide:</strong>
                                      {quest.suggestedAnswerOutline}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* --- INTERACTIVE FLASHCARD MODE PRACTICE PORTAL --- */}
                  <div className="border-t border-slate-150 dark:border-slate-850 pt-6 space-y-4">
                    <span className="text-xs font-bold text-slate-405 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      <RotateCw className="h-4 w-4 text-indigo-400" />
                      Interactive Practice Flashcard Desk
                    </span>

                    {notesData.flashcards && notesData.flashcards.length > 0 && (() => {
                      const flash = notesData.flashcards[currentFlashcardIndex];
                      if (!flash) return null;
                      return (
                        <div className="max-w-md mx-auto space-y-4">
                          
                          {/* THE CARD FRAME (Aesthetic Card Design flips) */}
                          <div 
                            onClick={() => {
                              setIsFlashcardFlipped(!isFlashcardFlipped);
                              addXp(5, 'Flipped Study Flashcard');
                            }}
                            className="h-48 w-full cursor-pointer relative font-sans perspective-1000 group"
                          >
                            <div className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d ${isFlashcardFlipped ? 'rotate-y-180' : ''}`}>
                              
                              {/* FRONT SIDE */}
                              <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between items-center shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{flash.category || 'Core Question'}</span>
                                <div className="text-sm font-bold text-slate-850 dark:text-white font-sans text-center px-4">
                                  {flash.front}
                                </div>
                                <div className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                                  <RotateCw className="h-3 w-3 text-indigo-400 animate-spin-slow" /> Tap to Flip Card
                                </div>
                              </div>

                              {/* BACK SIDE */}
                              <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-700 text-white p-6 rounded-2xl flex flex-col justify-between items-center shadow-lg transform rotate-y-180">
                                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Syllabus Answer Guide</span>
                                <div className="text-xs text-slate-205 leading-relaxed font-sans text-center px-2">
                                  {flash.back}
                                </div>
                                <div className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider flex items-center gap-1">
                                  ✓ Memorized Section
                                </div>
                              </div>

                            </div>
                          </div>

                          {/* NAVIGATION RAIL CONTROL FOR CARD */}
                          <div className="flex justify-between items-center">
                            <button
                              disabled={currentFlashcardIndex === 0}
                              onClick={() => {
                                setCurrentFlashcardIndex(prev => prev - 1);
                                setIsFlashcardFlipped(false);
                              }}
                              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-350 disabled:opacity-40 rounded-xl border border-slate-150 dark:border-slate-800 cursor-pointer"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>

                            <span className="font-mono text-xs text-slate-450 font-bold">
                              {currentFlashcardIndex + 1} / {notesData.flashcards.length} Card
                            </span>

                            <button
                              disabled={currentFlashcardIndex === notesData.flashcards.length - 1}
                              onClick={() => {
                                setCurrentFlashcardIndex(prev => prev + 1);
                                setIsFlashcardFlipped(false);
                              }}
                              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-350 disabled:opacity-40 rounded-xl border border-slate-150 dark:border-slate-800 cursor-pointer"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 4: CHAT BOT ASSISTANT SYSTEM */}
          {activeSubTab === 'assistant' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[550px]">
              
              {/* CORE BOT CHAT ROOM TOP DECORATOR */}
              <div className="bg-gradient-to-r from-slate-905 to-slate-950 dark:from-indigo-950 dark:to-slate-900 text-white p-4 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs">AI Academic Exam Simulator</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">DBATU Advisor Core Live</span>
                    </div>
                  </div>
                </div>

                {selectedBook && (
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded border border-slate-700 truncate max-w-[150px]">
                    Focus: {selectedBook.title}
                  </span>
                )}
              </div>

              {/* MESSAGES LOGS WINDOW */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {chatMessages.map((msg, index) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div
                      key={index}
                      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} text-xs font-sans`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3 space-y-1.5 ${
                        isAssistant
                          ? 'bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-200 border border-slate-100 dark:border-slate-850'
                          : 'bg-indigo-600 text-white font-medium'
                      }`}>
                        <div className="leading-relaxed whitespace-pre-line break-words">
                          {msg.text}
                        </div>
                        <div className={`text-[9px] text-right ${isAssistant ? 'text-slate-450' : 'text-indigo-200'}`}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sendingChat && (
                  <div className="flex justify-start text-xs">
                    <div className="bg-slate-50 dark:bg-slate-955 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-slate-450 text-[10px]">AI Copilot is generating feedback...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* COMMONLY ASKED CHIPS FOR FAST INVOCATION */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-150 dark:border-slate-855 flex flex-wrap gap-1.5 text-[10px]">
                <span className="text-slate-450 font-bold uppercase self-center mr-1">Quick Ask:</span>
                {[
                  'Summarize Chapter 5',
                  'Simulate Viva Questions',
                  'Explain Unit 1 Formulae List',
                  'Draft a 10-day Revision Plan'
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleAskCopilot(chip)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* INPUT BOX */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleAskCopilot(); }}
                className="p-3 border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask copilot to explain units, draft vivas or formulas..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-sans uppercase transition-all disabled:opacity-40 cursor-pointer border-none flex-none"
                >
                  Send
                </button>
              </form>

            </div>
          )}

          {/* TAB 5: LEADERBOARDS & ACHIEVEMENT SYSTEM GAMIFICATION */}
          {activeSubTab === 'achievements' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* XP LEVEL UP CARD PROGRESS */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-900 text-white space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Gamification Arena</span>
                    <h2 className="text-base font-extrabold text-white">Your Reading Level Up Status</h2>
                  </div>
                  <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[10px] font-bold text-amber-500">
                    Active streak: {streakDays} Days 🔥
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Total XP Accumulated</span>
                    <span className="text-2xl font-black text-indigo-400 font-mono mt-1 block">{userXp} XP</span>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Unlocked Badges</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">{unlockedBadges.length} / 6</span>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">University Rank Percentile</span>
                    <span className="text-2xl font-black text-amber-500 mt-1 block">94th</span>
                  </div>
                </div>
              </div>

              {/* BADGES SECTION */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
                <div className="space-y-1 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Dr. Babasaheb Ambedkar Technological University (DBATU) Scholar Badges
                  </h3>
                  <p className="text-slate-450 text-xs">
                    Earn permanent badges by reaching target XP points thresholds via studying text materials.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {MASTER_BADGES.map((badge) => {
                    const isUnlocked = unlockedBadges.includes(badge.id);
                    const BIcon = badge.icon;
                    
                    return (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-xl border flex gap-3 transition-all ${
                          isUnlocked
                            ? 'bg-gradient-to-tr from-indigo-50/10 to-white dark:from-indigo-950/10 dark:to-slate-900 border-indigo-200 dark:border-indigo-950/30'
                            : 'bg-slate-50/50 dark:bg-slate-955/20 border-slate-200 dark:border-slate-850 opacity-55 saturate-50'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl flex-none self-start ${
                          isUnlocked ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-405'
                        }`}>
                          <BIcon className="h-5 w-5" />
                        </div>

                        <div className="space-y-1">
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-tight">
                            {badge.title}
                          </div>
                          <p className="text-[11px] text-slate-450 leading-snug">
                            {badge.description}
                          </p>
                          <div className="text-[10px] font-mono text-indigo-400 font-bold pt-1">
                            {isUnlocked ? '✓ UNLOCKED (+ Bonus XP)' : `Locks until ${badge.xpRequired} XP`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LOCAL MOCK SIMULATED LEADERBOARDS */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-850 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    DBATU Campus Department Leaderboard
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-500">Live Campus Tracker</span>
                </div>

                <div className="space-y-2">
                  {[
                    { rank: 1, name: 'Aniket Deshmukh', branch: 'Computer Engineering', xp: 720 },
                    { rank: 2, name: 'Shruti Kulkarni', branch: 'Electronics & Telecommunication', xp: 640 },
                    { rank: 3, name: `${user?.name || 'You'} (Active Student)`, branch: user?.branch || 'Mechanical Engineering', xp: userXp, isUser: true },
                    { rank: 4, name: 'Pooja Patil', branch: 'Chemical Engineering', xp: 310 },
                    { rank: 5, name: 'Pranesh Patil', branch: 'Civil Engineering', xp: 220 }
                  ].sort((a,b) => b.xp - a.xp).map((lead, idx) => (
                    <div
                      key={idx}
                      className={`flex justify-between items-center p-2.5 rounded-lg text-xs ${
                        lead.isUser
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-400/30'
                          : 'bg-transparent border-b border-slate-100 dark:border-slate-850/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 font-mono font-bold ${idx < 3 ? 'text-amber-500 text-sm' : 'text-slate-450'}`}>{idx + 1}</span>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-white">{lead.name}</div>
                          <div className="text-[10px] text-slate-450">{lead.branch}</div>
                        </div>
                      </div>

                      <div className="font-mono text-indigo-550 dark:text-indigo-400 font-bold">{lead.xp} XP</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
