import { useState } from "react";
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
  BookMarked
} from "lucide-react";
import Login from "./Login";

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
    <div id="landing-container" className="space-y-16 py-4">
      
      {/* 1. Hero Dynamic Presentation */}
      <section 
        id="landing-hero"
        className="relative overflow-hidden bg-slate-900 text-white rounded-lg p-8 md:p-12 border border-slate-800 shadow-sm"
      >
        {/* Abstract structural grid overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <div className="space-y-6 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-700/80 border border-blue-500/20 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-100 font-sans">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" /> 
              Dr. Babasaheb Ambedkar Technological University Portal
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none font-sans">
              Empowering Minds, <br />
              <span className="text-blue-400">Streamlining Academics</span>
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-300 max-w-lg">
              Welcome to the official central academic Companion of DBATU (Lonere). Explore physical holdings, reserve essential roadmap textbooks, and view real-time circulation queues from a single unified desk.
            </p>
            
            {/* Quick Stats overview cards */}
            <div className="pt-2 grid grid-cols-3 gap-4 max-w-md border-t border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Locker Capacity</span>
                <span className="text-base font-bold font-mono">100% Secure</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Book Reserves</span>
                <span className="text-base font-bold font-mono">Live Sync</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">Catalog</span>
                <span className="text-base font-bold font-mono">2,500+ Vols</span>
              </div>
            </div>
          </div>

          {/* Login Options Container CTA */}
          <div 
            id="login-choices-card" 
            className="w-full lg:w-96 bg-slate-950 p-6 rounded border border-slate-850 space-y-4 shadow-xl"
          >
            <div className="border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-500" />
                Portal Entryways
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Select your access directory to proceed securely</p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Student Hub */}
              <button
                id="cta-gate-student"
                onClick={() => triggerLoginPortal('student')}
                className="w-full p-3.5 rounded bg-blue-700 hover:bg-blue-800 text-white font-bold transition-all duration-300 hover:scale-[1.025] text-xs flex items-center justify-between cursor-pointer group shadow-xs border border-blue-600/40"
              >
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 shrink-0 text-slate-200" />
                  <div className="text-left">
                    <span className="block font-bold">Student Desk</span>
                    <span className="block text-[9px] font-normal text-slate-200">Catalog, syllabus roadmaps & locker</span>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>

              {/* Option 2: Librarian Portal */}
              <button
                id="cta-gate-librarian"
                onClick={() => triggerLoginPortal('admin')}
                className="w-full p-3.5 rounded bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 hover:border-slate-705 text-slate-300 font-bold transition-all duration-300 hover:scale-[1.025] text-xs flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-blue-500" />
                  <div className="text-left">
                    <span className="block font-bold">Librarian Console</span>
                    <span className="block text-[9px] font-normal text-slate-400 tracking-wide">Manage inventory, circulation queues</span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="text-center pt-2">
              <span className="text-[9px] font-mono font-semibold tracking-wider text-slate-500 flex items-center justify-center gap-1 uppercase">
                <Clock className="h-3 w-3" /> System Status: Online (MFA Enabled)
              </span>
            </div>
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
          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">DBATU Inspiration Loop</span>
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
            filteredBooks.map((book) => {
              const availabilityPercent = Math.round((book.available / book.total) * 100);
              const isUrgent = availabilityPercent <= 50;

              return (
                <div 
                  key={book.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-5 flex flex-col justify-between space-y-4 shadow-3xs transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-md hover:border-blue-700/20 dark:hover:border-blue-900/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold px-1.5 py-0.5 tracking-wider font-mono text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950 rounded uppercase border border-blue-100 dark:border-blue-900/40">
                        {book.id}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-widest font-sans">
                        {book.category}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-slate-850 dark:text-white leading-snug line-clamp-1">
                      {book.title}
                    </h3>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium leading-tight">
                      by {book.author}
                    </p>

                    <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-sans line-clamp-3">
                      {book.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px]">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-700" />
                      <span className="font-semibold line-clamp-1">{book.location}</span>
                    </div>

                    {/* Stack indicator healthbar */}
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

                    <button
                      onClick={() => triggerLoginPortal('student')}
                      className="w-full h-8 flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-[10px] uppercase tracking-wider font-extrabold text-blue-700 dark:text-blue-400 rounded transition-all border border-slate-200 dark:border-slate-800 cursor-pointer"
                    >
                      <BookMarked className="h-3.5 w-3.5" />
                      Sign In & Request Book
                    </button>
                  </div>
                </div>
              );
            })
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
