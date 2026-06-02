import React, { useState, useEffect, useRef } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Lock, BookOpen, Check, ExternalLink, Bookmark, FileText, 
  Sparkles, Clock, Flame, Zap, Award, Search, X, ChevronDown, 
  ChevronUp, Play, Trophy, HelpCircle, ArrowRight, BookMarked
} from "lucide-react";
import { UserRoadmap, RoadmapStage } from "../types";

// Dynamic Status calculation helper
export type StageStatus = 'Locked' | 'Available' | 'In Progress' | 'Completed';

export interface AugmentedStage extends RoadmapStage {
  id: string;
  stageNumber: number;
  level: string;
  duration: string;
  completion: number;
  status: StageStatus;
  isBookmarked: boolean;
  notes: string;
}

interface RoadmapVisualizationProps {
  roadmap: UserRoadmap;
  onToggleTopic: (roadmapId: string, stageName: string, topicId: string) => void;
  onMarkStageComplete?: (stageName: string, completed: boolean) => void;
}

// Inline Canvas celebration confetti generator to avoid external dependency issues
const ConfettiCelebration: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const colors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    const particles: {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }[] = [];

    // Create particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * width,
        y: -10 - Math.random() * 50,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 5 - 2.5
      });
    }

    let startTime = Date.now();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw each particle
      particles.forEach((p, idx) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Apply wind-like noise
        p.speedX += Math.sin(p.y / 20) * 0.05;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        
        // Rectangular particles
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.5);
        ctx.restore();

        // Wrap around bottom
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
      });

      // Terminate after 4 seconds
      if (Date.now() - startTime < 4200) {
        animationFrameId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-1000 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  );
};

export const RoadmapVisualization: React.FC<RoadmapVisualizationProps> = ({
  roadmap,
  onToggleTopic,
  onMarkStageComplete
}) => {
  // Navigation & filter criteria
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isExpandedAll, setIsExpandedAll] = useState(false);

  // Focus & detail modals
  const [activeModalStage, setActiveModalStage] = useState<AugmentedStage | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const [showNotesEditor, setShowNotesEditor] = useState<string | null>(null);
  
  // Track system bookmarks and notes locally
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("roadmap_bookmarks");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("roadmap_notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Confetti triggering states
  const [confettiActive, setConfettiActive] = useState(false);
  const [completedCache, setCompletedCache] = useState<Record<string, boolean>>({});

  // Helper properties to estimate stage features
  const getStageDuration = (stageName: string): string => {
    switch (stageName) {
      case "Beginner": return "2-3 Weeks";
      case "Intermediate": return "3-4 Weeks";
      case "Advanced": return "4-5 Weeks";
      default: return "2 Weeks";
    }
  };

  // Build complete augmented list of stages
  const augmentedStages: AugmentedStage[] = roadmap.stages.map((st, idx) => {
    const totalTopics = st.topics.length;
    const completedTopics = st.topics.filter(t => t.completed).length;
    const completionPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    // Status calculation
    let status: StageStatus = 'Locked';
    if (idx === 0) {
      status = completionPercent === 100 ? 'Completed' : (completionPercent > 0 ? 'In Progress' : 'Available');
    } else {
      const prevStage = roadmap.stages[idx - 1];
      const prevStageCompleted = prevStage.topics.every(t => t.completed);
      
      if (completionPercent === 100) {
        status = 'Completed';
      } else if (completionPercent > 0) {
        status = 'In Progress';
      } else if (prevStageCompleted) {
        status = 'Available';
      } else {
        status = 'Locked';
      }
    }

    const stageId = `${roadmap.id}_${st.stageName}`;
    return {
      ...st,
      id: stageId,
      stageNumber: idx + 1,
      level: st.stageName, // Beginner / Intermediate / Advanced
      duration: getStageDuration(st.stageName),
      completion: completionPercent,
      status,
      isBookmarked: !!bookmarks[stageId],
      notes: notes[stageId] || ""
    };
  });

  // Check if a stage just completed to trigger fireworks
  useEffect(() => {
    augmentedStages.forEach(stage => {
      const stageKey = `${roadmap.id}_${stage.level}`;
      const isCurrentlyCompleted = stage.completion === 100;
      const wasPreviouslyCompleted = !!completedCache[stageKey];

      if (isCurrentlyCompleted && !wasPreviouslyCompleted && completedCache[stageKey] !== undefined) {
        // Trigger celebration
        setConfettiActive(true);
        const timer = setTimeout(() => setConfettiActive(false), 5000);
        
        if (onMarkStageComplete) {
          onMarkStageComplete(stage.level, true);
        }

        // Add auto logger item
        try {
          fetch("/api/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: "u1",
              action: "stage_completion",
              details: `Successfully mastered and signed off on the ${stage.level} gate for the ${roadmap.skillName} curriculum.`
            })
          }).catch(e => console.log("Silent error forwarding sync telemetry.", e));
        } catch {}

        // Add toast feedback UI
        const toast = document.createElement("div");
        toast.className = "fixed bottom-5 right-5 z-[100] bg-emerald-600 text-white rounded-xl shadow-lg p-4 font-sans text-xs flex items-center gap-3 animate-bounce";
        toast.innerHTML = `
          <div class="bg-emerald-700 p-1.5 rounded-lg flex items-center justify-center">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <strong class="font-extrabold block uppercase tracking-wider">Milestone Gate Unlocked!</strong>
            <span>Completed the ${stage.level} level of ${roadmap.skillName}!</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);
      }

      // Update completion cache
      setCompletedCache(prev => ({
        ...prev,
        [stageKey]: isCurrentlyCompleted
      }));
    });
  }, [roadmap.stages]);

  // Initializing completion state cache
  useEffect(() => {
    const initialCache: Record<string, boolean> = {};
    augmentedStages.forEach(stage => {
      initialCache[`${roadmap.id}_${stage.level}`] = stage.completion === 100;
    });
    setCompletedCache(initialCache);
  }, [roadmap.id]);

  // Handle bookmark trigger
  const handleToggleBookmark = (stageId: string) => {
    const updated = { ...bookmarks, [stageId]: !bookmarks[stageId] };
    setBookmarks(updated);
    localStorage.setItem("roadmap_bookmarks", JSON.stringify(updated));
  };

  // Handle Notes updates
  const handleSaveNotes = (stageId: string, text: string) => {
    const updated = { ...notes, [stageId]: text };
    setNotes(updated);
    localStorage.setItem("roadmap_notes", JSON.stringify(updated));
    setShowNotesEditor(null);
  };

  // Filter stages based on query
  const filteredStages = augmentedStages.filter(st => {
    // Search stage by topic names, project references or description
    const textToSearch = `${st.level} ${st.description} ${st.projects.join(" ")} ${st.topics.map(t => t.name).join(" ")}`.toLowerCase();
    const matchesSearch = textToSearch.includes(searchQuery.toLowerCase());
    
    // Level filters
    const matchesLevel = levelFilter === "All" || st.level === levelFilter;
    
    // Status filters
    const matchesStatus = statusFilter === "All" || st.status === statusFilter;

    return matchesSearch && matchesLevel && matchesStatus;
  });

  // Calculate learning metrics for sidebar
  const totalCompletedTopics = augmentedStages.reduce((acc, current) => {
    return acc + current.topics.filter(t => t.completed).length;
  }, 0);

  const totalTopics = augmentedStages.reduce((acc, current) => {
    return acc + current.topics.length;
  }, 0);

  const overallPercent = totalTopics > 0 ? Math.round((totalCompletedTopics / totalTopics) * 100) : 0;

  const currentStage = augmentedStages.find(s => s.status === 'In Progress' || s.status === 'Available') || augmentedStages[0];

  // Dynamic colors based on skill name
  const getThemeColors = (skill: string) => {
    const s = skill.toLowerCase();
    if (s.includes("python") || s.includes("data") || s.includes("machine")) {
      return {
        accent: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-500",
        border: "border-emerald-500",
        ring: "ring-emerald-500/30",
        gradientBg: "from-emerald-500 to-teal-650",
        glowingBorder: "shadow-[0_0_15px_rgba(16,185,129,0.35)]",
        glowText: "text-emerald-600 dark:text-emerald-400"
      };
    }
    if (s.includes("web") || s.includes("react") || s.includes("node") || s.includes("javascript")) {
      return {
        accent: "text-indigo-600 dark:text-indigo-400",
        bg: "bg-indigo-600",
        border: "border-indigo-600",
        ring: "ring-indigo-600/30",
        gradientBg: "from-indigo-650 to-blue-600",
        glowingBorder: "shadow-[0_0_15px_rgba(79,70,229,0.35)]",
        glowText: "text-indigo-600 dark:text-indigo-400"
      };
    }
    // Default system styling
    return {
      accent: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-600",
      border: "border-blue-600",
      ring: "ring-blue-600/30",
      gradientBg: "from-blue-600 to-indigo-600",
      glowingBorder: "shadow-[0_0_15px_rgba(37,99,235,0.35)]",
      glowText: "text-blue-650 dark:text-blue-400 font-bold"
    };
  };

  const theme = getThemeColors(roadmap.skillName);

  // Math variables for static winding SVG viewBox
  const BOX_WIDTH = 800;
  const STAGE_Y_GAP = 280;
  const START_PADDING = 120;
  
  // Create coordinates mapping
  const waypointCoordinates = augmentedStages.map((st, idx) => {
    const isEven = idx % 2 === 0;
    // Left side alternate (x = 240), Right side alternate (x = 560)
    const x = isEven ? 220 : 580;
    const y = START_PADDING + idx * STAGE_Y_GAP;
    return { x, y, stage: st };
  });

  const BOX_HEIGHT = START_PADDING + (augmentedStages.length - 1) * STAGE_Y_GAP + 160;

  // Compile bezier SVG path string
  const buildSvgPath = () => {
    if (waypointCoordinates.length === 0) return "";
    
    const startPoint = { x: BOX_WIDTH / 2, y: 40 };
    let path = `M ${startPoint.x} ${startPoint.y}`;

    // Add first segment connecting Start to waypoint 0
    const firstWp = waypointCoordinates[0];
    const cpY1_first = startPoint.y + (firstWp.y - startPoint.y) * 0.55;
    const cpY2_first = firstWp.y - (firstWp.y - startPoint.y) * 0.55;
    path += ` C ${startPoint.x} ${cpY1_first}, ${firstWp.x} ${cpY2_first}, ${firstWp.x} ${firstWp.y}`;

    // Loop intermediate segments
    for (let i = 1; i < waypointCoordinates.length; i++) {
      const prev = waypointCoordinates[i - 1];
      const curr = waypointCoordinates[i];

      // Calculate smooth S-curve control points
      const cpY1 = prev.y + (curr.y - prev.y) * 0.55;
      const cpY2 = curr.y - (curr.y - prev.y) * 0.55;
      
      path += ` C ${prev.x} ${cpY1}, ${curr.x} ${cpY2}, ${curr.x} ${curr.y}`;
    }

    // Connect last milestone to finish gateway at center bottom
    const lastWp = waypointCoordinates[waypointCoordinates.length - 1];
    const endPoint = { x: BOX_WIDTH / 2, y: BOX_HEIGHT - 50 };
    const cpY1_last = lastWp.y + (endPoint.y - lastWp.y) * 0.55;
    const cpY2_last = endPoint.y - (endPoint.y - lastWp.y) * 0.55;
    path += ` C ${lastWp.x} ${cpY1_last}, ${endPoint.x} ${cpY2_last}, ${endPoint.x} ${endPoint.y}`;

    return path;
  };

  const svgPathD = buildSvgPath();

  // Jump to Current Stage callback handler
  const jumpToCurrentStageRef = () => {
    if (!currentStage) return;
    const stageElement = document.getElementById(`waypoint-element-${currentStage.id}`);
    if (stageElement) {
      stageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Spark scale animation
      stageElement.classList.add('animate-ping');
      setTimeout(() => stageElement.classList.remove('animate-ping'), 800);
    }
  };

  return (
    <div className="space-y-6">
      <ConfettiCelebration active={confettiActive} />

      {/* Advanced Performance Header Console & Search filters panel */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-3xs">
        <div className="space-y-1.5 flex-1 select-none">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold rounded-md font-mono text-[10px] uppercase">
              Interactive Path Canvas
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500 fill-current" />
              <span>Streak: <strong className="font-mono text-slate-800 dark:text-white">5 Days</strong></span>
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white font-sans flex items-center gap-2.5">
            <span>Visual Career Winding Road</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Embark on the alternating left-and-right milestone checkpoints dynamically parsed. Scroll to track your gate approvals.
          </p>
        </div>

        {/* Toolbar selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Find input bar */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search stage topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs focus:bg-white"
            />
          </div>

          {/* Filter by Stage Level dropdown */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner Only</option>
            <option value="Intermediate">Intermediate Only</option>
            <option value="Advanced">Advanced Only</option>
          </select>

          {/* Filter by Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Available">Available</option>
            <option value="Locked">Locked</option>
          </select>

          {/* Action Focus triggers */}
          <button
            type="button"
            onClick={jumpToCurrentStageRef}
            className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer font-sans shadow-xs flex items-center gap-1.5"
            title="Focus the window on your immediate pending learning goal"
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Active Goal</span>
          </button>
        </div>
      </div>

      {/* Main core layout grids splits: Left winding canvas flow / Right info tracker */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: SVG Interactive Alternate curve path canvas container */}
        <div className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col items-center">
          
          {/* Subtle grid mesh aesthetic background watermark */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

          {/* Scroll progress overlay text/percentage bubble */}
          <div className="absolute top-5 right-5 z-20 bg-slate-900 text-white dark:bg-white dark:text-slate-950 p-2.5 px-3.5 rounded-2xl flex items-center gap-2.5 border border-white/5 dark:border-slate-200/50 shadow-md">
            <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-350 dark:text-slate-500 block leading-none">Synergy Progress</span>
              <strong className="font-mono text-xs font-bold font-extrabold">{overallPercent}% Complete</strong>
            </div>
          </div>

          {/* Start indicator flag */}
          <div className="flex flex-col items-center relative z-10 select-none pb-2 pt-2 -mb-2">
            <span className="px-3.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-[9px] uppercase tracking-widest rounded-full shadow-lg border border-white/10 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="h-3 w-3" />
              <span>START LINE</span>
            </span>
            <div className="w-1.5 h-6 bg-blue-500 dark:bg-blue-600 rounded-b mt-0.5" />
          </div>

          {/* Interactive SVG Winding Flow block */}
          <div className="w-full relative select-none" style={{ height: `${BOX_HEIGHT}px`, maxWidth: `${BOX_WIDTH}px` }}>
            
            {/* Smooth curve vector core */}
            <svg 
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${BOX_WIDTH} ${BOX_HEIGHT}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back road shadow stroke contour for neon glow depths */}
              <path
                d={svgPathD}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Inner operational asphalt road mockup path */}
              <path
                d={svgPathD}
                className="stroke-slate-200 dark:stroke-slate-950/80 transition-all duration-700"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Colored active path drawing based on completed statuses */}
              <path
                d={svgPathD}
                className={`transition-all duration-1000 ${theme.accent}`}
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 6"
                style={{
                  opacity: 0.85
                }}
              />
            </svg>

            {/* Render Waypoint Milestone Node triggers */}
            {waypointCoordinates.map((wp, wpIdx) => {
              const { stage } = wp;
              const isEven = wpIdx % 2 === 0;

              // Left positioned triggers need alignment adjustments
              // Since viewBox uses 800, waypoint x% is (x/800)*100
              const leftPercent = (wp.x / BOX_WIDTH) * 100;
              const topPercent = (wp.y / BOX_HEIGHT) * 100;

              // Check if currently filtered out
              const isFilteredOut = !filteredStages.some(s => s.id === stage.id);

              return (
                <div
                  id={`waypoint-element-${stage.id}`}
                  key={stage.id}
                  className="absolute -translate-y-1/2 -translate-x-1/2 transition-all duration-700 select-none z-10"
                  style={{ 
                    left: `${leftPercent}%`, 
                    top: `${topPercent}%`,
                    opacity: isFilteredOut ? 0.25 : 1,
                    pointerEvents: isFilteredOut ? 'none' : 'auto'
                  }}
                  onMouseEnter={() => setHoveredStageId(stage.id)}
                  onMouseLeave={() => setHoveredStageId(null)}
                >
                  {/* Waypoint container with responsive animation parameters */}
                  <div className="relative flex flex-col items-center">
                    
                    {/* The Interactive central orb */}
                    <motion.button
                      id={`waypoint-orb-${stage.id}`}
                      whileHover={{ scale: stage.status === 'Locked' ? 1 : 1.15 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setActiveModalStage(stage)}
                      className={`h-16 w-16 rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-md font-sans border-3 ${
                        stage.status === 'Completed'
                          ? 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-950/10 dark:shadow-emerald-900/30 ring-4 ring-emerald-500/20'
                          : stage.status === 'In Progress'
                          ? 'bg-indigo-650 border-indigo-300 text-white ring-4 ring-indigo-500/30 animate-[pulse_2.2s_infinite]'
                          : stage.status === 'Available'
                          ? 'bg-white border-slate-350 dark:bg-slate-805 dark:border-slate-700 text-slate-800 dark:text-neutral-200'
                          : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                      aria-label={`${stage.level} milestone: ${stage.stageName}. Status: ${stage.status}`}
                    >
                      {/* Active status representation badge icon inside orb */}
                      {stage.status === 'Completed' ? (
                        <Check className="h-6 w-6 stroke-[3.5]" />
                      ) : stage.status === 'Locked' ? (
                        <Lock className="h-4.5 w-4.5 text-slate-400" />
                      ) : stage.status === 'In Progress' ? (
                        <Play className="h-5 w-5 fill-current text-white translate-x-0.5" />
                      ) : (
                        <span className="font-mono text-sm font-bold">0{stage.stageNumber}</span>
                      )}

                      {/* Small badge count of completion bar on top */}
                      {stage.status !== 'Locked' && stage.status !== 'Completed' && (
                        <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-md py-0.5 px-1.5 font-mono text-[9px] font-black border border-slate-700 dark:border-slate-300">
                          {stage.completion}%
                        </span>
                      )}
                    </motion.button>

                    {/* Floating Title Banner - positioned below orb */}
                    <div className={`mt-2 py-1 px-3.5 bg-black/80 dark:bg-slate-950 backdrop-blur-xs border border-white/10 dark:border-slate-800 rounded-xl max-w-[130px] shadow-sm select-none text-center ${
                      stage.status === 'Locked' ? 'opacity-65' : ''
                    }`}>
                      <strong className="text-[10px] font-extrabold text-neutral-100 block truncate leading-tight">
                        {stage.stageName}
                      </strong>
                      <span className="text-[8px] font-mono font-medium text-slate-400 block tracking-tight uppercase">
                        {stage.level}
                      </span>
                    </div>

                    {/* Desktop Hover popover card element - glassmorphic modal overlay */}
                    <AnimatePresence>
                      {hoveredStageId === stage.id && (
                        <motion.div
                          id={`hover-card-${stage.id}`}
                          initial={{ opacity: 0, scale: 0.9, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 15 }}
                          className={`absolute bottom-[90px] z-[50] ${
                            isEven ? 'left-10 md:left-24' : 'right-10 md:right-24'
                          } w-[260px] md:w-[320px] rounded-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 text-left border border-slate-200 dark:border-slate-800 shadow-[0_12px_24px_rgba(0,0,0,0.12)] space-y-3 font-sans text-xs pointer-events-auto`}
                        >
                          <div className="flex items-start justify-between">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              stage.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : stage.status === 'In Progress'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                                : stage.status === 'Available'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/35'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {stage.status}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-450 dark:text-slate-400 font-mono text-[10px]">
                              <Clock className="h-3 w-3" />
                              <span>{stage.duration}</span>
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-slate-950 dark:text-white leading-none">
                              {stage.stageName}
                            </h4>
                            <span className="text-[10px] text-slate-450 uppercase block font-medium">
                              {roadmap.skillName} • Gate 0{stage.stageNumber}
                            </span>
                          </div>

                          <p className="text-slate-650 dark:text-slate-350 text-[11px] leading-relaxed line-clamp-2 italic">
                            {stage.description}
                          </p>

                          {/* Quick Topic overview bar */}
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                              Sub-skills list ({stage.topics.length})
                            </span>
                            <div className="flex flex-wrap gap-1 max-h-[48px] overflow-hidden">
                              {stage.topics.map(t => (
                                <span 
                                  key={t.id} 
                                  className={`px-2 py-0.5 rounded text-[9px] leading-none ${
                                    t.completed 
                                      ? 'bg-emerald-100/60 text-emerald-800 line-through dark:bg-emerald-950/50 dark:text-emerald-400' 
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-1">
                              <div className="w-16 bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-650 h-full" style={{ width: `${stage.completion}%` }} />
                              </div>
                              <span className="text-[9px] font-mono font-black">{stage.completion}%</span>
                            </div>

                            <button 
                              type="button" 
                              onClick={() => {
                                setHoveredStageId(null);
                                setActiveModalStage(stage);
                              }}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-0.5"
                            >
                              <span>Launch Details</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              );
            })}

            {/* Finish Gateway Flag */}
            <div 
              className="absolute -translate-x-1/2 select-none z-10 flex flex-col items-center"
              style={{ left: '50%', top: `${BOX_HEIGHT - 60}px` }}
            >
              <div className="w-1.5 h-6 bg-slate-400 dark:bg-slate-600 rounded-t" />
              <div className="bg-slate-900 border border-slate-800 dark:bg-emerald-950 dark:border-emerald-800 text-white p-3 px-5 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5 text-amber-500 animate-spin" style={{ animationDuration: '5s' }} />
                </div>
                <div>
                  <strong className="text-xs font-black block tracking-wide text-amber-400 uppercase leading-none mb-1.5">CAREER READY GATE</strong>
                  <p className="text-[10px] text-slate-300 leading-none">Complete all checkpoints to unlock master certificate validation.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Visual Progress Sidebar Summary Panel */}
        <div className="xl:col-span-4 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-3xs space-y-5">
            <span className="text-[9px] tracking-widest font-black uppercase text-slate-450 block font-mono">Academic Achievement Stats</span>
            
            <div className="space-y-4">
              {/* Radial Score card */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                <div className="relative h-14 w-14 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="24" stroke="currentColor" className="text-slate-100 dark:text-slate-850" strokeWidth="4" fill="transparent" />
                    <circle cx="28" cy="28" r="24" stroke="currentColor" className="text-indigo-650" strokeWidth="4" fill="transparent"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 * (1 - overallPercent / 100)}
                    />
                  </svg>
                  <span className="absolute text-[11px] font-black font-mono text-slate-950 dark:text-neutral-200">
                    {overallPercent}%
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wide">
                    Overall Syllabus Progression
                  </h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-normal">
                    You mastered <strong className="text-slate-800 dark:text-neutral-200 font-mono">{totalCompletedTopics}</strong> out of <strong className="text-slate-800 dark:text-neutral-200 font-mono">{totalTopics}</strong> granular competence goals.
                  </p>
                </div>
              </div>

              {/* Learning details list items */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-850/70">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Est. Study Investment</span>
                  </span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {augmentedStages.length * 3} Weeks
                  </strong>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-850/70">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-slate-400" />
                    <span>Certificates Validated</span>
                  </span>
                  <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">
                    {augmentedStages.filter(s => s.status === 'Completed').length} / {augmentedStages.length} Paid
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                    <Bookmark className="h-4 w-4 text-slate-400" />
                    <span>Active Bookmarked Stages</span>
                  </span>
                  <span className="bg-amber-50 text-amber-700 dark:bg-amber-955/20 px-2.5 py-0.5 rounded font-bold font-mono">
                    {Object.values(bookmarks).filter(Boolean).length} Gates
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bookmarks, custom Notes and study guidelines helper card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-3xs space-y-4">
            <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider font-mono">
              Bookmarks & Study Notes Quick Links
            </h4>

            {Object.keys(bookmarks).filter(key => bookmarks[key]).length === 0 ? (
              <div className="py-6 text-center rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-dashed border-slate-200 dark:border-slate-800">
                <BookMarked className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[11px] text-slate-450 leading-relaxed max-w-[200px] mx-auto">
                  No bookmarked milestones yet. Select any checkpoint to read details, write custom notes, and add bookmarks.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {augmentedStages.filter(s => bookmarks[s.id]).map(stage => (
                  <div 
                    key={stage.id}
                    onClick={() => setActiveModalStage(stage)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="space-y-0.5 truncate max-w-[140px] md:max-w-none">
                      <span className="text-[8px] font-bold text-slate-400 uppercase font-mono block">
                        Gate {stage.stageNumber} • {stage.level}
                      </span>
                      <strong className="text-xs text-slate-850 dark:text-slate-200 block truncate font-bold">
                        {stage.stageName}
                      </strong>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(stage.id);
                      }}
                      className="p-1 px-2.5 bg-amber-50 text-amber-700 dark:bg-amber-955/20 hover:bg-red-50 hover:text-red-650 rounded-lg text-[9px] font-black transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Advanced Fullscreen/Bottom Sheet Dialog Modal backdrop filter rendering */}
      <AnimatePresence>
        {activeModalStage && (() => {
          const mStage = augmentedStages.find(s => s.level === activeModalStage.level) || activeModalStage;
          
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Back backdrop filter mask */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setActiveModalStage(null);
                  setShowNotesEditor(null);
                }}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              />

              {/* Dynamic Interactive Stage Modal Content Node body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 font-sans text-xs"
              >
                {/* Close Button top-right corner */}
                <button
                  type="button"
                  id="close-milestone-modal-btn"
                  onClick={() => {
                    setActiveModalStage(null);
                    setShowNotesEditor(null);
                  }}
                  className="absolute top-5 right-5 p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 rounded-lg transition-all cursor-pointer border-none"
                >
                  <X className="h-4.5 w-4.5" />
                </button>

                {/* Modal Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-5">
                  <div className="space-y-1.5 flex-1 pr-6 select-none">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        mStage.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                          : mStage.status === 'In Progress'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40'
                          : mStage.status === 'Available'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/35'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        Stage {mStage.status}
                      </span>
                      <span className="text-slate-450">•</span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Clock className="h-3.5 w-3.5 text-slate-450" />
                        <span>Duration: {mStage.duration}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-950 dark:text-white leading-tight">
                      {mStage.stageName}
                    </h3>
                    
                    <span className="text-[10px] text-slate-450 block font-semibold tracking-wider uppercase font-mono">
                      Mastery Path: {roadmap.skillName} • Course Gate 0{mStage.stageNumber}
                    </span>
                  </div>

                  {/* Bookmark Toggle Action button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      id={`bookmark-gate-btn-${mStage.id}`}
                      onClick={() => handleToggleBookmark(mStage.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold font-sans transition-all cursor-pointer shadow-3xs ${
                        mStage.isBookmarked 
                          ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-955/35 dark:text-amber-400' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-500 dark:text-neutral-350'
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${mStage.isBookmarked ? 'fill-current' : ''}`} />
                      <span>{mStage.isBookmarked ? 'Bookmarked' : 'Bookmark Stage'}</span>
                    </button>
                  </div>
                </div>

                {/* Subtitle stage overview */}
                <div className="space-y-2 select-none bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] uppercase tracking-wider text-slate-450 block font-bold font-mono">Executive Summary</span>
                  <p className="text-slate-780 dark:text-slate-300 text-xs leading-relaxed font-medium italic">
                    "{mStage.description}"
                  </p>
                </div>

                {/* Sub-skills Topics checklist workspace */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2.5 gap-2 select-none">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wide font-sans">
                        Target Sub-skills Checklist
                      </h4>
                      <p className="text-[11px] text-slate-450">Complete these components sequentially to unlock the higher gate checkpoints.</p>
                    </div>
                    <span className="font-mono text-[10px] font-black bg-slate-100 dark:bg-slate-950 p-1 px-2.5 rounded-lg">
                      Mastered: {mStage.topics.filter(t => t.completed).length} / {mStage.topics.length}
                    </span>
                  </div>

                  {/* Reductive locked state banner warning */}
                  {mStage.status === 'Locked' ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-850 flex items-start gap-3.5">
                      <div className="p-2.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg shrink-0">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 dark:text-slate-205 block text-xs">Curriculum Locked</span>
                        <p className="text-slate-450 leading-relaxed font-sans mt-0.5">
                          You are forbidden from advancing to this level of content until you successfully complete all previous learning stages. Master the beginner checkpoints to continue.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {mStage.topics.map((tp) => (
                        <div
                          id={`modal-topic-checkbox-${tp.id}`}
                          key={tp.id}
                          onClick={() => onToggleTopic(roadmap.id, mStage.level, tp.id)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            tp.completed 
                              ? "bg-slate-100/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850 text-slate-450 dark:text-slate-550 line-through"
                              : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-355 shadow-3xs hover:border-indigo-400 dark:hover:border-indigo-505"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                              tp.completed 
                                ? "bg-emerald-600 border-emerald-600 text-white" 
                                : "border-slate-300 dark:border-slate-700 hover:border-indigo-500"
                            }`}>
                              {tp.completed && <Check className="h-3.5 w-3.5 text-white" />}
                            </div>
                            <span className="text-xs font-semibold select-none leading-snug">{tp.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Companion Resource references */}
                {mStage.status !== 'Locked' && (
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block font-sans select-none">
                      Verified Study References & Courses
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {mStage.resources.map((resItem, ri) => (
                        <a
                          key={ri}
                          href={resItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-955/20 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-800 text-[114px] font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-650 rounded-xl flex items-center gap-1.5 transition-all no-underline shrink-0 shadow-3xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                          <span>{resItem.title} - <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{resItem.type}</strong></span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target milestone lab projects list requirement */}
                {mStage.projects && mStage.projects.length > 0 && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-955/15 p-4 rounded-xl border border-indigo-100/60 dark:border-indigo-950/40 text-xs space-y-2">
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-400 block tracking-wide uppercase text-[10px] font-mono select-none">
                      Hands-on Practice Sandbox Projects
                    </span>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-705 dark:text-slate-350 leading-relaxed font-sans">
                      {mStage.projects.map((proj, pi) => (
                        <li key={pi}>{proj}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Educational Learning Notes section */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <div className="flex items-center justify-between select-none">
                    <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wide font-sans flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span>Individual Learning Notes</span>
                    </h4>
                    {showNotesEditor !== mStage.id && (
                      <button
                        type="button"
                        onClick={() => setShowNotesEditor(mStage.id)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-105 dark:bg-slate-950 text-slate-700 dark:text-neutral-300 font-black text-[10px] uppercase rounded-lg border border-slate-150 dark:border-slate-800 transition-all cursor-pointer hover:text-indigo-600"
                      >
                        {mStage.notes ? 'Edit Notes' : 'Create Notes'}
                      </button>
                    )}
                  </div>

                  {showNotesEditor === mStage.id ? (
                    <div className="space-y-3">
                      <textarea
                        defaultValue={mStage.notes}
                        id={`notes-textarea-${mStage.id}`}
                        rows={4}
                        placeholder="Type personal reminders, command line syntax, study bookmarks or bookmarks..."
                        className="w-full p-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-neutral-100 rounded-xl border border-slate-205 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                      />
                      <div className="flex items-center justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setShowNotesEditor(null)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const val = (document.getElementById(`notes-textarea-${mStage.id}`) as HTMLTextAreaElement)?.value || "";
                            handleSaveNotes(mStage.id, val);
                          }}
                          className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  ) : mStage.notes ? (
                    <div className="p-3.5 bg-yellow-50/50 dark:bg-amber-955/10 border border-yellow-100 dark:border-amber-910/20 text-slate-700 dark:text-neutral-300 rounded-xl font-sans whitespace-pre-wrap leading-relaxed">
                      {mStage.notes}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-450 italic select-none block pb-1">
                      No customized reminders stored. Jot down syntax highlights or exam timestamps directly here.
                    </span>
                  )}
                </div>

                {/* Continue learning dynamic actions bar */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4.5 w-4.5 text-amber-500" />
                    <span className="text-[11px] text-slate-500 font-sans font-medium">Complete all checklist items to unlock certification status.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="continue-learning-dismiss-btn"
                      onClick={() => {
                        setActiveModalStage(null);
                        setShowNotesEditor(null);
                      }}
                      className="px-4.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-950 text-white font-black text-[10px] tracking-widest uppercase rounded-xl transition-all cursor-pointer text-center"
                    >
                      Continue Journey
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
