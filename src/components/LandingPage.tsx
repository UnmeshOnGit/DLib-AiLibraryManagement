import React from 'react';
import { BookOpen, Map, Milestone, Award, LineChart, ShieldCheck, ArrowRight, Library, Sparkles, Compass, Sun, Moon } from 'lucide-react';

interface LandingPageProps {
  onStart: (role?: 'student' | 'admin') => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export function LandingPage({ onStart, theme, setTheme }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Absolute Glow Accents */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-[30%] w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Nav Header */}
      <header className={`sticky top-0 z-40 ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-white/[0.02] border-white/10'} backdrop-blur-md border-b px-6 py-4 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl shadow-lg shadow-blue-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                D-<span className="text-emerald-400">Lib</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">University Library Systems</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 font-sans select-none">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition shrink-0 relative cursor-pointer backdrop-blur-md"
              title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-slate-700" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
            </button>
            <button
              onClick={() => onStart('admin')}
              className="text-xs sm:text-sm text-slate-300 hover:text-white transition font-semibold cursor-pointer"
            >
              Librarian Portal
            </button>
            <button
              onClick={() => onStart('student')}
              className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600/90 text-xs sm:text-sm text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/10 active:scale-95 border border-white/10 cursor-pointer backdrop-blur-md"
            >
              Student Portal
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 sm:pt-24 flex-1 z-10">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-12 xl:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-305 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-semibold font-mono">Next-Generation AI Enabled Learning</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Empower Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">Academic Journey</span> With AI Intelligence
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-lg max-w-2xl leading-relaxed">
              An intelligent university academic environment combining a catalog shelf with customized learning roadmap algorithms, study schedule builders, automated queues, and real-time faculty statistics.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => onStart('student')}
                className="px-6 py-3.5 bg-blue-600/80 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/20 border border-white/10 flex items-center gap-2 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                Join as Student <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onStart('admin')}
                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 font-semibold rounded-xl transition flex items-center gap-2 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                Librarian Access <Library className="h-4 w-4 text-teal-400" />
              </button>
            </div>
          </div>

          {/* Interactive Hero Visual */}
          <div className="lg:col-span-12 xl:col-span-5 relative mt-6 lg:mt-0">
            <div className="relative p-6 rounded-3xl bg-white/5 border border-white/20 backdrop-blur-md shadow-2xl overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full filter blur-xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full filter blur-xl" />
              
              {/* Mock Dashboard Widget preview */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-mono text-slate-300">AI Recommendation Engine</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">Online</span>
                </div>
                
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                  <p className="text-xs text-slate-200 font-semibold">Recommended: "Advanced Machine Learning Algorithms"</p>
                  <p className="text-[10px] text-slate-400 mt-1">Matched 98% with your Python Core roadmap progress.</p>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium font-semibold">Roadmap Progress</span>
                    <span className="text-teal-400 font-extrabold">75%</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-teal-400 h-full rounded-full" style={{ width: '75%' }} />
                  </div>
                </div>

                <div className="flex gap-2 text-[11px] text-slate-400">
                  <div className="flex-1 p-2 bg-white/[0.03] rounded-lg text-center border border-white/5 backdrop-blur-md">
                    <span className="block text-white font-bold">5 Days</span> Reading Streak
                  </div>
                  <div className="flex-1 p-2 bg-white/[0.03] rounded-lg text-center border border-white/5 backdrop-blur-md">
                    <span className="block text-white font-bold">240 pts</span> Academic Points
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-white/[0.01] border-t border-b border-white/10 py-20 px-6 relative z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Fully Integrated Ecosystem Features
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              A comprehensive system custom-tailored for university students, library managers, and point trackers alike.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Box 1 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition duration-300 group backdrop-blur-md shadow-xl">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-xl w-fit border border-white/10 mb-4 group-hover:from-blue-500/30 group-hover:to-teal-400/30 transition">
                <Library className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Library Management</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Check virtual stock, search textbook categories using modern voices, filter departments, join active reservation waiting lists, and renew checkouts.
              </p>
            </div>

            {/* Box 2 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition duration-300 group backdrop-blur-md shadow-xl">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-xl w-fit border border-white/10 mb-4 group-hover:from-blue-500/30 group-hover:to-teal-400/30 transition">
                <Compass className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Book Recommendations</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Curates intelligent library checkouts based on reading histories, department focuses, and favored topics using Gemini intelligence.
              </p>
            </div>

            {/* Box 3 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition duration-300 group backdrop-blur-md shadow-xl">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-xl w-fit border border-white/10 mb-4 group-hover:from-blue-500/30 group-hover:to-teal-400/30 transition">
                <Map className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Learning Roadmaps</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Specify any skill and generate a 4-stage textbook roadmap structure defining learning goals, YouTube playlists, textbooks, and documentation.
              </p>
            </div>

            {/* Box 4 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition duration-300 group backdrop-blur-md shadow-xl">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-xl w-fit border border-white/10 mb-4 group-hover:from-blue-500/30 group-hover:to-teal-400/30 transition">
                <Milestone className="h-6 w-6 text-purple-450 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Progress Metric Goal Tracker</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Check-off learning milestones, track completed tasks, trigger weekly/monthly targets, and gauge completion timelines.
              </p>
            </div>

            {/* Box 5 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition duration-300 group backdrop-blur-md shadow-xl">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-xl w-fit border border-white/10 mb-4 group-hover:from-blue-500/30 group-hover:to-teal-400/30 transition">
                <Award className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Profile Gamification</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Accumulate streak points, capture badges, compete on real-time university leaderboard, and export visual diplomas.
              </p>
            </div>

            {/* Box 6 */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition duration-300 group backdrop-blur-md shadow-xl">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-teal-400/20 rounded-xl w-fit border border-white/10 mb-4 group-hover:from-blue-500/30 group-hover:to-teal-400/30 transition">
                <LineChart className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Staff Reporting Module</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Enables librarians to handle checkout requests, track reservations, identify overdue users, calculate balances, and compile CSV Excel spreadsheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* University Stats Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto z-10 relative">
        <h3 className="text-center text-xs uppercase tracking-widest text-slate-400 font-mono mb-12">Current Hub Scale Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
            <p className="text-4xl font-extrabold text-blue-400">10,000+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">Academic Textbooks</p>
          </div>
          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
            <p className="text-4xl font-extrabold text-teal-400">4,200+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">Students Enrolled</p>
          </div>
          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
            <p className="text-4xl font-extrabold text-amber-400">250+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">Completed Roadmaps</p>
          </div>
          <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
            <p className="text-4xl font-extrabold text-purple-400">15+</p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">Departments Engaged</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white/[0.01] border-t border-white/10 py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-white mb-12 text-center">Loved by Scholars & Educators</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl text-left">
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "The roadmaps produced for Cybersecurity allowed me to focus my engineering study plan. The chatbot is incredibly responsive, instantly suggesting actual catalog textbook listings that were available directly on the next shelf."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">US</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Unmesh Sutar</h4>
                  <p className="text-[10px] text-slate-405 text-slate-400">Student, Dept of Computer Science (3rd yr)</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl text-left">
              <p className="text-slate-300 italic text-sm leading-relaxed">
                "Handling checkout requests and overdue notifications used to be a messy manual spreadsheet workflow. The Smart Hub reports console lets me capture active balances and trigger notifications in a single, simple, glassmorphic click."
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-600/20 text-teal-400 flex items-center justify-center font-bold text-xs">EV</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dr. Eleanor Vance</h4>
                  <p className="text-[10px] text-slate-405 text-slate-400">Senior Librarian, Campus Academic Affairs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/[0.01] py-12 px-6 z-10 relative backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" />
            <span className="font-bold text-slate-200">D-Lib</span>
          </div>
          <p>© 2026 Dr. Babasaheb Ambedkar Technological University, Lonere (D-Lib Smart Library System) All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
