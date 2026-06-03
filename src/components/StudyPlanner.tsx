import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Play, Pause, RotateCcw, Plus, Trash2, CheckSquare, Bell, AlertCircle, RefreshCw, CheckSquare as CheckIcon, Milestone, Target, Trophy } from 'lucide-react';
import { StudyPlannerEvent, ProgressGoal } from '../types';

interface StudyPlannerProps {
  token: string;
  user: any;
  onUpdateStats: () => void;
  showMessage: (title: string, text: string, type?: 'success' | 'danger') => void;
}

export function StudyPlanner({ token, user, onUpdateStats, showMessage }: StudyPlannerProps) {
  const [events, setEvents] = useState<StudyPlannerEvent[]>([]);
  const [goals, setGoals] = useState<ProgressGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [dayOfWeek, setDayOfWeek] = useState('1'); // Monday default
  const [color, setColor] = useState('#2563EB');

  // New Goal State
  const [goalDesc, setGoalDesc] = useState('');
  const [goalTarget, setGoalTarget] = useState('120'); // hours or chapters unit
  const [goalType, setGoalType] = useState<'weekly' | 'monthly'>('weekly');

  // Pomodoro clock details
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSeconds, setPomoSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'rest'>('study');

  const colorOptions = [
    { name: 'Blue', value: '#2563EB' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Amber', value: '#F59E0B' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Rose', value: '#F43F5E' }
  ];

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchPlanner();
    fetchGoals();
  }, []);

  // Pomodoro Interval Timer Loop
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (pomoSeconds > 0) {
          setPomoSeconds(pomoSeconds - 1);
        } else if (pomoMinutes > 0) {
          setPomoMinutes(pomoMinutes - 1);
          setPomoSeconds(59);
        } else {
          // Timer finished!
          clearInterval(interval);
          setTimerActive(false);

          if (timerMode === 'study') {
            showMessage("Study Completed!", "Unbelievable concentration! You earned +15 streak points standard.", "success");
            setTimerMode('rest');
            setPomoMinutes(5); // 5 min break
            setPomoSeconds(0);
            
            // Mock points increment
            awardPoints(15);
          } else {
            showMessage("Break Finished", "Time to dive back into academic textbooks!", "success");
            setTimerMode('study');
            setPomoMinutes(25);
            setPomoSeconds(0);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, pomoSeconds, pomoMinutes, timerMode]);

  const fetchPlanner = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/planner', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.planner);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGoals(data.goals);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          start: startTime,
          end: endTime,
          dayOfWeek: parseInt(dayOfWeek),
          color
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Event Scheduled!", `Added "${title}" to your academic roster checklist.`, "success");
        setTitle('');
        setDescription('');
        fetchPlanner();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/planner/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchPlanner();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleEventCompleted = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/planner/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !currentState })
      });
      const data = await res.json();
      if (data.success) {
        fetchPlanner();
        onUpdateStats();
        if (!currentState) {
          showMessage("Study block verified", "Outstanding study consistency. +10 Points logged.", "success");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalDesc.trim()) return;

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: goalType,
          description: goalDesc,
          targetValue: parseInt(goalTarget)
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Goal Roster Initialized!", "Start tracking study hours daily next.", "success");
        setGoalDesc('');
        fetchGoals();
        onUpdateStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGoalProgress = async (id: string, description: string) => {
    try {
      const res = await fetch(`/api/goals/${id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: 15 }) // Increments baseline by 15 study minutes (e.g. Pomodoro focus units)
      });
      const data = await res.json();
      if (data.success) {
        fetchGoals();
        onUpdateStats();
        showMessage("Target Progress logged", `Progress advanced key parameter for: "${description}"`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchGoals();
        onUpdateStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const awardPoints = async (pointsValue: number) => {
    // Standard mock helper that increases point levels dynamically on study session conclusions
    console.log(`[Points System] Awarded +${pointsValue} for complete Pomodoro concentration.`);
  };

  const formatSeconds = (sec: number): string => {
    return sec < 10 ? `0${sec}` : `${sec}`;
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Visual Stats Bar */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Weekly scheduling blocks */}
        <div className="md:col-span-2 bg-slate-905 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>Weekly Lecture & Review Calendar</span>
          </h2>
          <p className="text-xs text-slate-400">Mark off study times to capture leaderboards. Recurring calendar indices below help you divide subjects.</p>

          <form onSubmit={handleAddEvent} className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-2xl">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">Topic Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 3: MOSFET equations"
                className="w-full bg-slate-950 text-xs px-2.5 py-1.5 border border-slate-800 rounded-xl text-white placeholder-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full bg-slate-950 text-xs px-2.5 py-1.5 border border-slate-800 rounded-xl text-slate-300"
              >
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
                <option value="0">Sunday</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">Slot Color</label>
              <div className="flex gap-1.5 pt-1.5 justify-center">
                {colorOptions.map(opt => (
                  <button
                    type="button"
                    key={opt.name}
                    onClick={() => setColor(opt.value)}
                    className="w-4 h-4 rounded-full transition cursor-pointer shrink-0 border"
                    style={{ backgroundColor: opt.value, borderColor: color === opt.value ? '#FFFFFF' : 'transparent' }}
                    title={opt.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 text-xs px-2.5 py-1.5 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 text-xs px-2.5 py-1.5 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div className="col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Slot Task
              </button>
            </div>
          </form>

          {/* Schedulers display split by columns */}
          {loading ? (
            <div className="text-center text-xs text-slate-500 py-10">Scanning calendars plan...</div>
          ) : events.length === 0 ? (
            <div className="text-center bg-slate-950/20 py-8 text-slate-500 text-xs rounded-2xl border border-slate-850">
              No lecture schedules configured inside planner. Assemble your weeks above!
            </div>
          ) : (
            <div className="grid sm:grid-cols-7 gap-3 pt-2">
              {[1, 2, 3, 4, 5, 6, 0].map(day => {
                const dayEvts = events.filter(e => e.dayOfWeek === day);
                return (
                  <div key={day} className="space-y-2 p-2 bg-slate-950/25 border border-slate-850/60 rounded-xl self-start">
                    <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-slate-400 block border-b border-slate-800/80 pb-1">
                      {weekdayNames[day].slice(0, 3)}
                    </span>

                    {dayEvts.length === 0 ? (
                      <span className="text-[9px] text-slate-600 italic block text-center py-4">free</span>
                    ) : (
                      <div className="space-y-1.5">
                        {dayEvts.map(e => (
                          <div
                            key={e.id}
                            className={`p-2 rounded-lg border text-left flex flex-col justify-between gap-1.5 transition overflow-hidden relative group`}
                            style={{ backgroundColor: `${e.color}12`, borderColor: `${e.color}35` }}
                          >
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-bold text-white leading-normal block line-clamp-2">{e.title}</span>
                              <span className="text-[8px] font-mono block opacity-60 text-slate-400">{e.start} - {e.end}</span>
                            </div>

                            <div className="flex items-center justify-between gap-1 border-t border-slate-800/20 pt-1.5">
                              <button
                                onClick={() => toggleEventCompleted(e.id, e.completed)}
                                className="p-0.5"
                              >
                                <CheckIcon className={`h-3 w-3 ${e.completed ? 'text-teal-400 fill-teal-400/25' : 'text-slate-500 hover:text-white'}`} />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteEvent(e.id)}
                                className="p-0.5 text-slate-600 hover:text-red-400 transition"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* POMODORO DEEP CONCENTRATION CLOCK */}
        <div className="bg-slate-905 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-xl" />

          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-teal-400" />
              <span>Pomodoro Study Optimizer</span>
            </h2>
            <p className="text-xs text-slate-400 leading-normal">Concentrate for 25 mins without distraction. Earn point bonus values on completion.</p>
          </div>

          {/* Visual Round Clock display */}
          <div className="my-6 mx-auto w-40 h-40 rounded-full border-4 border-slate-800 relative flex flex-col items-center justify-center bg-slate-950/60 shadow-inner">
            <div className={`absolute inset-1.5 rounded-full border border-dashed opacity-45 ${timerActive ? 'animate-spin border-blue-500' : 'border-slate-700'}`} />
            
            <span className="text-3xl font-extrabold text-white font-mono tracking-widest">{pomoMinutes}:{formatSeconds(pomoSeconds)}</span>
            <span className="text-[9px] uppercase font-mono mt-1 text-slate-400 font-bold bg-slate-900 border px-2 py-0.5 rounded-full">
              {timerMode === 'study' ? '📖 Study block' : '☕ Relax break'}
            </span>
          </div>

          {/* Control tools */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTimerActive(!timerActive)}
              className={`py-2 text-xs font-semibold rounded-xl text-white transition flex items-center justify-center gap-1 cursor-pointer ${timerActive ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
              {timerActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{timerActive ? 'Pause' : 'Start'}</span>
            </button>
            <button
              onClick={() => {
                setTimerActive(false);
                setPomoMinutes(timerMode === 'study' ? 25 : 5);
                setPomoSeconds(0);
              }}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              onClick={() => {
                setTimerActive(false);
                const nextMode = timerMode === 'study' ? 'rest' : 'study';
                setTimerMode(nextMode);
                setPomoMinutes(nextMode === 'study' ? 25 : 5);
                setPomoSeconds(0);
              }}
              className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              title="Skip Session"
            >
              Skip
            </button>
          </div>
        </div>

      </div>

      {/* Target goals progress tracker */}
      <div className="border-t border-slate-805/50 pt-8 mt-12 grid lg:grid-cols-12 gap-8">
        
        {/* Goals lists */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
            <Milestone className="h-4.5 w-4.5 text-amber-500" />
            <span>Weekly Study Goals & Milestones</span>
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {goals.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-slate-900/10 border border-slate-850 rounded-2xl text-slate-500 text-xs">
                No active target milestones configured. Set targets using form next to progress checking!
              </div>
            ) : (
              goals.map(g => {
                const percent = Math.round((g.currentValue / g.targetValue) * 100);
                return (
                  <div key={g.id} className="p-4 bg-slate-900/35 border border-slate-850 rounded-2xl flex flex-col justify-between gap-4">
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold ${g.type === 'weekly' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          {g.type} goal
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateGoalProgress(g.id, g.description)}
                            disabled={g.completed}
                            className="px-2.5 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold rounded cursor-pointer disabled:opacity-30"
                            title="Add 15 focus minutes tracker"
                          >
                            +15 min focus
                          </button>
                          
                          <button
                            onClick={() => handleDeleteGoal(g.id)}
                            className="text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white pr-6 line-clamp-2">{g.description}</h4>
                    </div>

                    {/* Progress tracking percentages */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Progress: {g.currentValue} / {g.targetValue} min</span>
                        <span className="font-bold text-teal-400">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add goal inputs */}
        <div className="lg:col-span-4 bg-slate-905 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-2">
            <Target className="h-4 w-4 text-theme-secondary text-teal-400" />
            <span>Create Study Goal</span>
          </h3>
          <p className="text-[11px] text-slate-400">Establish study timers targets to keep yourself aligned.</p>

          <form onSubmit={handleAddGoal} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">Goal Topic description</label>
              <input
                type="text"
                required
                value={goalDesc}
                onChange={(e) => setGoalDesc(e.target.value)}
                placeholder="e.g. Complete Chapters 1-4 syllabus summaries"
                className="w-full bg-slate-950 text-xs px-2.5 py-1.5 border border-slate-800 rounded-xl text-white placeholder-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">Goal Interval</label>
              <select
                value={goalType}
                onChange={(e) => setGoalType(e.target.value as any)}
                className="w-full bg-slate-950 text-xs px-2.5 py-1.5 border border-slate-800 rounded-xl text-slate-300 pointer"
              >
                <option value="weekly">Weekly Target Cycle</option>
                <option value="monthly">Monthly Milestone Target</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">Target Minutes Allocation</label>
              <select
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full bg-slate-950 text-xs px-2.5 py-1.5 border border-slate-800 rounded-xl text-slate-300"
              >
                <option value="60">60 Minutes Academic Hold</option>
                <option value="120">120 Minutes Hold</option>
                <option value="300">5 Hours Hold</option>
                <option value="600">10 Hours Master Focus</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 bg-gradient-to-r from-blue-700 to-indigo-600"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-300" /> Start Tracing Goal
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
