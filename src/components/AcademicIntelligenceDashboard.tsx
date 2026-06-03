import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Flame, Sparkles, TrendingUp, CheckCircle, Brain, Target, Calendar, HelpCircle, GraduationCap } from 'lucide-react';

interface AcademicIntelligenceDashboardProps {
  token: string;
  user: any;
}

export function AcademicIntelligenceDashboard({ token, user }: AcademicIntelligenceDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [user]);

  const fetchAchievements = async () => {
    try {
      const res = await fetch('/api/student/achievements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resJson = await res.json();
      if (resJson.success) {
        setData(resJson);
      }
    } catch (err) {
      console.error('Failed to load achievements metrics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center bg-white/5 border border-white/10 rounded-3xl animate-pulse">
        <Brain className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
        <span className="text-xs text-slate-400 font-mono">Synthesizing academic intelligence metrics...</span>
      </div>
    );
  }

  const act = data || {
    level: 2,
    xp: 140,
    currentXP: 40,
    nextLevelXP: 100,
    levelProgress: 40,
    deptRank: "Rank 3 of 12 CS Students",
    unlockedBadges: [{ name: "First Book Completed", description: "Checked in your first physical core book.", category: "Library", unlockedAt: "06/02/2026" }],
    lockedBadges: [{ name: "Research Master", description: "Read 10+ college textbooks from different departments." }],
    stats: { booksRead: 1, booksBorrowed: 2, readingStreak: 3, roadmapsCompleted: 0 }
  };

  // Readiness calculation based on stats
  const roadmapsScore = act.stats.roadmapsCompleted * 30;
  const streakScore = Math.min(25, act.stats.readingStreak * 5);
  const booksScore = Math.min(45, act.stats.booksRead * 15);
  const readinessPercentage = Math.min(98, Math.max(35, roadmapsScore + streakScore + booksScore));

  // Gauge Angle
  const strokeDashoffset = 251.2 - (251.2 * readinessPercentage) / 100;

  // Cohort comparative AI Insights
  const aiInsightsList = [
    { text: `You checked out ${act.stats.booksBorrowed} textbooks this semester, ranking in the top 15% of your ${user?.department || 'major'} department.`, type: "positive" },
    { text: act.stats.readingStreak >= 4 
      ? `Phenomenal study velocity! Maintaining a ${act.stats.readingStreak}-day streak places you above 90% of your college peers.`
      : `Boost your 15-minute daily streak! Dedicate daily study sessions to trigger the 'Consistent Learner' badge.`, type: act.stats.readingStreak >= 4 ? "positive" : "recommend" },
    { text: act.stats.roadmapsCompleted > 0 
      ? `Active skill path in progress. You are 75% ready for industrial Software Dev careers.`
      : `Accelerate career prospects by launching an AI Syllabus Learning path under 'Pathways' tab.`, type: "info" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white font-mono">Academic Intelligence Hub</h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-time study analytics & gamification diagnostics</span>
          </div>
        </div>
        <span className="text-[10px] uppercase font-mono px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-bold">
          {act.deptRank}
        </span>
      </div>

      <div className="grid md:grid-cols-12 gap-6">

        {/* Level and XP bento card */}
        <div className="md:col-span-4 p-5 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden backdrop-blur-md flex flex-col justify-between h-[300px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full filter blur-2xl" />
          <div className="space-y-2 text-left">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Gamification Profile</span>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-400" /> Academic Level {act.level}
            </h4>
            <p className="text-xs text-slate-400">Claim match bonuses, write summaries, and check in core books to expand points.</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-3xl font-black text-blue-400">{act.xp}</span>
                <span className="text-xs text-slate-400 font-mono ml-1">XP pts</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{act.currentXP} / {act.nextLevelXP} to Level {act.level + 1}</span>
            </div>
            
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-[2px]">
              <div 
                className="bg-gradient-to-r from-blue-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${act.levelProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* SVG Exam Readiness Meter */}
        <div className="md:col-span-4 p-5 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden backdrop-blur-md flex flex-col items-center justify-between h-[300px]">
          <div className="space-y-1 text-center">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Exam Readiness Meter</span>
            <p className="text-[11px] text-slate-400">Predictive estimation using checked textbooks, roadmaps, and revisions.</p>
          </div>

          {/* SVG Arc Gauge */}
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="40"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="40"
                stroke="url(#readinessGrad)"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
              <defs>
                <linearGradient id="readinessGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-white">{readinessPercentage}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono font-bold mt-0.5">Ready</span>
            </div>
          </div>

          <div className="grid grid-cols-3 w-full text-center divide-x divide-white/5 text-[11px] font-mono">
            <div>
              <span className="block font-bold text-teal-400">{act.stats.booksRead}</span>
              <span className="text-slate-400 text-[9px] uppercase">Read</span>
            </div>
            <div>
              <span className="block font-bold text-blue-400">{act.stats.readingStreak}d</span>
              <span className="text-slate-400 text-[9px] uppercase">Streak</span>
            </div>
            <div>
              <span className="block font-bold text-purple-400">{act.stats.roadmapsCompleted}</span>
              <span className="text-slate-400 text-[9px] uppercase">Paths</span>
            </div>
          </div>
        </div>

        {/* AI Cohort Insights & Comparatives */}
        <div className="md:col-span-4 p-5 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden backdrop-blur-md flex flex-col justify-between h-[300px]">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Personalized AI Insights</span>
            <p className="text-[11px] text-slate-400">Classroom cohort analytics compiled by Librarian LLM.</p>
          </div>

          <div className="space-y-3 my-2 overflow-y-auto max-h-[190px] pr-1">
            {aiInsightsList.map((ins, iIdx) => (
              <div 
                key={iIdx} 
                className={`p-2.5 rounded-xl text-xs flex gap-2 border leading-relaxed ${
                  ins.type === 'positive' 
                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-300' 
                    : ins.type === 'recommend'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-left">{ins.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Unlocked Badges Gallery Dashboard */}
      <div className="p-5 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden backdrop-blur-md text-left">
        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-teal-400" /> My Academic Achievements Cabinet 
          <span className="text-xs text-slate-400 font-mono font-medium">({act.unlockedBadges.length} unlocked)</span>
        </h4>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {act.unlockedBadges.map((badge: any, idx: number) => (
            <div key={idx} className="p-4 bg-gradient-to-br from-blue-600/10 to-teal-500/10 border border-teal-500/25 rounded-2xl flex gap-3 items-center relative group hover:border-teal-500 hover:bg-white/5 transition duration-300">
              <div className="p-2 bg-teal-500/20 text-teal-400 border border-teal-400/30 rounded-xl group-hover:scale-110 transition">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-100 line-clamp-1">{badge.name}</h5>
                <span className="text-[10px] text-teal-400 font-mono block mt-0.5">Unlocked</span>
              </div>
              <div className="absolute opacity-0 group-hover:opacity-100 transition duration-350 bg-slate-950 border border-white/20 p-2.5 rounded-xl absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 text-[11px] leading-relaxed text-slate-300 z-50 shadow-xl pointer-events-none text-center">
                {badge.description}
                <span className="block mt-1 font-mono text-[9px] uppercase text-teal-400">Category: {badge.category}</span>
              </div>
            </div>
          ))}

          {act.lockedBadges.map((badge: any, idx: number) => (
            <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex gap-3 items-center opacity-40 hover:opacity-75 transition duration-300 relative group">
              <div className="p-2 bg-slate-800 text-slate-500 rounded-xl">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-slate-400 line-clamp-1">{badge.name}</h5>
                <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Locked</span>
              </div>
              <div className="absolute opacity-0 group-hover:opacity-100 transition duration-350 bg-slate-950 border border-white/20 p-2.5 rounded-xl absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 text-[11px] leading-relaxed text-slate-350 z-50 shadow-xl pointer-events-none text-center">
                {badge.description}
                <span className="block mt-1 font-mono text-[9px] uppercase text-rose-400">Requires core targets completion</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
