import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Library, 
  Sparkles, 
  GraduationCap, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  Quote, 
  Search, 
  Layers, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  X,
  Compass,
  ArrowUpRight,
  BookMarked,
  Activity,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  Cpu,
  Share2
} from "lucide-react";
import Login from "./Login";

interface InteractiveBookCardProps {
  key?: any;
  book: BookInfo;
  triggerLoginPortal: (role: 'student' | 'admin') => void;
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

const InteractiveBookCard = ({ book, triggerLoginPortal }: InteractiveBookCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const availabilityPercent = Math.round((book.available / book.total) * 100);
  const isUrgent = availabilityPercent <= 50;
  const coverUrl = getBookCoverUrl(book.id, book.title);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-3xs transition-all duration-300 relative overflow-hidden h-[310px]"
    >
      <div className="space-y-2 h-full flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold px-1.5 py-0.5 tracking-wider font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950 rounded uppercase border border-emerald-100 dark:border-emerald-900/40">
              {book.id}
            </span>
            <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-550 uppercase tracking-widest font-sans">
              {book.category}
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-slate-850 dark:text-white leading-snug line-clamp-1 uppercase">
            {book.title}
          </h3>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium leading-tight">
            by {book.author}
          </p>

          <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-sans line-clamp-3">
            {book.description}
          </p>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="font-semibold line-clamp-1">{book.location}</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase">
              <span className="text-slate-500 dark:text-slate-400">Available copies</span>
              <span className={isUrgent ? "text-amber-600 dark:text-amber-500" : "text-emerald-700 dark:text-emerald-500"}>
                {book.available} / {book.total}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
              <div 
                className={`h-full rounded transition-all duration-500 ${
                  isUrgent ? "bg-amber-500" : "bg-emerald-600"
                }`}
                style={{ width: `${availabilityPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slide-Up Hover Details Animating Showcase Overlay with Photo & Enhanced Info */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="absolute inset-0 bg-[#09150E]/98 dark:bg-slate-950/98 text-white p-5 rounded-2xl flex flex-col justify-between z-20 border border-emerald-500/30 shadow-2xl premium-glow-blue"
          >
            <div className="flex gap-3 h-[70%]">
              {/* Photo on the left or right */}
              <div className="w-[38%] h-full rounded-lg overflow-hidden border border-emerald-500/10 shrink-0 relative bg-gradient-to-br from-emerald-800 to-emerald-950 flex flex-col justify-between p-2">
                <div className="absolute left-1 inset-y-0 w-[2.5px] bg-emerald-400/20" />
                <div className="flex flex-col gap-0.5 z-10 pl-1 overflow-hidden pointer-events-none">
                  <span className="text-[6.5px] font-mono tracking-wider text-emerald-300 font-extrabold truncate uppercase">{book.category}</span>
                  <span className="text-[7.5px] font-black leading-tight uppercase text-white line-clamp-3 leading-none">{book.title}</span>
                </div>
                <div className="z-10 pl-1 text-[5.5px] font-mono text-emerald-350 tracking-wider font-semibold truncate leading-none uppercase pointer-events-none">DBATU D-LIB</div>

                <img 
                  src={coverUrl} 
                  alt={book.title}
                  className={`absolute inset-0 w-full h-full object-cover transform scale-100 hover:scale-110 transition-all duration-700 z-15 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
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
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-transparent to-transparent z-16 pointer-events-none" />
                <span className="absolute bottom-1 left-1.5 text-[8px] font-mono uppercase bg-black/40 px-1 py-0.2 rounded text-[7px] text-amber-300 z-17">
                  REF_IMG
                </span>
              </div>

              {/* Textual Details on the right */}
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[7px] font-mono uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{book.id}</span>
                    <span className="text-[8px] text-slate-350 font-sans tracking-wide uppercase">{book.category}</span>
                  </div>
                  <h4 className="text-[11px] font-black tracking-tight leading-tight uppercase line-clamp-2 text-slate-100">
                    {book.title}
                  </h4>
                  <p className="text-[9px] font-mono text-amber-300">by {book.author}</p>
                </div>

                <p className="text-[9px] text-slate-300 leading-snug line-clamp-3 font-sans italic">
                  "{book.description}"
                </p>
              </div>
            </div>

            {/* Availability details & Login Request Button */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-slate-400">INDEX: {book.location.split(' ')[0]}</span>
                <span className="text-emerald-400 uppercase font-bold">
                  {book.available} COPIES INSIDE
                </span>
              </div>

              <button
                onClick={() => triggerLoginPortal('student')}
                className="w-full h-8 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-550 text-white text-[10px] uppercase tracking-widest font-extrabold rounded-lg transition-all cursor-pointer border border-white/10 active:scale-95"
              >
                <BookMarked className="h-3.5 w-3.5" />
                Instant Sign In & Request
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface LandingPageProps {
  onLoginSuccess: (user: any) => void;
}

interface BookInfo {
  id: string;
  title: string;
  author: string;
  category: "Computer Science" | "Mechanical" | "Electrical" | "Chemical" | "General";
  available: number;
  total: number;
  location: string;
  description: string;
}

interface Thought {
  quote: string;
  author: string;
  role: string;
}

const FEATURED_BOOKS: BookInfo[] = [
  {
    id: "BK-001",
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen, Charles E. Leiserson",
    category: "Computer Science",
    available: 12,
    total: 15,
    location: "Rack CS-01 (Ground Floor)",
    description: "The definitive guide to algorithmic analysis, dynamic programming, and data structure architectures."
  },
  {
    id: "BK-002",
    title: "Design of Machine Elements",
    author: "V.B. Bhandari",
    category: "Mechanical",
    available: 8,
    total: 10,
    location: "Rack ME-04 (First Floor)",
    description: "Comprehensive study of mechanical engineering design principles, load stresses, and material fatigue."
  },
  {
    id: "BK-003",
    title: "Modern Power System Analysis",
    author: "D.P. Kothari, I.J. Nagrath",
    category: "Electrical",
    available: 5,
    total: 8,
    location: "Rack EE-02 (Ground Floor)",
    description: "Essentials of load flow studies, voltage regulators, wave power grids, and fault calculations."
  },
  {
    id: "BK-004",
    title: "Database System Concepts",
    author: "Abraham Silberschatz, Henry F. Korth",
    category: "Computer Science",
    available: 14,
    total: 20,
    location: "Rack CS-03 (Ground Floor)",
    description: "Foundational textbook explaining database engines, relational algebra, SQL optimization, and NoSQL."
  },
  {
    id: "BK-005",
    title: "Chemical Reaction Engineering",
    author: "Octave Levenspiel",
    category: "Chemical",
    available: 4,
    total: 6,
    location: "Rack CH-01 (Second Floor)",
    description: "An introduction to reactor design, kinetics, flow patterns, and catalytic reaction operations."
  },
  {
    id: "BK-006",
    title: "Advanced Engineering Mathematics",
    author: "N.P. Bali, Manish Goyal",
    category: "General",
    available: 19,
    total: 25,
    location: "Rack GEN-02 (First Floor)",
    description: "Rigorous mathematical reference focusing on Laplace transforms, partial derivatives, and complex analysis."
  },
  {
    id: "BK-007",
    title: "Operating System Concepts",
    author: "Abraham Silberschatz, Peter B. Galvin",
    category: "Computer Science",
    available: 10,
    total: 12,
    location: "Rack CS-02 (Ground Floor)",
    description: "Core explanations on processes, virtual memory management, distributed systems, thread allocation, and security protocols."
  },
  {
    id: "BK-008",
    title: "Heat and Mass Transfer",
    author: "P.K. Nag",
    category: "Mechanical",
    available: 3,
    total: 5,
    location: "Rack ME-02 (First Floor)",
    description: "Fundamental formulas, convection heat transfer rates, thermal resistance circuits, and heat exchanger diagnostics."
  },
  {
    id: "BK-009",
    title: "Power System Engineering",
    author: "D.P. Kothari, I.J. Nagrath",
    category: "Electrical",
    available: 7,
    total: 9,
    location: "Rack EE-01 (Ground Floor)",
    description: "Covers hydro-electric thermal power lines, tariffs, line parameter installations, and short-circuit load currents."
  },
  {
    id: "BK-010",
    title: "Elements of Chemical Reaction Engineering",
    author: "H. Scott Fogler",
    category: "Chemical",
    available: 2,
    total: 6,
    location: "Rack CH-03 (Second Floor)",
    description: "Rigorous study of chemical dynamics, reactor sizing, steady-state reactors, nonisothermal designs, and mass transfer."
  },
  {
    id: "BK-011",
    title: "Introduction to Machine Learning",
    author: "Ethem Alpaydin",
    category: "Computer Science",
    available: 5,
    total: 8,
    location: "Rack CS-05 (Ground Floor)",
    description: "A comprehensive introductory guide to supervised classifiers, regressions, tree deciders, and artificial neural networks."
  },
  {
    id: "BK-012",
    title: "Structural Analysis & Steel Design",
    author: "S. S. Bhavikatti",
    category: "General",
    available: 6,
    total: 8,
    location: "Rack CIVIL-01 (Third Floor)",
    description: "Elementary theories of beams, truss deflections, civil steel arches, and structural rigidity designs for construction."
  }
];

const INSPIRATIONAL_THOUGHTS: Thought[] = [
  {
    quote: "Cultivation of mind should be the ultimate aim of human existence.",
    author: "Dr. B. R. Ambedkar",
    role: "Founding Father of India & Scholar"
  },
  {
    quote: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
    role: "Musician & Educator"
  },
  {
    quote: "To succeed in your mission, you must have single-minded devotion to your goal.",
    author: "Dr. A.P.J. Abdul Kalam",
    role: "Aerospace Scientist & Former President"
  },
  {
    quote: "The science of today is the technology of tomorrow.",
    author: "Edward Teller",
    role: "Theoretical Physicist"
  }
];

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginPreSelect, setLoginPreSelect] = useState<'student' | 'admin'>('student');

  // Interactive Live Dashboard Sandbox State Controllers
  const [activeSimulatorTab, setActiveSimulatorTab] = useState<'overview' | 'ai-copilot' | 'tracker'>('overview');
  const [testMatchScore, setTestMatchScore] = useState(88);
  const [streakCount, setStreakCount] = useState(12);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([
    "Initial link handshake with D-LIB central knowledge stream.",
    "User authenticated with modern multi-factor dynamic keys.",
    "Synchronized 4 engineering syllabus core subjects with local tracker."
  ]);

  // Simulation Automatic Loop Ticker
  useEffect(() => {
    const cycleTabs = ['overview', 'ai-copilot', 'tracker'];
    let curLogIndex = 0;
    const fallbackLogs = [
      "User 'DBATU1001' completed 'Introduction to Algorithms' roadmap.",
      "Locker status: verified 100% security indices.",
      "Recalculating matching correlation vectors... Done.",
      "Campus feed synchronized with 200 concurrent student books.",
      "New administrative circular indexed: 'DBATU Semester Exam reference textbooks'.",
      "Dynamic streak count increments by 1 day sequence.",
    ];

    const timer = setInterval(() => {
      // 1. Cycle tabs periodically in the background
      setActiveSimulatorTab(prev => {
        const idx = cycleTabs.indexOf(prev);
        return cycleTabs[(idx + 1) % cycleTabs.length] as any;
      });

      // 2. Add randomized status events
      setSimulationLogs(prev => {
        const nextLog = fallbackLogs[curLogIndex % fallbackLogs.length];
        curLogIndex++;
        return [nextLog, ...prev.slice(0, 3)];
      });

      // 3. Keep stats dynamic
      setTestMatchScore(Math.floor(Math.random() * 15) + 84);
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  const categories = ["All", "Computer Science", "Mechanical", "Electrical", "Chemical", "General"];

  const filteredBooks = FEATURED_BOOKS.filter(book => {
    const matchesCat = selectedCategory === "All" || book.category === selectedCategory;
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          book.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const triggerLoginPortal = (role: 'student' | 'admin') => {
    setLoginPreSelect(role);
    setShowLoginModal(true);
  };

  return (
    <div id="landing-container" className="space-y-12 py-2">
      
      {/* Premium Integrated Navigation Header from Screenshot */}
      <header id="landing-nav-header" className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          {/* Logo icon wrapper in emerald matching the brand */}
          <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.35)] border border-emerald-400/20 shrink-0">
            <Library className="h-5.5 w-5.5 text-slate-950 shrink-0" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-wide text-slate-900 dark:text-slate-100 uppercase font-sans leading-none flex items-center gap-1.5">
              D-LIB
            </span>
            <span className="text-[8px] text-slate-450 dark:text-slate-400 tracking-widest font-mono font-extrabold uppercase leading-none mt-1.5">
              UNIVERSITY LIBRARY SYSTEMS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => triggerLoginPortal('admin')}
            className="text-[11px] font-bold text-slate-505 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors uppercase tracking-wider cursor-pointer"
          >
            Librarian Portal
          </button>
          <button
            onClick={() => triggerLoginPortal('student')}
            className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-slate-950 text-[11px] font-black tracking-wider uppercase px-4.5 py-2 rounded-lg transition-all shadow-[0_4px_14px_-2px_rgba(16,185,129,0.4)] border border-emerald-400/20 hover:scale-[1.025] cursor-pointer"
          >
            Student Portal
          </button>
        </div>
      </header>

      {/* 1. Hero Dynamic Presentation matching screenshot perfectly */}
      <section 
        id="landing-hero"
        className="relative overflow-hidden bg-slate-955 text-white rounded-2xl p-8 md:p-12 border border-slate-900 shadow-2xl"
      >
        {/* Subtle decorative glowing background layers resembling the screenshot */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[240px] h-[240px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Abstract structural grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-stretch gap-10">
          
          {/* Left Column Text details matching screenshot */}
          <div className="space-y-6 max-w-2xl text-left flex flex-col justify-center">
            
            {/* Small tag badge */}
            <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-100 font-sans">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400/20" /> 
              Next-Generation AI Enabled Learning
            </div>
            
            {/* Direct Heading exact words with highlighted span */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] font-sans">
              Empower Your <span className="text-emerald-400">Academic</span> <br />
              <span className="text-emerald-400">Journey</span> With AI <br />
              Intelligence
            </h1>
            
            {/* Exact words subtitle description */}
            <p className="text-xs sm:text-[13px] leading-relaxed text-slate-350 max-w-lg">
              An intelligent university academic environment combining a catalog shelf with customized learning roadmap algorithms, study schedule builders, automated queues, and real-time faculty statistics.
            </p>
            
            {/* Split Landing Entry triggers */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <button
                onClick={() => triggerLoginPortal('student')}
                className="inline-flex items-center justify-center gap-1.5 px-5 h-11 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_5px_15px_-4px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer"
              >
                Join as Student <ArrowRight className="h-4 w-4 stroke-[3px]" />
              </button>
              
              <button
                onClick={() => triggerLoginPortal('admin')}
                className="inline-flex items-center justify-center gap-1.5 px-4.5 h-11 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                Librarian Access <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Right Column Custom AI Dashboard Simulation Widget matching screenshot */}
          <div className="flex-1 flex items-center justify-center lg:justify-end">
            <div 
              id="ai-hero-sim-panel"
              className="w-full max-w-md bg-[#091118]/85 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/20 shadow-[0_0_35px_rgba(16,185,129,0.15)] space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-[#10B981] font-mono flex items-center gap-1.5 uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" /> AI Recommendation Engine
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-bold text-emerald-400 rounded uppercase tracking-wider">
                  Online
                </span>
              </div>

              {/* Inside Recommended Panel */}
              <div className="bg-[#111A22]/90 border border-slate-800 rounded-xl p-4.5 space-y-1">
                <div className="text-[11px] font-black text-slate-100 uppercase tracking-wide leading-tight">
                  Recommended: "Advanced Machine Learning Algorithms"
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  Matched 98% with your Python Core roadmap progress.
                </div>
              </div>

              {/* Progress Panel */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400 font-mono">Roadmap Progress</span>
                  <span className="text-emerald-400 font-mono">75%</span>
                </div>
                <div className="w-full h-1.5 bg-[#16232D] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-3/4" />
                </div>
              </div>

              {/* Bottom Twin Columns statistics */}
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <div className="bg-[#111A22]/90 p-3.5 rounded-xl border border-slate-800/80 text-center">
                  <div className="text-base font-black text-slate-200">5 Days</div>
                  <div className="text-[8px] text-slate-450 uppercase tracking-wider font-bold">Reading Streak</div>
                </div>
                <div className="bg-[#111A22]/90 p-3.5 rounded-xl border border-slate-800/80 text-center">
                  <div className="text-base font-black text-[#10B981]">240 pts</div>
                  <div className="text-[8px] text-slate-455 uppercase tracking-wider font-bold">Academic Points</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 1.5 Animated Student Dashboard Preview Showcase Simulator */}
      <section id="landing-dashboard-mockup" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Cpu className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-850 dark:text-white">
                Live Interface Simulation
              </h2>
              <p className="text-[10px] text-slate-450 dark:text-slate-400">Experience our interactive student co-pilot dashboard preview with live background state runs</p>
            </div>
          </div>
          <div className="inline-flex self-start sm:self-auto items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono uppercase tracking-wider text-emerald-400 antialiased font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Client Simulator
          </div>
        </div>

        {/* The Live Active Playground Dashboard Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#0F091C]/52 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl relative overflow-hidden shadow-2xl premium-glow-blue">
          
          {/* Internal background glow effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Left Column: Interactive Mini Control Panel */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800/60 pb-5 lg:pb-0 lg:pr-5">
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono font-bold text-blue-500 tracking-widest block">Dashboard Sandbox Controller</span>
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase">Simulate App States</h3>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 leading-relaxed">
                  Toggle different platform modes or manually trigger a neural match generation to view dynamic screen transitions.
                </p>
              </div>

              {/* Mode toggles */}
              <div className="space-y-2">
                {[
                  { tabId: 'overview', label: 'E-Locker & Summary', icon: Activity },
                  { tabId: 'ai-copilot', label: 'AI Match Analysis', icon: Sparkles },
                  { tabId: 'tracker', label: 'Syllabus Roadmaps', icon: Target },
                ].map((m) => {
                  const Icon = m.icon;
                  const isActive = activeSimulatorTab === m.tabId;
                  return (
                    <button
                      key={m.tabId}
                      onClick={() => setActiveSimulatorTab(m.tabId as any)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 transform active:scale-95 cursor-pointer border ${
                        isActive
                          ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-purple-900/10"
                          : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                        {m.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded font-mono text-[9px]">Live</span>
                    </button>
                  );
                })}
              </div>

              {/* Manual Simulation triggers */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const newScore = Math.floor(Math.random() * 15) + 82;
                    setTestMatchScore(newScore);
                    setStreakCount(prev => prev + 1);
                    const list = [
                      `Recalculating match index: Committed search variables.`,
                      `New AI recommendation match computed: ${newScore}% relevance rating!`,
                      `Synced student learning streak: Level up to ${streakCount + 1} continuous days!`,
                      `Allocating CPU cycles to syllabus compilation threads.`
                    ];
                    setSimulationLogs(prev => [list[Math.floor(Math.random() * list.length)], ...prev.slice(0, 3)]);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border border-white/10"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin" />
                  Trigger Neural Match Run
                </button>
              </div>
            </div>

            {/* Realtime Terminal Status Ticker */}
            <div className="bg-white/40 dark:bg-slate-950/70 border border-slate-150 dark:border-slate-855 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-450 uppercase tracking-widest border-b border-slate-200 dark:border-slate-855 pb-1">
                <span>SIMULATED_LOGGER</span>
                <span className="text-emerald-500 animate-ping">●</span>
              </div>
              <div className="space-y-1 font-mono text-[9px] text-slate-700 dark:text-slate-350 leading-tight">
                <AnimatePresence mode="popLayout">
                  {simulationLogs.map((log, idx) => (
                    <motion.div
                      key={log + idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-1 items-start"
                    >
                      <span className="text-blue-500 shrink-0">$</span>
                      <span className="break-all">{log}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column (Dynamic Screens view containing 8 spans grid) */}
          <div className="lg:col-span-8 flex flex-col justify-center min-h-[290px] relative">
            
            <AnimatePresence mode="wait">
              {/* SCREEN STATE 1: OVERVIEW */}
              {activeSimulatorTab === 'overview' && (
                <motion.div
                  key="overkey"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Top quick widgets row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Flame className="h-5 w-5 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-450 uppercase tracking-wider block font-semibold">Active Streak</span>
                        <span className="text-sm font-black font-mono">{streakCount} Days</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-450 uppercase tracking-wider block font-semibold">Reserved Books</span>
                        <span className="text-sm font-black font-mono">3 Vol. Indexed</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Trophy className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-450 uppercase tracking-wider block font-semibold">Total XP Score</span>
                        <span className="text-sm font-black font-mono">340 Points</span>
                      </div>
                    </div>
                  </div>

                  {/* Wide visual statistics dashboard card */}
                  <div className="bg-white dark:bg-slate-855 p-5 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-slate-100">
                          Syllabus Completion Index
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-500 font-bold bg-blue-500/5 px-2 py-0.5 rounded">
                        4 of 6 Milestones Cleared
                      </span>
                    </div>

                    {/* Progress tracking display bar with nested animation */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-450">
                        <span>Database Systems III</span>
                        <span className="font-bold font-mono">67% Done</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-905 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-850">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "67%" }}
                          transition={{ duration: 1.2, delay: 0.1 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-450">
                        <span>Computational Data Science</span>
                        <span className="font-bold font-mono">84% Done</span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-905 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-850">
                        <motion.div
                          initial={{ width: "0%" }}
                          animate={{ width: "84%" }}
                          transition={{ duration: 1.2, delay: 0.3 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCREEN STATE 2: AI CO-PILOT ADVISOR */}
              {activeSimulatorTab === 'ai-copilot' && (
                <motion.div
                  key="copilotkey"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="bg-white dark:bg-slate-950 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono text-purple-400 uppercase font-semibold">
                      <Sparkles className="h-3 w-3 animate-pulse text-amber-400" /> Neural Match Engine
                    </div>

                    <div className="space-y-3">
                      <div className="flex gap-4 items-center">
                        <div className="h-12 w-9 rounded bg-indigo-700/80 border border-indigo-500/20 shadow-xs flex items-center justify-center shrink-0">
                          <BookMarked className="h-5 w-5 text-indigo-100" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-200 font-bold font-mono text-[9px] px-1.5 py-0.2 rounded-full mb-1">
                            {testMatchScore}% Match Target
                          </div>
                          <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 leading-none">
                            Introduction to Algorithms (Cormen)
                          </h4>
                          <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1">
                            Recommended because you recently registered "Data Structures" &amp; finished Sorting Roadmaps.
                          </p>
                        </div>
                      </div>

                      {/* AI Matching progress indicator bar */}
                      <div className="bg-slate-50 dark:bg-slate-905 p-3 rounded-xl border border-slate-200/50 dark:border-slate-850">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Relevance Vector Weights</span>
                          <span className="font-semibold text-blue-500">Satisfies Syllabus Node CS-3.1</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            key={testMatchScore}
                            initial={{ width: "0%" }}
                            animate={{ width: `${testMatchScore}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">
                          Favorite Subject Tag
                        </span>
                        <div className="px-2 py-1 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider rounded">
                          View Index Location
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCREEN STATE 3: SYLLABUS TRACKER */}
              {activeSimulatorTab === 'tracker' && (
                <motion.div
                  key="trackerkey"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <div className="bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold mb-2">My Active Course Roadmap Stages</span>
                    
                    <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 ml-2 space-y-4">
                      
                      {/* Node 1 */}
                      <div className="relative">
                        <span className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 shadow-sm" />
                        <div>
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-xs font-bold text-slate-850 dark:text-slate-100">Stage l: Essential Mechanics</span>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-450 uppercase font-bold font-mono px-1 rounded">Cleared</span>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-0.5">Foundations of engineering layout, basic formulas, and materials.</p>
                        </div>
                      </div>

                      {/* Node 2 */}
                      <div className="relative animate-pulse">
                        <span className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-slate-950 shadow-sm" />
                        <div>
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-xs font-bold text-slate-850 dark:text-slate-100">Stage II: Advance Synthesis &amp; Testing</span>
                            <span className="text-[8px] bg-blue-500/10 text-blue-400 uppercase font-bold font-mono px-1 rounded animate-pulse">Computing</span>
                          </div>
                          <p className="text-[10px] text-slate-455 dark:text-slate-400 mt-0.5">Focusing on modern designs, algorithmic patterns, and dynamic loads.</p>
                        </div>
                      </div>

                      {/* Node 3 */}
                      <div className="relative">
                        <span className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-800 border-2 border-white dark:border-slate-950 shadow-sm" />
                        <div>
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-xs font-bold text-slate-400">Stage III: Career Readiness Desk</span>
                            <span className="text-[8px] bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold font-mono px-1 rounded">Locked</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Complex real-world simulations, interview questions, and capstones.</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </section>

      {/* 2. Inspirational Academic Thoughts Widget */}
      <section id="thoughts-carousel-section" className="space-y-6">
        <div id="thoughts-header" className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-blue-700 dark:text-blue-500" />
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Institutional Beacon Thoughts
            </h2>
          </div>
          <span className="text-[10px] text-slate-455 dark:text-slate-500 font-mono">D-LIB Inspiration Loop</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {INSPIRATIONAL_THOUGHTS.map((t, idx) => (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 p-5 rounded border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-3xs transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.025] hover:shadow-md hover:border-blue-700/20 dark:hover:border-blue-900/30 group"
            >
              <div className="space-y-2">
                <Quote className="h-4 w-4 text-slate-200 dark:text-slate-800 group-hover:text-blue-700 transition-colors" />
                <p className="text-xs text-slate-750 dark:text-slate-300 italic font-sans leading-relaxed">
                  "{t.quote}"
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <h4 className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t.author}</h4>
                <p className="text-[9px] text-slate-500 dark:text-slate-500 font-mono tracking-wider">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Interactive Books E-Catalog Showcase */}
      <section id="landing-book-catalog" className="space-y-6">
        <div id="catalog-headline" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-700 dark:text-blue-500" />
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Academic E-Catalog Preview
              </h2>
              <p className="text-[10px] text-slate-450 dark:text-slate-500">Live physical tracking indices & stack availability</p>
            </div>
          </div>

          {/* Beautiful Inline search filter */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search textbook title, author or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-4 py-1.5 border border-slate-205 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-xs shadow-3xs"
            />
          </div>
        </div>

        {/* Categories Tab selectors */}
        <div id="catalog-category-row" className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 cursor-pointer transition-all text-[10px] font-bold uppercase tracking-wider rounded ${
                selectedCategory === cat 
                  ? "bg-blue-700 text-white shadow-3xs"
                  : "bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Books List Grid output */}
        <div id="featured-books-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <InteractiveBookCard
                key={book.id}
                book={book}
                triggerLoginPortal={triggerLoginPortal}
              />
            ))
          ) : (
            <div className="col-span-full py-8 text-center bg-slate-50 dark:bg-slate-905 rounded border border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
              No academic textbooks match your custom search criteria. Try a different query.
            </div>
          )}
        </div>
      </section>

      {/* 4. Overlap Login Drawer / Modal Gating Stage */}
      <AnimatePresence>
        {showLoginModal && (
          <div 
            id="login-modal-overlay" 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-md w-full bg-slate-50 dark:bg-slate-950 shadow-2xl rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800 max-h-[95vh] overflow-y-auto"
            >
              {/* Close Button Trigger */}
              <button
                id="login-modal-close-trigger"
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all pointer-events-auto cursor-pointer z-50"
                aria-label="Close Portal Entry Modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="p-1">
                {/* Embedded Fully-functional Login module */}
                <Login onLoginSuccess={(user) => {
                  setShowLoginModal(false);
                  onLoginSuccess(user);
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
