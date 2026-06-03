import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LeaderboardEntry } from '../types';
import { Trophy, Award, Flame, TrendingUp, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface AnalyticsChartsProps {
  token: string;
  user: any;
  updateTrigger: number;
}

export function AnalyticsCharts({ token, user, updateTrigger }: AnalyticsChartsProps) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Subject allocation pie chart data
  const categoryData = [
    { name: 'Computer Science', value: 4, color: '#2563EB' },
    { name: 'Engineering', value: 3, color: '#14B8A6' },
    { name: 'Sciences', value: 2, color: '#F59E0B' },
    { name: 'Fine Arts', value: 1, color: '#A855F7' }
  ];

  // Daily Study Distribution data
  const studyData = [
    { name: 'Mon', hours: 2.5 },
    { name: 'Tue', hours: 3.8 },
    { name: 'Wed', hours: 1.5 },
    { name: 'Thu', hours: 4.2 },
    { name: 'Fri', hours: 2.0 },
    { name: 'Sat', hours: 5.5 },
    { name: 'Sun', hours: 3.0 }
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [updateTrigger]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLeaders(data.leaderboard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const myRankIdx = leaders.findIndex(l => l.userId === user?.id || l.studentId === user?.studentId || l.name === user?.name);
  const myRank = myRankIdx !== -1 ? myRankIdx + 1 : 1;
  const myLeaderData = myRankIdx !== -1 ? leaders[myRankIdx] : null;

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Upper Stats Row cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Academic Rank</span>
            <span className="text-xl sm:text-2xl font-bold block text-white">#{loading ? ".." : myRank} <span className="text-xs text-slate-400 font-mono">/ {leaders.length}</span></span>
          </div>
          <Trophy className="h-7 w-7 text-amber-400 animate-pulse" />
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Streak Points</span>
            <span className="text-xl sm:text-2xl font-bold block text-blue-400">{myLeaderData ? myLeaderData.streakPoints : (user?.streakPoints || 240)} <span className="text-[10px] text-slate-500 font-mono">pts</span></span>
          </div>
          <Sparkles className="h-7 w-7 text-blue-400" />
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Reading Streak</span>
            <span className="text-xl sm:text-2xl font-bold block text-teal-400">{myLeaderData ? myLeaderData.readingStreak : (user?.readingStreak || 5)} <span className="text-xs text-slate-500 font-mono">days</span></span>
          </div>
          <Flame className="h-7 w-7 text-orange-400 animate-pulse" />
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Active Badges</span>
            <span className="text-xl sm:text-2xl font-bold block text-purple-400">{myLeaderData ? myLeaderData.badgesCount : ((user?.badges || []).length)} <span className="text-xs text-slate-555 text-slate-400 font-mono">earned</span></span>
          </div>
          <Award className="h-7 w-7 text-purple-450 text-purple-400" />
        </div>

      </div>

      {/* Recharts Analytics Diagrams */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Weekly Study hours bar */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 backdrop-blur-md">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-blue-450 text-blue-400 animate-pulse" />
            <span>Weekly Core Study Commitment Hours</span>
          </h3>
          <p className="text-[11.5px] text-slate-300">Hours spent concentrated over key textbook modules during calendar days.</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px' }}
                  labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                  itemStyle={{ color: '#38BDF8', fontSize: 11 }}
                />
                <Bar dataKey="hours" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelves percentage catalog */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 backdrop-blur-md">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-2">
            <Flame className="h-4.5 w-4.5 text-teal-405 text-teal-400 animate-pulse" />
            <span>Catalog Distribution by Academic Categories</span>
          </h3>
          <p className="text-[11.5px] text-slate-300">Visual share representation of textbooks nested on library active shelves.</p>

          <div className="grid sm:grid-cols-12 gap-4 items-center">
            
            {/* Pie drawing */}
            <div className="sm:col-span-7 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '10px' }}
                    itemStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legends row */}
            <div className="sm:col-span-5 space-y-2 text-xs">
              {categoryData.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="min-w-0">
                    <span className="text-slate-300 block font-medium truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">{c.value} books cataloged</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Gamification High Score Active Leaderboard */}
      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl backdrop-blur-md">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300 font-mono mb-4 flex items-center gap-2">
          <Trophy className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
          <span>University Scholar Leaderboard</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-550 text-slate-400">Scanning ranks...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-mono tracking-wider text-slate-300">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Rank</th>
                  <th className="py-3 px-4">Scholar Name</th>
                  <th className="py-3 px-4 text-center">Reading Streak</th>
                  <th className="py-3 px-4 text-center">Score Point</th>
                  <th className="py-3 px-4 rounded-r-xl">Earned Badges Showcase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {leaders.map((lead, idx) => {
                  const place = idx + 1;
                  const isCurrent = lead.name === user?.name;
                  return (
                    <tr
                      key={lead.userId || `lead-${idx}`}
                      className={`hover:bg-white/5 transition ${isCurrent ? 'bg-blue-500/10 font-bold border-l-4 border-l-blue-400' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-sans">
                        {place === 1 ? <span className="p-1 px-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold rounded-lg text-[10px]">🏆 Rank 1</span> :
                         place === 2 ? <span className="p-1 px-2.5 bg-slate-400/10 text-slate-300 border border-slate-400/20 font-bold rounded-lg text-[10px]">🥈 Rank 2</span> :
                         place === 3 ? <span className="p-1 px-2.5 bg-amber-700/10 text-amber-600 border border-amber-700/20 font-bold rounded-lg text-[10px]">🥉 Rank 3</span> :
                         <span className="font-mono text-slate-455 text-slate-405 text-slate-400">Pos #{place}</span>}
                      </td>
                      
                      <td className="py-3.5 px-4 font-sans text-white font-semibold">
                        {lead.name}
                        {isCurrent && <span className="text-[9px] bg-blue-500/20 text-blue-400 font-mono font-bold uppercase rounded ml-2 px-1">YOU</span>}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        <div className="inline-flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-400 animate-pulse" />
                          <span>{lead.readingStreak} days</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-400">
                        {lead.streakPoints} pts
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex flex-wrap gap-1">
                          {lead.badges && lead.badges.map((b: string, bIdx: number) => (
                            <span key={`${b}-${bIdx}`} className="text-[9px] bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded" title={b}>
                              {b.split(' ')[0]} {b}
                            </span>
                          ))}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
