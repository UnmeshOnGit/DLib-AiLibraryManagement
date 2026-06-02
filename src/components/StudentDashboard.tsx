import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Sparkles, Clock, Compass, Search, RotateCw, 
  CheckCircle, AlertTriangle, ExternalLink, Bookmark, GraduationCap, 
  MessageSquare, Star, User, BookCheck, RefreshCw, Send, Check,
  Trophy, Target, Award, TrendingUp, Plus, Trash2, Calendar, Flame
} from "lucide-react";
import { Book, IssueRequest, UserRoadmap, Feedback } from "../types";
import { RoadmapVisualization } from "./RoadmapVisualization";
import AICopilotHub from "./AICopilotHub";

// Helper to compile department-relevant topics
const getDefaultTopicsForBranch = (branch: string) => {
  const normalized = (branch || "").toLowerCase();
  
  let list = [
    "General Aptitude & Problem Solving",
    "Technical Writing for Engineers",
    "Library Research Ethics"
  ];
  
  if (normalized.includes("computer") || normalized.includes("info")) {
    list = [
      "Data Structures: Trees, Graphs & HashTables",
      "Database Management: SQL Queries & Joins",
      "Operating Systems: Semaphores & CPU Scheduling",
      "Computer Networks: TCP/IP Handshake & CIDR",
      "Software Engineering: Design Patterns & UML",
      "System Design: Microservices, Caching & Load Balancing"
    ];
  } else if (normalized.includes("electrical")) {
    list = [
      "Circuit Analysis: Kirchhoff's Laws & RLC Filters",
      "Power Electronics: Thyristor Bridge Rectifiers",
      "Control Systems: Nyquist Stability & State-Space",
      "Electromagnetic Theory: Maxwell's Flux Equations",
      "Electrical Machines: Synchronous Motor Dynamics",
      "Microcontrollers: Assembly Language Instructions"
    ];
  } else if (normalized.includes("mechanical")) {
    list = [
      "Thermodynamics: Heat Pumps & Rankine Cycles",
      "Fluid Dynamics: Navier-Stokes Flow Fields",
      "Theory of Machines: Epicyclic Gear Tensors",
      "Strength of Materials: Mohr's Tensional Circles",
      "Manufacturing Science: Lathe Tool Orthogonal Cut",
      "Finite Element Analysis: Boundary Node Vibrations"
    ];
  } else if (normalized.includes("civil")) {
    list = [
      "Structural Mechanics: Beams Shear Tension bending",
      "Geotechnical Engineering: Terzaghi Soil bearing load",
      "Environmental Hydraulics: Sewage Active filter rows",
      "Transportation: Flexible Highway Asphalt mix ratios",
      "Concrete Technology: Hydration Heat & Mix Design",
      "Engineering Hydrology: Flood Tally Hydrographs"
    ];
  } else if (normalized.includes("chemical")) {
    list = [
      "Chemical Reaction: Arrhenius Catalytic Gas Rows",
      "Heat Operations: Shell-and-Tube Exchanger math",
      "Mass Transfer: Fick's Diffusional Concentration",
      "Thermodynamics of Solutions: Fugacity Coefficients",
      "Process Safety: Hazardous Volatile Vapor Venting",
      "Plant Asset Design: Capital Optimization Tensors"
    ];
  }

  return list.map((item, index) => ({
    id: `topic_${index + 1}`,
    title: item,
    subject: branch || "General Engineering",
    completed: false
  }));
};

interface StudentBookCardProps {
  key?: any;
  book: Book;
  user: any;
  handleIssueRequest: (bookId: string, duration: number) => void;
}

const COVER_IMAGES = [
  "1515879218-11a2f54c1b5a", // coding and algorithms
  "1544383835-bda2bc66a55d", // networking server lights
  "1507668077129-56e32842fceb", // scientific equations glow
  "1581092160607-ee22621dd758", // physics mechanics gears
  "1532187643603-ba119ca4109e", // chemical tubes
  "1509228468518-180dd4864904", // geometry and math
  "1516979187457-637abb4f9353", // scholarly vintage open pages
  "1532012197267-da84d127e765", // magical glowing open bible/book
  "1543002587-9bc1ca1965ee", // minimalist stack of colored textbooks
  "1497633762265-9d179a990aa6", // stacked primary colors shelf
  "1512820790803-83ca734da794", // red binding novel cover
  "1456513080510-7bf3a84b82f8", // study table cup of coffee beside opened tech text
  "1521587760476-6c12a4b040da", // high ceiling ancient library shelves
  "1440778303588-d9551f335538", // typewriter and warm vintage desk
  "1513001900722-370f803f498d", // cloud book creative template
  "1535905222005-0c92a912e70e", // contemporary scandinavian wood library
  "1509062522246-3755977927d7", // classroom chalk board and desks
  "1518152006812-edab29b069ac", // electronic matrix patterns
  "1526374965328-7f61d4dc18c5", // database numbers matrix
  "1498050108023-c5249f4df085", // clean tech laptop workplace
  "1522071820081-009f0129c71c", // collective designers brainstorm
  "1531988042231-d39a9cc12a9a", // research vial and plant growth
  "1588666309990-d68f08e3d4a6", // dark engineering notebooks binders
  "1557683316-973673baf926", // rich color swatch abstract
  "1516979187457-637abb4f9353", // elegant library background
  "1506880018603-83d5b814b5a6", // stylish minimal shelf
  "1513001900722-370f803f498e"  // abstract artistic pages
];

const getBookCoverUrl = (bookId: string, title: string) => {
  const seed = `${bookId}-${title || ""}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % COVER_IMAGES.length;
  const code = COVER_IMAGES[idx];
  return `https://images.unsplash.com/photo-${code}?auto=format&fit=crop&q=80&w=260`;
};

function StudentBookCard({ book, user, handleIssueRequest }: StudentBookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isAvailable = book.availableCopies > 0;
  const coverUrl = getBookCoverUrl(book.id, book.title);

  // Compute match score
  let score = 75;
  const userBranchLower = (user?.branch || '').toLowerCase();
  const bookDeptLower = (book.department || '').toLowerCase();
  if (userBranchLower && bookDeptLower && (
    bookDeptLower.includes(userBranchLower) || 
    userBranchLower.includes(bookDeptLower) ||
    (userBranchLower.includes("comp") && bookDeptLower.includes("algorithm")) ||
    (userBranchLower.includes("comp") && bookDeptLower.includes("database"))
  )) {
    score += 18;
  }
  const finalScore = Math.min(98, score);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`student-book-card-${book.id}`}
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-600 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-300 relative overflow-hidden h-[335px]"
    >
      <div className="space-y-3 h-full flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-1.5 items-start">
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-350 rounded-lg text-[11px] font-bold tracking-wide uppercase font-sans">
                {book.department}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 rounded-md text-[10px] font-black tracking-wider uppercase">
                ⚡ {finalScore}% Match
              </span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-amber-500 text-xs text-nowrap">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0 inline" />
              <span>{book.rating.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1 leading-snug uppercase">
              {book.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              By {book.author}
            </p>
          </div>

          <p className="text-xs text-slate-650 dark:text-slate-350 line-clamp-3">
            {book.description}
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-150 dark:border-slate-800 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-455 font-semibold">Location:</span>
            <span className="text-slate-700 dark:text-slate-200 line-clamp-1">{book.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-455 font-semibold">ISBN:</span>
            <span className="text-slate-705 dark:text-slate-200">{book.isbn}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800 font-sans text-xs">
            <span className="text-slate-500 font-semibold">Available Stock:</span>
            <span className={`font-extrabold ${isAvailable ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-550 dark:text-rose-450'}`}>
              {book.availableCopies} / {book.totalCopies} Left
            </span>
          </div>
        </div>
      </div>

      {/* Slide-Up Hover Animation Panel showing Cover Image & Book details */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 24, stiffness: 180 }}
            className="absolute inset-0 bg-[#09150E]/98 dark:bg-slate-950/98 text-white p-5 rounded-2xl flex flex-col justify-between z-20 border border-emerald-500/30 shadow-2xl premium-glow-blue"
          >
            <div className="flex gap-3 h-[68%]">
              {/* Photo representation */}
              <div className="w-[36%] h-full rounded-lg overflow-hidden border border-emerald-500/10 shrink-0 relative bg-gradient-to-br from-emerald-800 to-emerald-950 flex flex-col justify-between p-2">
                <div className="absolute left-1 inset-y-0 w-[2.5px] bg-emerald-400/20" />
                <div className="flex flex-col gap-0.5 z-10 pl-1 overflow-hidden pointer-events-none">
                  <span className="text-[6px] font-mono tracking-wider text-emerald-300 font-extrabold truncate uppercase">{book.category}</span>
                  <span className="text-[7px] font-black leading-tight uppercase text-white line-clamp-3 leading-none">{book.title}</span>
                </div>
                <div className="z-10 pl-1 text-[5px] font-mono text-emerald-350 tracking-wider font-semibold truncate leading-none uppercase pointer-events-none">DBATU D-LIB</div>

                <img
                  src={coverUrl}
                  alt={book.title}
                  className={`absolute inset-0 w-full h-full object-cover transform scale-100 hover:scale-115 transition-all duration-750 z-15 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                  referrerPolicy="no-referrer"
                  onLoad={() => setImgLoaded(true)}
                  onError={(e) => {
                    const fallbackSeed = encodeURIComponent(book.title);
                    const fallbackUrl = `https://picsum.photos/seed/${fallbackSeed}/200/300`;
                    if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                      (e.target as HTMLImageElement).src = fallbackUrl;
                    } else {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-transparent to-transparent z-16 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-1 z-17 pointer-events-none">
                  <span className="text-[7px] font-mono uppercase text-amber-300 block text-center">STUDY SELECTION</span>
                </div>
              </div>

              {/* Text content details */}
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[8px]">
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">{book.id}</span>
                    <span className="text-emerald-400 font-bold font-mono">⚡ {finalScore}% MATCH</span>
                  </div>
                  <h4 className="text-[11px] font-black tracking-tight leading-tight uppercase line-clamp-2 text-slate-100">
                    {book.title}
                  </h4>
                  <p className="text-[9px] font-mono text-slate-300">by {book.author}</p>
                </div>

                <p className="text-[9px] text-slate-400 leading-relaxed line-clamp-3 font-sans italic">
                  "{book.description}"
                </p>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-slate-400 font-sans">ISBN {book.isbn}</span>
                <span className="text-slate-400 line-clamp-1">Rack {book.location.split(' ')[1] || 'GENERAL'}</span>
              </div>

              <div>
                {isAvailable ? (
                  <button
                    onClick={() => handleIssueRequest(book.id, 14)}
                    className="w-full h-8 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-550 hover:to-teal-605 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer border border-white/10 active:scale-95"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-white" />
                    File Checkout (14 Days)
                  </button>
                ) : (
                  <button
                    onClick={() => handleIssueRequest(book.id, 14)}
                    className="w-full h-8 flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer border border-white/10 active:scale-95"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-white" />
                    Book Smart Reservation
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  id?: string;
}

export default function StudentDashboard({ user, onLogout, id }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'locker' | 'roadmaps' | 'tracker' | 'ai-coach' | 'feedback'>('catalog');
  
  // Library State
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [issuedHistory, setIssuedHistory] = useState<IssueRequest[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  
  // AI Roadmap State
  const [skillInput, setSkillInput] = useState('');
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [userRoadmaps, setUserRoadmaps] = useState<UserRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<UserRoadmap | null>(null);

  // Recommendations State
  const [aiCoachOutput, setAiCoachOutput] = useState('');
  const [generatingCoach, setGeneratingCoach] = useState(false);
  const [coachInterests, setCoachInterests] = useState<string[]>(user.interests || []);
  const [interestInput, setInterestInput] = useState('');

  // Feedback State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('General System');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Progress Tracker State
  const [trackerData, setTrackerData] = useState<{
    weeklyGoal: number;
    monthlyGoal: number;
    topics: any[];
  }>(() => {
    const saved = localStorage.getItem(`learning_progress_${user.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Safe fallthrough
      }
    }
    const defaultTopics = getDefaultTopicsForBranch(user.branch);
    return {
      weeklyGoal: 3,
      monthlyGoal: 10,
      topics: defaultTopics
    };
  });

  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicSubject, setNewTopicSubject] = useState(user.branch || "General Engineering");
  const [weeklyGoalInput, setWeeklyGoalInput] = useState(String(trackerData.weeklyGoal));
  const [monthlyGoalInput, setMonthlyGoalInput] = useState(String(trackerData.monthlyGoal));

  // Sync Tracker Data to LocalStorage
  useEffect(() => {
    localStorage.setItem(`learning_progress_${user.id}`, JSON.stringify(trackerData));
  }, [trackerData, user.id]);

  // General Notification System
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const departments = ["All", "Computer Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Civil Engineering", "Information Technology"];

  // Load books, lockers on render
  useEffect(() => {
    fetchBooks();
    fetchIssued();
    loadSavedRoadmaps();
  }, [searchQuery, selectedDept]);

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Progress tracking helper functions
  const handleToggleSyllabusTopic = (topicId: string) => {
    setTrackerData(prev => {
      const updatedTopics = prev.topics.map(t => {
        if (t.id === topicId) {
          const completed = !t.completed;
          return {
            ...t,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined
          };
        }
        return t;
      });
      return { ...prev, topics: updatedTopics };
    });
    triggerToast("success", "Topic progress status successfully updated.");
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    
    const newTopic = {
      id: "custom_" + Date.now(),
      title: newTopicTitle.trim(),
      subject: newTopicSubject.trim(),
      completed: false
    };

    setTrackerData(prev => {
      const updated = {
        ...prev,
        topics: [...prev.topics, newTopic]
      };
      return updated;
    });
    setNewTopicTitle("");
    triggerToast("success", `Custom topic "${newTopic.title}" added to tracker.`);
  };

  const handleDeleteTopic = (topicId: string) => {
    setTrackerData(prev => {
      return {
        ...prev,
        topics: prev.topics.filter(t => t.id !== topicId)
      };
    });
    triggerToast("success", "Topic deleted from tracker.");
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(weeklyGoalInput) || 3;
    const m = parseInt(monthlyGoalInput) || 10;
    
    setTrackerData(prev => {
      return {
        ...prev,
        weeklyGoal: w,
        monthlyGoal: m
      };
    });
    triggerToast("success", "Goals updated successfully!");
  };

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const url = `/api/books?search=${encodeURIComponent(searchQuery)}&dept=${encodeURIComponent(selectedDept)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setBooks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchIssued = async () => {
    try {
      const res = await fetch(`/api/issues?role=student&studentId=${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setIssuedHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSavedRoadmaps = () => {
    try {
      const stored = localStorage.getItem(`roadmaps_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserRoadmaps(parsed);
        if (parsed.length > 0 && !selectedRoadmap) {
          setSelectedRoadmap(parsed[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveRoadmapsToLocalStorage = (list: UserRoadmap[]) => {
    localStorage.setItem(`roadmaps_${user.id}`, JSON.stringify(list));
    setUserRoadmaps(list);
  };

  const handleIssueRequest = async (bookId: string, duration: number = 14) => {
    try {
      const res = await fetch("/api/issues/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          studentId: user.id,
          studentName: user.name,
          durationDays: duration
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast("success", data.isReserve 
          ? "Reserve slot recorded successfully! You are placed in the queue."
          : `Checkout request filed successfully. Please report to central desk. ID: ${data.request.id}`);
        fetchBooks();
        fetchIssued();
      } else {
        triggerToast("error", data.error || "Failed to finalize book checkout request.");
      }
    } catch (err) {
      triggerToast("error", "Network clearance failed.");
    }
  };

  const handleRenewalRequest = async (issueId: string, days: number = 7) => {
    try {
      const res = await fetch(`/api/issues/renew/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          renewalDays: days
        })
      });

      const data = await res.json();
      if (res.ok) {
        triggerToast("success", `Extension request requested (+${days} days). Pending librarian signature.`);
        fetchIssued();
      } else {
        triggerToast("error", data.error || "Renewal failed.");
      }
    } catch (err) {
      triggerToast("error", "Could not complete renewal operation.");
    }
  };

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = skillInput.trim();
    if (!query) return;

    setGeneratingRoadmap(true);
    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillQuery: query,
          studentId: user.id,
          studentName: user.name
        })
      });

      const data = await res.json();
      if (res.ok) {
        const newRoadmap: UserRoadmap = {
          id: data.id || "r_" + Date.now(),
          studentId: user.id,
          skillName: data.skillName,
          stages: data.stages,
          progressPercent: 0,
          lastUpdated: new Date().toISOString()
        };

        const updatedList = [newRoadmap, ...userRoadmaps];
        saveRoadmapsToLocalStorage(updatedList);
        setSelectedRoadmap(newRoadmap);
        setSkillInput('');
        triggerToast("success", "Academic learning companion roadmap built securely by AI.");
      } else {
        triggerToast("error", data.error || "Failed to map core engineering milestones.");
      }
    } catch (err) {
      triggerToast("error", "Roadmap AI timed out. Loaded baseline study blueprint.");
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  const handleToggleTopic = (roadmapId: string, stageName: string, topicId: string) => {
    const updated = userRoadmaps.map((r) => {
      if (r.id !== roadmapId) return r;

      let totalTopics = 0;
      let completedCount = 0;

      const updatedStages = r.stages.map((st) => {
        const topics = st.topics.map((tp) => {
          if (st.stageName === stageName && tp.id === topicId) {
            return { ...tp, completed: !tp.completed };
          }
          return tp;
        });

        // Compute inside this stage
        topics.forEach(t => {
          totalTopics++;
          if (t.completed) completedCount++;
        });

        return { ...st, topics };
      });

      const percent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

      const newRm = {
        ...r,
        stages: updatedStages,
        progressPercent: percent,
        lastUpdated: new Date().toISOString()
      };

      if (selectedRoadmap?.id === roadmapId) {
        setSelectedRoadmap(newRm);
      }

      return newRm;
    });

    saveRoadmapsToLocalStorage(updated);
  };

  const deleteRoadmap = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = userRoadmaps.filter(r => r.id !== id);
    saveRoadmapsToLocalStorage(updated);
    if (selectedRoadmap?.id === id) {
      setSelectedRoadmap(updated.length > 0 ? updated[0] : null);
    }
    triggerToast("success", "Roadmap companion archived.");
  };

  const handleAskCoach = async () => {
    setGeneratingCoach(true);
    setAiCoachOutput('');
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: user.name,
          branch: user.branch,
          interests: coachInterests,
          readingHistory: issuedHistory.map(i => i.bookTitle)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAiCoachOutput(data.personalizedRecommendations);
      } else {
        triggerToast("error", "AI adviser is temporarily taking a class.");
      }
    } catch {
      triggerToast("error", "Adviser pipeline failure.");
    } finally {
      setGeneratingCoach(false);
    }
  };

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const val = interestInput.trim();
    if (val && !coachInterests.includes(val)) {
      setCoachInterests([...coachInterests, val]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (item: string) => {
    setCoachInterests(coachInterests.filter(i => i !== item));
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setFeedbackSuccess(false);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          rating: feedbackRating,
          comment: feedbackComment,
          category: feedbackCategory
        })
      });

      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackComment('');
        triggerToast("success", "Feedback posted directly to central D-LIB records.");
      } else {
        triggerToast("error", "Feedback log was rejected.");
      }
    } catch (err) {
      triggerToast("error", "Feedback upload failed.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Fine Alerts
  const activeFines = issuedHistory.reduce((sum, item) => sum + (item.status === 'approved' ? item.fine : 0), 0);

  return (
    <div id={id || "student-dashboard-root"} className="space-y-8 pb-12">
      {/* Toast Notifications */}
      {notification && (
        <div id="toast-wrapper" className="fixed bottom-6 right-6 z-55 max-w-sm">
          <div className={`p-4 rounded-xl shadow-lg border text-sm flex items-start gap-2.5 ${
            notification.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300' 
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Hero Welcome banner */}
      <div id="student-hero-banner" className="relative overflow-hidden bg-slate-900 dark:bg-slate-900 p-6 md:p-8 rounded-lg text-white shadow-sm border border-slate-800 dark:border-slate-800">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <GraduationCap className="h-44 w-44 rotate-12" />
        </div>
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-700/80 border border-blue-500/30 text-[10px] uppercase font-bold tracking-widest font-sans">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" /> Dr. Babasaheb Ambedkar Technological University
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Student Portal: {user.name}</h1>
            <p className="mt-1 text-slate-300 text-xs">
              Division: <strong className="text-white font-mono">{user.branch}</strong> • Enrollment ID: <strong className="text-white font-mono">{user.rollNumber}</strong>
            </p>
          </div>

          {activeFines > 0 && (
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-200 px-3 py-1 rounded text-xs font-semibold backdrop-blur-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Settle Outstanding Library Fines: <strong className="text-white font-mono">₹{activeFines}.05</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Animated Study Hub Metrics Panel */}
      <div id="student-live-metrics-console" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden premium-glow-blue">
          {/* Subtly shimmering background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4 w-full md:max-w-md">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-blue-500 uppercase block">INTELLIGENT KNOWLEDGE COPILOT</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase">Your Weekly Learning Velocity</h3>
            </div>

            {/* Custom styled animated linear progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-blue-500 animate-pulse" /> Semester Syllabus Match Target</span>
                <span className="font-bold font-mono">78% Sync Rate</span>
              </div>
              <div className="h-2 w-full bg-slate-105 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-850">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full animate-pulse transition-all duration-1000"
                  style={{ width: '78%' }}
                />
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800/80 pt-3 md:pt-0 md:pl-5 shrink-0">
            <div className="text-left md:text-right">
              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-405 block">Next Milestone Node</span>
              <span className="text-xs font-bold text-slate-800 dark:text-indigo-200 block">Deploy CS-4.2 Stack</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-3xs premium-glow-blue cursor-pointer whitespace-nowrap">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" /> Recalculate AI Course Map
            </div>
          </div>
        </div>

        {/* Live Learning State / Streak box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-blue-500 group-hover:scale-110 transition-transform">
            <Flame className="h-16 w-16" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider text-emerald-500 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Continuous Flow
            </div>
            <h4 className="text-base font-black font-mono mt-1 text-slate-850 dark:text-white">12-Day Streak</h4>
            <p className="text-[10px] text-slate-500 leading-normal mt-0.5">Consecutive logins logging study hours directly to your general profile!</p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex justify-between items-center text-[9px] font-mono">
            <span className="text-slate-400">XP LEVEL UP</span>
            <span className="text-blue-500 font-bold">+45 XP Earned</span>
          </div>
        </div>
      </div>

      {/* Secondary Dashboard Navigation */}
      <div id="student-main-navigation" className="flex flex-wrap gap-2 border-b border-slate-250 dark:border-slate-800 pb-3">
        {[
          { tabId: 'catalog', label: 'E-Catalog & Booking', icon: BookOpen },
          { tabId: 'locker', label: 'Issued Books & Locker', icon: BookCheck },
          { tabId: 'roadmaps', label: 'AI Skill Roadmaps', icon: Compass },
          { tabId: 'tracker', label: 'Learning Tracker', icon: Trophy },
          { tabId: 'ai-coach', label: 'AI Coach Recommendations', icon: Sparkles },
          { tabId: 'feedback', label: 'Campus Feedback Form', icon: MessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tabId;
          return (
            <button
              id={`student-nav-${item.tabId}`}
              key={item.tabId}
              onClick={() => setActiveTab(item.tabId as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer hover:shadow-sm ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md dark:bg-blue-600 border border-blue-500/10"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SPACES */}
      <div id="student-tab-panel">
        {/* TAB 1: BOOK CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md shadow-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  id="student-book-search-field"
                  type="text"
                  placeholder="Query book name, author string, ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Department Selector */}
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <span className="text-xs font-semibold text-slate-550 dark:text-slate-400 font-sans hidden sm:inline whitespace-nowrap">
                  Engineering Division:
                </span>
                <select
                  id="student-department-select"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="block w-full md:w-64 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingBooks ? (
              <div className="text-center py-12">
                <RotateCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
                <p className="text-sm text-slate-505 dark:text-slate-400 font-mono">Catalog sync query executing...</p>
              </div>
            ) : books.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-12 text-center rounded-2xl">
                <BookOpen className="h-12 w-12 text-slate-350 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No textbooks identified</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
                  Try clearing search filters or departments. Alternatively, submit a recommendation report.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <StudentBookCard
                    key={book.id}
                    book={book}
                    user={user}
                    handleIssueRequest={handleIssueRequest}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LIBRARY LOCKER */}
        {activeTab === 'locker' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Active Library Locker Checkouts</h2>
            
            {issuedHistory.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-12 text-center rounded-2xl">
                <BookCheck className="h-12 w-12 text-slate-350 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Locker Empty</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  You haven't requested or checked out any academic textbooks yet. Explore our Central catalog tab to begin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {issuedHistory.map((issue) => {
                  const isApproved = issue.status === 'approved';
                  const isPending = issue.status === 'pending';
                  const isReturned = issue.status === 'returned';
                  const isRenewalPending = issue.status === 'renewal_pending';
                  const isRejected = issue.status === 'rejected';

                  // Is overdue check (using simulated June 2, 2026 datum)
                  const isOverdue = isApproved && issue.dueDate && new Date("2026-06-02T07:13:59Z") > new Date(issue.dueDate);

                  let badgeColor = "bg-slate-100 text-slate-700";
                  if (isApproved) badgeColor = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50";
                  if (isPending) badgeColor = "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200/50";
                  if (isRenewalPending) badgeColor = "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50";
                  if (isReturned) badgeColor = "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/50";
                  if (isRejected) badgeColor = "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200/50";

                  return (
                    <div
                      id={`locker-issue-${issue.id}`}
                      key={issue.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.025]"
                    >
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-450 dark:text-slate-500 font-monoID">
                            ISSUE ID: #{issue.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold leading-relaxed capitalize ${badgeColor}`}>
                            {issue.status.replace("_", " ")}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                            {issue.bookTitle}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Issue Requested on: <span className="font-semibold text-slate-700 dark:text-slate-350">{issue.requestDate}</span>
                          </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-850 font-sans text-xs space-y-1.5">
                          {issue.dueDate && (
                            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                              <span className="text-slate-450 dark:text-slate-500 font-medium">Due Date:</span>
                              <span className={`font-bold ${isOverdue ? 'text-red-500 font-extrabold' : 'text-slate-700 dark:text-slate-200'}`}>
                                {issue.dueDate} {isOverdue && '(Overdue)'}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-705 dark:text-slate-300">
                            <span className="text-slate-450 dark:text-slate-500 font-medium font-sans">Borrow Duration:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{issue.durationDays} Days</span>
                          </div>
                          {isReturned && (
                            <div className="flex justify-between text-slate-705 dark:text-slate-300">
                              <span className="text-slate-450 dark:text-slate-500 font-medium font-sans">Return Registered:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{issue.returnDate}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-150 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-450 font-bold font-sans">Accrued Overdue Fees:</span>
                            <span className={`text-sm font-black ${issue.fine > 0 ? 'text-red-650 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-450'}`}>
                              ₹{issue.fine}.00
                            </span>
                          </div>
                        </div>

                        {isOverdue && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                            <span>This book is past its return date. Please return it to the central desk.</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex gap-2">
                        {isApproved && (
                          <button
                            id={`request-renewal-action-${issue.id}`}
                            onClick={() => handleRenewalRequest(issue.id, 7)}
                            className="flex-1 py-2 border border-blue-200 dark:border-slate-800 hover:border-blue-500 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-850 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                            Request Renewal (+7 Days)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SMART LEARNING CENTER (ROADMAPS) */}
        {activeTab === 'roadmaps' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar of roadmap checklists */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Map Out Your Careers</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
                  Enter a domain or technical engineering vertical. Our server-side Gemini system will compose beginner, intermediate, and advanced tasks checklist parameters.
                </p>
              </div>

              <form onSubmit={handleGenerateRoadmap} className="space-y-3">
                <div className="relative shadow-xs">
                  <input
                    id="skill-generate-input"
                    type="text"
                    required
                    placeholder="e.g. React Frontend, Docker Container, ML pipelines..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="block w-full px-3.5 py-2 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm focus:bg-white"
                  />
                </div>
                <button
                  id="skill-generate-action-btn"
                  type="submit"
                  disabled={generatingRoadmap}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-650 dark:hover:bg-blue-750 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                >
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                  {generatingRoadmap ? "Drafting Syllabus Blueprint..." : "Instruct AI Roadmap Engine"}
                </button>
              </form>

              {userRoadmaps.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase font-sans">
                    Tracked Roadmaps ({userRoadmaps.length})
                  </h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {userRoadmaps.map((rm) => (
                      <div
                        id={`roadmap-item-list-${rm.id}`}
                        key={rm.id}
                        onClick={() => setSelectedRoadmap(rm)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedRoadmap?.id === rm.id
                            ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300"
                            : "bg-slate-50/40 dark:bg-slate-950/20 border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-bold truncate max-w-[180px]">{rm.skillName}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full" style={{ width: `${rm.progressPercent}%` }} />
                            </div>
                            <span className="text-[10px] font-bold font-mono">{rm.progressPercent}% Complete</span>
                          </div>
                        </div>
                        <button
                          id={`rm-delete-btn-${rm.id}`}
                          onClick={(e) => deleteRoadmap(rm.id, e)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-500 hover:text-red-650 transition-all cursor-pointer rounded-md border-none"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Roadmap Active Detail view */}
            <div className="lg:col-span-8 space-y-8">
              {selectedRoadmap ? (
                <RoadmapVisualization 
                  roadmap={selectedRoadmap}
                  onToggleTopic={handleToggleTopic}
                />
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-3xs">
                  <Compass className="h-12 w-12 text-slate-350 dark:text-slate-600 mx-auto mb-3 animate-[spin_40s_linear_infinite]" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Roadmap Canvas</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mt-1 leading-relaxed">
                    Write standard engineering topics into the prompt editor to generate advanced personalized pathways with checkboxes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: LEARNING PROGRESS TRACKER */}
        {activeTab === 'tracker' && (() => {
          const completedTopicsCount = trackerData.topics.filter(t => t.completed).length;
          const totalTopicsCount = trackerData.topics.length;
          const remainingCount = totalTopicsCount - completedTopicsCount;
          const completionPercentage = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;
          
          // Est hours computation: 2.5 hours per remaining topic
          const estHours = remainingCount * 2.5;
          const estHoursFormatted = estHours % 1 === 0 ? `${estHours} hrs` : `${Math.floor(estHours)} hrs 30 mins`;

          // Date based calculations
          const getCompletedCountInDays = (days: number) => {
            return trackerData.topics.filter(t => {
              if (!t.completed) return false;
              if (!t.completedAt) return true; // fallback
              const diffMs = Date.now() - new Date(t.completedAt).getTime();
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
              return diffDays <= days;
            }).length;
          };

          const completedThisWeek = getCompletedCountInDays(7);
          const completedThisMonth = getCompletedCountInDays(30);

          // Goal ratios
          const weeklyRatio = Math.min(100, Math.round((completedThisWeek / (trackerData.weeklyGoal || 1)) * 100));
          const monthlyRatio = Math.min(100, Math.round((completedThisMonth / (trackerData.monthlyGoal || 1)) * 100));

          // Badges achievements
          const achievementsList = [
            {
              id: "first_module",
              title: "First Mile Init",
              desc: "Completed 1 or more topics",
              unlocked: completedTopicsCount >= 1,
              icon: Award,
              color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40",
            },
            {
              id: "weekly_champion",
              title: "Weekly Pioneer",
              desc: `Completed ${completedThisWeek}/${trackerData.weeklyGoal} topics this week`,
              unlocked: completedThisWeek >= trackerData.weeklyGoal,
              icon: Target,
              color: "text-blue-650 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40",
            },
            {
              id: "monthly_maestro",
              title: "Monthly Smasher",
              desc: `Completed ${completedThisMonth}/${trackerData.monthlyGoal} topics this month`,
              unlocked: completedThisMonth >= trackerData.monthlyGoal,
              icon: Trophy,
              color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40",
            },
            {
              id: "branch_master",
              title: `${user.branch.split(" ")[0]} Scholar`,
              desc: `Completed 3+ default branch topics`,
              unlocked: trackerData.topics.filter(t => t.completed && !t.id.startsWith("custom_")).length >= 3,
              icon: GraduationCap,
              color: "text-emerald-650 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40",
            },
            {
              id: "customizer",
              title: "Knowledge Architect",
              desc: "Registered at least one custom topic",
              unlocked: trackerData.topics.some(t => t.id.startsWith("custom_")),
              icon: Plus,
              color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40",
            },
            {
              id: "full_concordance",
              title: "Grand Scholar",
              desc: "All registered modules completed",
              unlocked: totalTopicsCount > 0 && completedTopicsCount === totalTopicsCount,
              icon: Star,
              color: "text-rose-650 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/40",
            }
          ];

          return (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">Engineering Syllabus Progress Hub</h2>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
                  Manage academic milestones, set recurring research goals, check off complex engineering syllabus concepts, and claim intellectual milestone badges.
                </p>
              </div>

              {/* SECTION: STATS ROW GRID */}
              <div id="tracker-stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between shadow-3xs text-slate-900 dark:text-white">
                  <div>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-wider block font-bold">Total Completion</span>
                    <strong className="text-2xl font-black text-blue-650 dark:text-blue-400 font-mono block mt-1">{completionPercentage}%</strong>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-mono text-xs font-bold ring-1 ring-blue-105/10">
                    %
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between shadow-3xs text-slate-900 dark:text-white">
                  <div>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-wider block font-bold">Completed Topics</span>
                    <strong className="text-2xl font-black text-slate-850 dark:text-white font-mono block mt-1">{completedTopicsCount} <span className="text-xs text-slate-400 font-medium">/ {totalTopicsCount}</span></strong>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/35 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between shadow-3xs text-slate-900 dark:text-white">
                  <div>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-wider block font-bold">Remaining Modules</span>
                    <strong className="text-2xl font-black text-slate-850 dark:text-white font-mono block mt-1">{remainingCount} <span className="text-xs text-slate-400 font-medium">left</span></strong>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-rose-50 dark:bg-rose-955/20 flex items-center justify-center text-rose-550 dark:text-rose-400">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between shadow-3xs text-slate-900 dark:text-white">
                  <div>
                    <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-wider block font-bold">Est Study Time</span>
                    <strong className="text-base font-black text-amber-600 dark:text-amber-400 block mt-2.5 font-sans leading-none">{estHoursFormatted}</strong>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-955/25 flex items-center justify-center text-amber-500">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* SECTION: OUTSTANDING PROGRESS BAR */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-800 shadow-3xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-sans uppercase tracking-wider text-[10px]">Academic Mastery Level</span>
                  <span className="font-bold font-mono text-blue-650 dark:text-blue-400">{completionPercentage}% Completed</span>
                </div>
                <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-3xs border border-slate-205/30 dark:border-slate-750">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                  />
                </div>
              </div>

              {/* CORE DASHBOARD WORKSPACE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900 dark:text-white">
                {/* LEFT 5 COLUMNS: GOALS SETUP & ACHIEVEMENTS */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Goal setters card */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-3xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <Target className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider font-sans">Set Weekly &amp; Monthly Goals</h3>
                    </div>

                    <form onSubmit={handleSaveGoals} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Weekly Goal</label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            required
                            value={weeklyGoalInput}
                            onChange={(e) => setWeeklyGoalInput(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-650 text-slate-850 dark:text-white h-8"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 font-sans">Monthly Goal</label>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            required
                            value={monthlyGoalInput}
                            onChange={(e) => setMonthlyGoalInput(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-650 text-slate-850 dark:text-white h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 pt-1">
                        <div className="flex justify-between items-center text-[11px] text-slate-550 dark:text-slate-400">
                          <span className="font-semibold">Weekly Goal Progress ({completedThisWeek} / {trackerData.weeklyGoal}):</span>
                          <span className="font-bold font-mono">{weeklyRatio}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${weeklyRatio}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-slate-550 dark:text-slate-400 pt-1">
                          <span className="font-semibold">Monthly Goal Progress ({completedThisMonth} / {trackerData.monthlyGoal}):</span>
                          <span className="font-bold font-mono">{monthlyRatio}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${monthlyRatio}%` }} />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-slate-800 hover:bg-slate-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer font-sans shadow-sm"
                      >
                        Pin Academic Targets
                      </button>
                    </form>
                  </div>

                  {/* Achievements Badge Grid */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-3xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <Trophy className="h-4.5 w-4.5 text-amber-500" />
                      <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider font-sans">Scholastic Achievements ({achievementsList.filter(a=>a.unlocked).length}/6)</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-1">
                      {achievementsList.map((badge) => {
                        const BadgeIcon = badge.icon;
                        return (
                          <div
                            key={badge.id}
                            className={`p-3 rounded-xl flex gap-3 items-center border transition-all ${
                              badge.unlocked 
                                ? `${badge.color} shadow-3xs scale-100` 
                                : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-40 grayscale"
                            }`}
                          >
                            <div className="p-2 rounded-full bg-white dark:bg-slate-900 shadow-3xs shrink-0 ring-1 ring-black/5 dark:ring-white/5">
                              <BadgeIcon className="h-4 w-4 shrink-0" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black tracking-wide block uppercase font-sans">{badge.title}</span>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{badge.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* RIGHT 7 COLUMNS: ACTIVE TOPICS LIST CHECKLIST */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-3xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4.5 w-4.5 text-indigo-500" />
                        <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider font-sans">Course Topic Checklist</h3>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded border border-slate-200/50 dark:border-slate-800 text-slate-500 font-bold dark:text-slate-300 bg-transparent">
                        {completedTopicsCount} / {totalTopicsCount} Modules Completed
                      </span>
                    </div>

                    {/* Quick custom addition */}
                    <form onSubmit={handleAddTopic} className="bg-slate-50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          placeholder="Inject a new syllabus topic..."
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          className="w-full h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:border-indigo-600"
                        />
                      </div>
                      <div className="w-full sm:w-40">
                        <input
                          type="text"
                          placeholder="Subject label"
                          value={newTopicSubject}
                          onChange={(e) => setNewTopicSubject(e.target.value)}
                          className="w-full h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:border-indigo-600"
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase rounded-lg transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1 shrink-0"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Topic
                      </button>
                    </form>

                    {/* Topics lists and checkboxes */}
                    {totalTopicsCount === 0 ? (
                      <div className="text-center py-16">
                        <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Your study checklist is empty</h4>
                        <p className="text-xs text-slate-550 mt-1 max-w-xs mx-auto dark:text-slate-400">Click "Add Topic" or reload initial branch components to start your learning journey.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                        {trackerData.topics.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between transition-all group ${
                              item.completed 
                                ? "bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-950/40 text-slate-505 dark:text-slate-400" 
                                : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 text-slate-850 dark:text-white hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleSyllabusTopic(item.id)}
                                className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                                  item.completed 
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs" 
                                    : "border-slate-350 dark:border-slate-700 hover:border-blue-650 bg-white dark:bg-slate-955"
                                }`}
                              >
                                {item.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </button>
                              <div>
                                <span className={`text-xs font-bold leading-tight block ${item.completed ? "line-through opacity-60" : ""}`}>
                                  {item.title}
                                </span>
                                <span className="inline-block text-[9px] font-semibold text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                                  {item.subject}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTopic(item.id)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer shrink-0"
                              title="Delete Topic"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 4: PERSONAL AI COACH */}
        {activeTab === 'ai-coach' && (
          <AICopilotHub user={user} books={books} />
        )}

        {/* TAB 5: STUDENT FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-xs max-w-2xl mx-auto space-y-6">
            <div className="space-y-1 text-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-1" />
              <h2 id="feedback-panel-header" className="text-xl font-extrabold text-slate-900 dark:text-white">
                General Campus Service Review Form
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Feedback reports are recorded directly in the admin audit panel to improve central D-LIB library efficiency.
              </p>
            </div>

            {feedbackSuccess && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-450 text-xs text-center font-semibold">
                Report logged successfully! Thank you for supporting D-LIB technological systems.
              </div>
            )}

            <form onSubmit={submitFeedback} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Performance Category
                </label>
                <select
                  id="feedback-category-picker"
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  <option value="General System">General Software Experience</option>
                  <option value="Content Catalog">Textbook Inventory Catalog</option>
                  <option value="Roadmap Suggestion">AI Learning Roadmaps Accuracy</option>
                  <option value="Librarian Desk">Physical Desk Service Speed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rating (Out of 5 Stars)
                </label>
                <div className="flex gap-2 justify-center py-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-900">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setFeedbackRating(starVal)}
                      className="p-1 hover:scale-105 border-none bg-transparent cursor-pointer transition-all"
                    >
                      <Star className={`h-8 w-8 ${
                        starVal <= feedbackRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Detailed Observations / Request Summary
                </label>
                <textarea
                  id="feedback-detailed-comment"
                  required
                  rows={4}
                  placeholder="e.g. Algorithms books copies need expansion..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="block w-full px-3.5 py-2 border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-905 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-sans focus:bg-white"
                />
              </div>

              <button
                id="submit-feedback-btn"
                type="submit"
                disabled={submittingFeedback}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-650 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border-none"
              >
                <Send className="h-4.5 w-4.5 text-white" />
                {submittingFeedback ? "Transmitting evaluation packet..." : "Submit Campus Feedback"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
