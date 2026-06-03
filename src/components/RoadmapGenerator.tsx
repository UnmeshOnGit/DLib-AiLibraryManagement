import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Flag, Milestone, Award, CheckCircle2, ChevronRight, 
  ChevronDown, ChevronUp, BookOpen, Clock, Sparkles, 
  RefreshCw, FileText, Check, Play, BookMarked, HelpCircle, 
  Layers, Filter, ArrowRight, Star, Heart, Flame, Shield, Trash2,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Roadmap, RoadmapStage } from '../types';
import { RoadmapMilestoneModal } from './RoadmapMilestoneModal';

interface RoadmapGeneratorProps {
  token: string;
  user: any;
  onUpdateStats: () => void;
  showMessage: (title: string, text: string, type?: 'success' | 'danger') => void;
}

export function RoadmapGenerator({ token, user, onUpdateStats, showMessage }: RoadmapGeneratorProps) {
  // Input triggers
  const [skillInput, setSkillInput] = useState('');
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);

  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  // Search & Filters parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  // Active Milestone Details Modal
  const [selectedStageForModal, setSelectedStageForModal] = useState<any>(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);

  // Custom Diploma Certificate viewer
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeObjective, setResumeObjective] = useState('An engineering sophomore skilled in backend architecture and logic, seeking to specialize in quantitative pipelines.');

  const skillSuggestions = [
    'Python Core',
    'Web Development',
    'Machine Learning',
    'Data Science',
    'UI UX Design',
    'Cloud Computing',
    'Cybersecurity',
    'DevOps Pipelines'
  ];

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async (autoSelectId?: string) => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/roadmaps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRoadmaps(data.roadmaps);
        if (data.roadmaps.length > 0) {
          if (autoSelectId) {
            const match = data.roadmaps.find((r: any) => r.id === autoSelectId);
            if (match) setActiveRoadmap(match);
          } else if (!activeRoadmap) {
            setActiveRoadmap(data.roadmaps[0]);
          } else {
            // keep selection refreshed
            const match = data.roadmaps.find((r: any) => r.id === activeRoadmap.id);
            if (match) setActiveRoadmap(match);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleGenerateRoadmap = async (selectedSkillName: string) => {
    if (!selectedSkillName.trim()) return;
    setLoadingRoadmap(true);
    try {
      const res = await fetch('/api/roadmaps/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skillName: selectedSkillName })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Roadmap generation failed.');
      }
      showMessage("Curriculum Built!", `Curated custom syllabus roadmap for "${selectedSkillName}"`, "success");
      setSkillInput('');
      fetchRoadmaps(data.roadmap.id);
      onUpdateStats();
    } catch (err: any) {
      showMessage("Engine Exception", err.message, "danger");
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string) => {
    if (!window.confirm("Are you sure you want to delete this syllabus roadmap tracker?")) return;
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Syllabus Terminated", "Roadmap tracking data wiped successfully.", "success");
        const remaining = roadmaps.filter(r => r.id !== roadmapId);
        setRoadmaps(remaining);
        if (activeRoadmap?.id === roadmapId) {
          setActiveRoadmap(remaining.length > 0 ? remaining[0] : null);
        }
        onUpdateStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTopicChecked = async (roadmapId: string, topicId: string) => {
    try {
      const res = await fetch(`/api/roadmaps/${roadmapId}/toggle-topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topicId })
      });
      const data = await res.json();
      if (data.success) {
        // Find if active modal stage needs updates
        fetchRoadmaps();
        onUpdateStats();
        
        // Throw quick celebrate message if stage becomes 100% completed
        if (activeRoadmap) {
          const freshRoadmap = roadmaps.find(r => r.id === activeRoadmap.id);
          if (freshRoadmap) {
            const isFinishedBefore = activeRoadmap.progress === 100;
            const isFinishedNow = freshRoadmap.progress === 100;
            if (!isFinishedBefore && isFinishedNow) {
              showMessage("Achievements Unlocked! 🏅", `Incredible! You completed all topics for "${activeRoadmap.skillName}"!`, "success");
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper helper to evaluate stage progress status
  const getStageStatus = (stage: any, index: number, totalStages: number, roadmap: Roadmap) => {
    const stageTopics = stage.topics || [];
    const doneCount = stageTopics.filter((t: any) => (roadmap.completedTopics || []).includes(t.id)).length;
    
    if (stageTopics.length > 0 && doneCount === stageTopics.length) {
      return 'Completed';
    }

    // Is it in progress?
    if (doneCount > 0) {
      return 'In Progress';
    }

    // Is it unlocked?
    if (index === 0) {
      return 'In Progress'; // beginner starts as available/progress
    }

    // Check if previous stage is 100% completed
    const prevStage = roadmap.stages[index - 1];
    if (prevStage) {
      const prevTopics = prevStage.topics || [];
      const prevDoneCount = prevTopics.filter((t: any) => (roadmap.completedTopics || []).includes(t.id)).length;
      if (prevTopics.length > 0 && prevDoneCount === prevTopics.length) {
        return 'Available';
      }
    }

    return 'Locked';
  };

  // Generates smooth coordinates for winding-road S-curve milestones
  const stagesCount = activeRoadmap?.stages?.length || 0;
  const roadHeight = 150 + stagesCount * 180;

  // Render SVG S-curve dynamic path for the learning road
  const generateRoadSvgPath = () => {
    if (stagesCount === 0) return '';
    let d = 'M 400 35';

    for (let i = 0; i < stagesCount; i++) {
      const currY = 110 + i * 180;
      const currX = i % 2 === 0 ? 240 : 560;
      
      const prevY = i === 0 ? 35 : 110 + (i - 1) * 180;
      const prevX = i === 0 ? 400 : (i - 1) % 2 === 0 ? 240 : 560;

      // Handle bezier curve anchors
      const cp1y = prevY + 90;
      const cp2y = currY - 90;

      d += ` C ${prevX} ${cp1y}, ${currX} ${cp2y}, ${currX} ${currY}`;
    }

    // Final finish line point
    const lastY = 110 + (stagesCount - 1) * 180;
    const lastX = (stagesCount - 1) % 2 === 0 ? 240 : 560;
    d += ` C ${lastX} ${lastY + 70}, 400 ${lastY + 110}, 400 ${lastY + 140}`;
    return d;
  };

  // Searching filter logic
  const filteredStages = activeRoadmap?.stages?.map((s, idx) => {
    const status = activeRoadmap ? getStageStatus(s, idx, stagesCount, activeRoadmap) : 'Locked';
    const topics = s.topics || [];
    const doneCount = topics.filter(t => (activeRoadmap?.completedTopics || []).includes(t.id)).length;
    const percent = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0;
    
    return {
      ...s,
      idx,
      status,
      percent,
      topicsCount: topics.length,
      doneCount
    };
  }).filter(s => {
    // Stage search query keyword matching
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.goals || []).some((g: string) => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (s.topics || []).some((t: any) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Level filters
    const levelMatch = selectedLevel === 'all' || 
                        (selectedLevel === 'Beginner' && s.idx === 0) ||
                        (selectedLevel === 'Intermediate' && s.idx === 1) ||
                        (selectedLevel === 'Advanced' && s.idx >= 2);

    // Status filters
    const statusMatch = selectedStatus === 'all' || 
                         (selectedStatus === 'Completed' && s.status === 'Completed') ||
                         (selectedStatus === 'Pending' && s.status !== 'Completed');

    return matchesSearch && levelMatch && statusMatch;
  }) || [];

  const handleCollapseAll = () => {
    setExpandedStages({});
  };

  const handleExpandAll = () => {
    if (!activeRoadmap) return;
    const next: Record<string, boolean> = {};
    activeRoadmap.stages.forEach((s, idx) => {
      next[s.id || idx] = true;
    });
    setExpandedStages(next);
  };

  const toggleExpandStage = (stageId: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  const jumpToCurrentStage = () => {
    if (!activeRoadmap) return;
    // Find first stage that is In Progress or Available
    const currentIdx = activeRoadmap.stages.findIndex((s, idx) => {
      const status = getStageStatus(s, idx, stagesCount, activeRoadmap);
      return status === 'In Progress' || status === 'Available';
    });
    
    const targetIdx = currentIdx !== -1 ? currentIdx : 0;
    const targetStage = activeRoadmap.stages[targetIdx];
    if (targetStage) {
      setSelectedStageForModal(targetStage);
      setSelectedStageIndex(targetIdx);
      showMessage("Syllabus GPS", `Jumping to current study waypoint: ${targetStage.name}`, "success");
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16 text-slate-100 select-none">
      
      {/* Dynamic Splash banner matching color aesthetics */}
      <div className="bg-slate-905 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.04] rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-3 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 font-mono text-[10px] font-bold tracking-widest uppercase">
            <Sparkles className="h-3 w-3 animate-pulse" /> Double-Headed Gemini Syllabus Builder
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white">AI Advanced Skill Roadmaps</h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Prompt anything from frontend libraries, cryptography math, to database operations. Our cognitive server will build a winding chronological 4-stage map paired with real textbooks, checkable learning modules, code labs, and printable degree badges.
          </p>
        </div>

        {/* Input cluster bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="E.g. PySpark Pipelines, Go Microservices, Next.js Frontend..."
            className="block flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:border-emerald-500 focus:ring-0 text-white placeholder-slate-500 text-xs sm:text-sm outline-none transition"
          />
          <button
            onClick={() => handleGenerateRoadmap(skillInput)}
            disabled={loadingRoadmap || !skillInput.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg shadow-blue-500/20"
          >
            {loadingRoadmap ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-amber-400 animate-bounce" />
            )}
            <span>Generate Journey</span>
          </button>
        </div>

        {/* Dynamic quick chips selection row */}
        <div className="mt-5">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block mb-2 font-bold">Fast-track curriculum ideas:</span>
          <div className="flex flex-wrap gap-2">
            {skillSuggestions.map(s => (
              <button
                key={s}
                onClick={() => {
                  setSkillInput(s);
                  handleGenerateRoadmap(s);
                }}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Workspace Panel - 12 Column layout */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* SIDEBAR SUMMARY (Columns 1-3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-5 bg-slate-905 rounded-3xl border border-slate-800/80 space-y-5 text-left shadow-xl">
            <h3 className="text-xs font-serif uppercase tracking-widest text-slate-400 font-bold border-b border-rose-950/20 pb-2">
              My Active Syllabus Trackers
            </h3>
            
            {loadingList ? (
              <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-500 font-mono">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Checking active blueprints...
              </div>
            ) : roadmaps.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-850 text-slate-500 text-xs leading-normal">
                No active learning journey traced yet. Generate a curriculum above to unlock interactive SVG navigation waypoints!
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {roadmaps.map(r => {
                  const isActive = activeRoadmap?.id === r.id;
                  return (
                    <div 
                      key={r.id} 
                      className={`group w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                        isActive 
                          ? 'bg-emerald-600/10 border-emerald-500/50 text-white' 
                          : 'bg-slate-950/40 border-slate-850 text-slate-300 hover:text-white hover:bg-slate-900/40'
                      }`}
                    >
                      <button
                        onClick={() => setActiveRoadmap(r)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <h4 className="text-xs sm:text-sm font-bold truncate leading-tight">{r.skillName}</h4>
                        <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                          <span className="text-slate-500">Progress:</span>
                          <span className="text-emerald-400 font-extrabold">{r.progress}%</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteRoadmap(r.id)}
                        className="p-1.5 bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/50 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer"
                        title="Delete this learning plan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick learning badges statistics */}
          {activeRoadmap && (
            <div className="p-5 bg-slate-905 rounded-3xl border border-slate-800/80 text-left space-y-4 shadow-xl">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold block border-b border-slate-800 pb-2">
                Degree Stamps
              </span>

              {/* Achievement badges showcase */}
              <div className="pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div className={`p-2 rounded-xl flex flex-col items-center justify-center text-center gap-1 border border-slate-800 ${activeRoadmap.progress >= 25 ? 'bg-blue-600/10 border-blue-500/20' : 'opacity-40 bg-slate-950'}`}>
                    <span className="text-lg">🥉</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Beginner badge</span>
                  </div>
                  <div className={`p-2 rounded-xl flex flex-col items-center justify-center text-center gap-1 border border-slate-800 ${activeRoadmap.progress >= 50 ? 'bg-amber-600/10 border-amber-500/20' : 'opacity-40 bg-slate-950'}`}>
                    <span className="text-lg">🥈</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Intermediate stamp</span>
                  </div>
                  <div className={`p-2 rounded-xl flex flex-col items-center justify-center text-center gap-1 border border-slate-800 ${activeRoadmap.progress >= 75 ? 'bg-purple-600/10 border-purple-500/20' : 'opacity-40 bg-slate-950'}`}>
                    <span className="text-lg">🥇</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Advanced seal</span>
                  </div>
                  <div className={`p-2 rounded-xl flex flex-col items-center justify-center text-center gap-1 border border-slate-800 ${activeRoadmap.progress === 100 ? 'bg-emerald-600/10 border-emerald-500/20' : 'opacity-40 bg-slate-950'}`}>
                    <span className="text-lg">🏆</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Degree Master</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INTERACTIVE WINDING ROAD MAP (Columns 4-12) */}
        <div className="lg:col-span-9 space-y-6">
          {activeRoadmap ? (
            <div className="space-y-6">
              
              {/* Header control */}
              <div className="p-5 bg-slate-905 rounded-3xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-extrabold block">
                    Dynamic Learning Journey
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black text-white">{activeRoadmap.skillName} Blueprint</h3>
                </div>
              </div>

              {/* Progress Tracker dashboard with detailed stats */}
              <div className="grid sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-905 rounded-2xl border border-slate-800/80 text-left sm:col-span-2">
                  <div className="flex justify-between font-bold text-xs text-slate-400 mb-2 font-mono">
                    <span>OVERALL PROGRESS COMPLETED</span>
                    <span className="text-emerald-400 font-extrabold">{activeRoadmap.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3.5 overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]" 
                      style={{ width: `${activeRoadmap.progress || 0}%` }} 
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-905 rounded-2xl border border-slate-800/80 text-left flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <span className="text-[10px] text-slate-500 font-mono font-bold block">COMPLETED ITEMS</span>
                    <span className="text-lg font-black text-white">{(activeRoadmap.completedTopics || []).length} modules</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-905 rounded-2xl border border-slate-800/80 text-left flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                    <Flame className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="leading-tight">
                    <span className="text-[10px] text-slate-500 font-mono font-bold block">READING STREAK</span>
                    <span className="text-lg font-black text-white">{user?.readingStreak || 5} days run</span>
                  </div>
                </div>
              </div>

              {/* SEARCH ENGINE & CUSTOM SYLLABUS FILTERS CONTROL BAR */}
              <div className="p-4 bg-slate-905 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search query field */}
                <div className="relative w-full md:max-w-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stage details or topics..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-emerald-500 text-xs sm:text-sm text-slate-105 outline-none outline-0 transition"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                </div>

                {/* Filters selection dropdowns */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  
                  {/* Difficulty selector */}
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="bg-transparent border-none text-[10px] sm:text-xs text-slate-350 outline-none pr-4 font-mono font-bold font-semibold cursor-pointer"
                    >
                      <option className="bg-slate-950 text-slate-300" value="all">levels: all stages</option>
                      <option className="bg-slate-950 text-slate-300" value="Beginner">Beginner core</option>
                      <option className="bg-slate-950 text-slate-300" value="Intermediate">Intermediate core</option>
                      <option className="bg-slate-950 text-slate-300" value="Advanced">Advanced scope</option>
                    </select>
                  </div>

                  {/* Status selector */}
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="bg-transparent border-none text-[10px] sm:text-xs text-slate-350 outline-none pr-4 font-mono font-bold font-semibold cursor-pointer"
                    >
                      <option className="bg-slate-950 text-slate-300" value="all">status: all</option>
                      <option className="bg-slate-950 text-slate-300" value="Completed">Completed tasks</option>
                      <option className="bg-slate-950 text-slate-300" value="Pending">Uncompleted pending</option>
                    </select>
                  </div>

                  {/* Syllabus GPS button */}
                  <button
                    onClick={jumpToCurrentStage}
                    className="px-3.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold font-mono tracking-wide flex items-center gap-1 cursor-pointer transition ml-auto md:ml-0"
                  >
                    🎯 syllabus gps
                  </button>

                  <button
                    onClick={handleExpandAll}
                    className="p-1.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                    title="Expand all topic modules"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    className="p-1.5 bg-slate-950 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
                    title="Collapse all topic modules"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>

                </div>
              </div>

              {/* HIGH FIDELITY WINDING ROADWAY STAGE MAP CONTAINER */}
              <div className="p-6 bg-slate-950/40 rounded-3xl border border-slate-800/80 relative overflow-hidden backdrop-blur-md">
                
                {/* Simulated ambient particle floating dots */}
                <div className="absolute top-1/4 right-[10%] w-1.5 h-1.5 bg-emerald-400/20 rounded-full filter blur-[1px] animate-pulse" />
                <div className="absolute top-1/2 left-[5%] w-2 h-2 bg-blue-400/25 rounded-full filter blur-[1px]" />
                <div className="absolute bottom-1/4 right-[5%] w-2.5 h-2.5 bg-amber-400/20 rounded-full animate-bounce" />

                {/* Roadway SVG and HTML overlapping layer */}
                <div className="relative w-full max-w-[800px] mx-auto min-h-[500px]" style={{ height: `${roadHeight}px` }}>
                  
                  {/* Outer SVG Canvas for road tracks drawing */}
                  <svg 
                    viewBox={`0 0 800 ${roadHeight}`} 
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  >
                    {/* SVG Filters for soft realistic roadmap shadows */}
                    <defs>
                      <filter id="road-glow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#022c22" floodOpacity="0.4" />
                      </filter>
                    </defs>

                    {/* Layer 1: Road Asphalt Ground Track (gray border) */}
                    <path
                      d={generateRoadSvgPath()}
                      stroke="rgba(30, 41, 59, 0.7)"
                      strokeWidth="28"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Layer 2: Concrete Pavement (elegant emerald borders) */}
                    <path
                      d={generateRoadSvgPath()}
                      stroke="#064e3b"
                      strokeWidth="24"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#road-glow)"
                    />

                    {/* Layer 3: Main asphalt road layout */}
                    <path
                      d={generateRoadSvgPath()}
                      stroke="#022c22"
                      strokeWidth="20"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Layer 4: Dashboard yellow divider centerline */}
                    <path
                      d={generateRoadSvgPath()}
                      stroke="#fbbf24"
                      strokeWidth="1.5"
                      strokeDasharray="10,8"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="road-animate-path"
                    />

                    {/* Start Flag & Finish Checkpost texts */}
                    <g transform="translate(400, 35)">
                      <circle r="4" fill="#10b981 animate-pulse" />
                      <text y="-14" textAnchor="middle" fill="#34d399" fontSize="10" className="font-mono font-bold tracking-widest uppercase">START STUDY</text>
                    </g>

                    <g transform={`translate(400, ${roadHeight - 120})`}>
                      <text y="24" textAnchor="middle" fill="#fbbf24" fontSize="10" className="font-mono font-bold tracking-widest uppercase">🎓 CAREER GRADUATION LINE</text>
                    </g>
                  </svg>

                  {/* HTML overlay: interactive milestone waypoints absolute layer */}
                  <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                    {activeRoadmap.stages.map((stage: any, sIdx: number) => {
                      const currY = 110 + sIdx * 180;
                      const currX = sIdx % 2 === 0 ? 240 : 560;

                      // Evaluate dynamic status
                      const status = getStageStatus(stage, sIdx, stagesCount, activeRoadmap);
                      const isLocked = status === 'Locked';
                      const isCompleted = status === 'Completed';
                      const isInProgress = status === 'In Progress';
                      const isAvailable = status === 'Available';

                      // Completion metrics
                      const topics = stage.topics || [];
                      const completedCount = topics.filter((t: any) => (activeRoadmap.completedTopics || []).includes(t.id)).length;
                      const percent = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

                      return (
                        <div
                          key={stage.id || sIdx}
                          style={{
                            position: 'absolute',
                            top: `${currY}px`,
                            left: `${currX}px`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="pointer-events-auto select-none"
                        >
                          <motion.div
                            whileHover={{ scale: 1.12, y: -4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            onClick={() => {
                              setSelectedStageForModal(stage);
                              setSelectedStageIndex(sIdx);
                            }}
                            className={`w-14 h-14 rounded-full border-2 cursor-pointer flex flex-col items-center justify-center relative shadow-2xl transition group ${
                              isCompleted 
                                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-slate-950 shadow-emerald-500/20' :
                              isInProgress 
                                ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 text-white animate-pulse shadow-amber-500/20' :
                              isAvailable 
                                ? 'bg-[#022c22] border-emerald-500/50 text-emerald-400 font-bold hover:bg-emerald-500/10' :
                              'bg-slate-900 border-slate-800 text-slate-600 hover:border-slate-700 cursor-not-allowed'
                            }`}
                          >
                            {/* Inner milestone icon or index indicator */}
                            {isCompleted ? (
                              <Check className="h-6 w-6 stroke-[3.5]" />
                            ) : isLocked ? (
                              <svg className="h-5.5 w-5.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            ) : (
                              <span className="text-sm font-black font-mono">{sIdx + 1}</span>
                            )}

                            {/* Outer glowing pulsing aura if in progress */}
                            {isInProgress && (
                              <div className="absolute inset-[-6px] rounded-full border border-amber-500/30 animate-ping pointer-events-none" />
                            )}

                            {/* Floating waypoint glassmorphism details snippet on hover (Desktop preview) */}
                            <div className="absolute top-[68px] scale-0 group-hover:scale-100 transition duration-200 transform origin-top pointer-events-none bg-slate-905 border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-2xl z-30 w-52 text-left leading-normal space-y-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">
                                STAGE {sIdx + 1} · {stage.name.split(" ")[0]}
                              </span>
                              <h5 className="text-[11.5px] font-extrabold text-white truncate leading-tight">{stage.name}</h5>
                              <p className="text-[10px] text-slate-400 leading-normal line-clamp-1">{topics.length} topics • {percent}% done</p>
                              <div className="flex items-center gap-1.5 pt-1 font-mono text-[9px] font-bold">
                                <span className="text-emerald-400 uppercase">CLICK TO OPEN</span>
                              </div>
                            </div>

                            {/* Side placement descriptive label cards right next to node for dynamic winding view */}
                            <div 
                              style={{
                                position: 'absolute',
                                left: sIdx % 2 === 0 ? '-190px' : '72px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                              }}
                              className={`w-40 sm:w-44 p-3 bg-slate-905/90 rounded-2xl border text-left flex flex-col gap-1 transition ${
                                isCompleted ? 'border-emerald-500/20 shadow-emerald-500/[0.01]' :
                                isInProgress ? 'border-amber-500/35 shadow-amber-500/[0.02]' :
                                'border-slate-850 opacity-60'
                              }`}
                            >
                              <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider block font-bold">
                                STAGE {sIdx + 1}
                              </span>
                              <h6 className="text-[11px] sm:text-xs font-black text-white truncate leading-tight group-hover:text-emerald-400 transition">
                                {stage.name}
                              </h6>
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-0.5 leading-none">
                                <span>{topics.length} lessons</span>
                                <span className={`font-semibold ${isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>{percent}%</span>
                              </div>
                            </div>

                          </motion.div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* SEARCH & FILTERS ACCORDION SYLLABUS LISTS FALLBACK */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-widest text-slate-400 font-mono text-left block">
                  Detailed Curation Checkpoint Panels ({filteredStages.length})
                </h4>

                <div className="space-y-4">
                  {filteredStages.length === 0 ? (
                    <div className="py-12 bg-slate-905 border border-slate-850 rounded-3xl text-slate-500 text-xs italic text-center leading-normal">
                      No matching syllabus milestones found. Clear filters or update keywords search to reveal roadmap checkpoints.
                    </div>
                  ) : (
                    filteredStages.map((s, index) => {
                      const isExpanded = !!expandedStages[s.id || s.idx];
                      return (
                        <div key={s.id || s.idx} className="p-5 bg-slate-905 border border-slate-800/60 rounded-3xl space-y-4 text-left shadow-md">
                          
                          {/* Inner stage panel header control tool */}
                          <div 
                            onClick={() => toggleExpandStage(s.id || s.idx)}
                            className="flex items-center justify-between cursor-pointer group"
                          >
                            <div className="space-y-1 flex-1 min-w-0 pr-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">
                                  Checkpost #{s.idx + 1} • {s.idx % 2 === 0 ? 'Left Track' : 'Right Track'}
                                </span>
                                <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border font-bold ${
                                  s.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  s.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  s.status === 'Available' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  'bg-slate-950/40 text-slate-500 border-slate-850'
                                }`}>
                                  {s.status}
                                </span>
                              </div>
                              <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 truncate group-hover:text-emerald-400 transition">
                                <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                                <span>{s.name} Syllabus</span>
                              </h4>
                            </div>

                            <button className="p-1 px-1.5 bg-slate-950 border border-slate-850 text-slate-400 group-hover:text-white rounded-lg transition shrink-0 cursor-pointer">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </div>

                          {/* Collapsible layout drawer */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-4 pt-3 border-t border-slate-850/60 overflow-hidden"
                              >
                                {s.goals && s.goals.length > 0 && (
                                  <div className="p-3 bg-slate-950/20 rounded-xl border border-slate-850 space-y-1.5">
                                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block">Learning Outcome Checklists:</span>
                                    <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1 leading-relaxed">
                                      {s.goals.map((g: string, gIdx: number) => (
                                        <li key={gIdx}>{g}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Simple Checkpoint interactive items */}
                                <div className="grid md:grid-cols-2 gap-3 pt-1">
                                  {s.topics?.map((topic: any) => {
                                    const isDone = (activeRoadmap.completedTopics || []).includes(topic.id);
                                    return (
                                      <div
                                        key={topic.id}
                                        onClick={() => {
                                          if (s.status === 'Locked') {
                                            showMessage("Lock Constraint", "Prior roadmap stages must be finished completely before tackling this module.", "danger");
                                            return;
                                          }
                                          toggleTopicChecked(activeRoadmap.id, topic.id);
                                        }}
                                        className={`p-3 rounded-2xl border text-left transition select-none flex items-start gap-3 cursor-pointer ${
                                          isDone ? 'bg-blue-600/5 border-blue-500/40 text-slate-100' : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-300'
                                        }`}
                                      >
                                        <button className="shrink-0 mt-0.5" type="button">
                                          {isDone ? (
                                            <Check className="h-4.5 w-4.5 bg-emerald-500 text-slate-950 p-0.5 rounded font-bold" />
                                          ) : (
                                            <div className="h-4.5 w-4.5 rounded border border-slate-600" />
                                          )}
                                        </button>
                                        <div className="space-y-0.5 flex-1 min-w-0">
                                          <h5 className={`text-xs font-bold leading-tight truncate ${isDone ? 'line-through text-slate-400' : ''}`}>{topic.name}</h5>
                                          <p className="text-[10.5px] text-slate-500 leading-normal line-clamp-1">{topic.description}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex justify-end pt-2">
                                  <button
                                    onClick={() => {
                                      setSelectedStageForModal(s);
                                      setSelectedStageIndex(s.idx);
                                    }}
                                    className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-[11px] font-bold font-mono tracking-wide rounded-xl text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1.5 transition"
                                  >
                                    View Full Class Materials & Notes <ArrowRight className="h-3 w-3" />
                                  </button>
                                </div>

                              </motion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-24 text-center bg-slate-90b/10 border border-slate-800/80 rounded-3xl text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
              <Compass className="h-12 w-12 text-slate-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-slate-400 font-bold">No curriculum roadmap planner selected.</p>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">Compose or select a syllabus profile from the side panels selection row to trigger digital S-curve maps.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* DIPLOMA CONFERMENT VIEW CERTIFICATE MODAL */}
      {showCertificateModal && activeRoadmap && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 max-w-2xl w-full shadow-2xl relative space-y-8 flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />
            
            <div className="border-[12px] border-emerald-600/35 p-6 sm:p-10 rounded-2xl bg-slate-950 space-y-6 text-center relative">
              <span className="text-[11px] font-mono tracking-[0.25em] text-emerald-400 uppercase font-bold">DIGITAL DIPLOMA CREDENTIALS</span>
              
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-serif tracking-wide text-white">Smart Hub Chancellery</h3>
                <p className="text-[10px] tracking-wider text-slate-400 font-mono">AUTONOMOUS UNIVERSITY CHANCELLERY</p>
              </div>

              <div className="py-4 space-y-2">
                <p className="text-xs text-slate-400 italic">This digital certificate testifies that student</p>
                <h4 className="text-xl sm:text-2xl font-bold font-serif text-emerald-100">{user?.name || 'Unmesh Sutar'}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mt-2">
                  has successfully passed all structural test milestones for the curriculum syllabus:
                </p>
              </div>

              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/15 max-w-md mx-auto">
                <span className="text-sm font-bold text-emerald-400 block">{activeRoadmap.skillName}</span>
                <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest mt-0.5">Faculty of {user?.department || 'Computer Science'}</span>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-4 text-[10px] font-mono text-slate-500 uppercase border-t border-slate-850/60 max-w-lg mx-auto">
                <div>
                  <span className="block text-slate-300 font-serif lowercase italic text-xs">Vance Eleanor</span>
                  <span className="block border-t border-slate-800/80 mt-1 pt-1">Senior Librarian Signature</span>
                </div>
                <div>
                  <span className="block text-slate-300 font-mono text-[11px]">2026-06-02</span>
                  <span className="block border-t border-slate-800/80 mt-1 pt-1">Date of Conferment</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/15"
              >
                Download PDF / Print
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-755 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PORTFOLIO RESUME CV BUILDER */}
      {showResumeModal && activeRoadmap && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4 text-left">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                <span>Smart CV / Professional Resume Builder</span>
              </h3>
              <p className="text-xs text-slate-400">Assemble an industry-ready template integrating your pre-seeded demographic parameters alongside newly validated roadmaps completed on shelves!</p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Professional Summary Statement</label>
                <textarea
                  value={resumeObjective}
                  onChange={(e) => setResumeObjective(e.target.value)}
                  className="w-full h-18 p-3 bg-slate-950 text-xs border border-slate-800 rounded-xl focus:border-emerald-500 text-slate-200 outline-none"
                />
              </div>

              {/* Live Preview Box */}
              <div className="border border-slate-200 rounded-2xl p-6 bg-white text-slate-900 text-left font-serif space-y-4 leading-normal select-none">
                {/* Header */}
                <div className="text-center border-b border-slate-300 pb-3">
                  <h4 className="text-lg font-bold font-sans tracking-wide uppercase">{user?.name || 'Unmesh Sutar'}</h4>
                  <div className="flex justify-center gap-3 text-[10px] font-sans text-slate-500 font-mono mt-1">
                    <span>{user?.email || 'unmeshsutar33@gmail.com'}</span>
                    <span>•</span>
                    <span>Student ID: {user?.studentId || 'U-2026-9041'}</span>
                  </div>
                </div>

                {/* Objective */}
                <div className="space-y-1 leading-normal">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider block text-slate-500 border-b border-slate-200">Objective</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">{resumeObjective}</p>
                </div>

                {/* Education */}
                <div className="space-y-1">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider block text-slate-500 border-b border-slate-200">Education</span>
                  <div className="flex justify-between text-xs font-sans font-semibold">
                    <strong>University Scholar Space, Dept of {user?.department || 'Computer Science'}</strong>
                    <span>Conferment: Year 2026</span>
                  </div>
                  <p className="text-xs text-slate-600 font-sans">Graduation Year Progress: {user?.year || '3rd Year'}</p>
                </div>

                {/* Validated Skills */}
                <div className="space-y-1">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider block text-slate-500 border-b border-slate-200">Syllabus Tracing & Badges</span>
                  <div className="flex flex-wrap gap-2 pt-1 font-sans">
                    {roadmaps.map(r => (
                      <span key={r.id} className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                        {r.skillName} ({r.progress}% validated)
                      </span>
                    ))}
                    {(user?.badges || []).map((b: string) => (
                      <span key={b} className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                        🏅 {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Print Resume CV
              </button>
              <button
                onClick={() => setShowResumeModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs rounded-xl border border-slate-805 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Book Exam Notes & Preparation overlay drawer modal */}
      {selectedStageForModal && activeRoadmap && (
        <RoadmapMilestoneModal
          stage={selectedStageForModal}
          sIdx={selectedStageIndex}
          status={getStageStatus(selectedStageForModal, selectedStageIndex, stagesCount, activeRoadmap)}
          completedTopics={activeRoadmap.completedTopics || []}
          roadmapId={activeRoadmap.id}
          studentId={user?.id || 'std'}
          onToggleTopic={toggleTopicChecked}
          onClose={() => setSelectedStageForModal(null)}
          showMessage={showMessage}
        />
      )}

    </div>
  );
}
