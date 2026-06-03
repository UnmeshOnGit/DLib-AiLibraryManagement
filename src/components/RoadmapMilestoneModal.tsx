import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Lock, Play, Star, BookMarked, FileText, 
  ExternalLink, ArrowRight, Save, Award, HelpCircle, 
  ChevronDown, Flame, Sparkles, BookOpen, Clock, Code 
} from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description: string;
  estimatedHours?: number;
}

interface ResourceItem {
  title: string;
  url: string;
}

interface ProjectItem {
  title: string;
  description: string;
  difficulty?: string;
}

interface Stage {
  id: string;
  name: string;
  goals: string[];
  topics: Topic[];
  resources: {
    youtube?: ResourceItem[];
    docs?: ResourceItem[];
    courses?: ResourceItem[];
    books?: ResourceItem[];
    practice?: ResourceItem[];
    projects?: ProjectItem[];
  };
}

interface RoadmapMilestoneModalProps {
  stage: Stage;
  sIdx: number;
  status: 'Locked' | 'Available' | 'In Progress' | 'Completed';
  completedTopics: string[];
  roadmapId: string;
  studentId: string;
  onToggleTopic: (roadmapId: string, topicId: string) => void;
  onClose: () => void;
  showMessage: (title: string, text: string, type?: 'success' | 'danger') => void;
}

export function RoadmapMilestoneModal({
  stage,
  sIdx,
  status,
  completedTopics,
  roadmapId,
  studentId,
  onToggleTopic,
  onClose,
  showMessage
}: RoadmapMilestoneModalProps) {
  
  // Tab control within the modal
  const [activeTab, setActiveTab] = useState<'syllabus' | 'resources' | 'projects' | 'notes'>('syllabus');
  
  // Note taking state
  const noteKey = `roadmap_note_${studentId}_${roadmapId}_${stage.id || sIdx}`;
  const [noteText, setNoteText] = useState('');
  
  // Bookmark state Check
  const bookmarkKey = `roadmap_bookmark_${studentId}_${roadmapId}_${stage.id || sIdx}`;
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Load note
    const savedNote = localStorage.getItem(noteKey);
    if (savedNote) setNoteText(savedNote);

    // Load bookmark
    const savedBookmark = localStorage.getItem(bookmarkKey);
    if (savedBookmark === 'true') setIsBookmarked(true);
  }, [noteKey, bookmarkKey]);

  const handleSaveNote = () => {
    localStorage.setItem(noteKey, noteText);
    showMessage("Notes Synced", "Stage notebook has been saved securely to local cache.", "success");
  };

  const handleToggleBookmark = () => {
    const nextVal = !isBookmarked;
    setIsBookmarked(nextVal);
    localStorage.setItem(bookmarkKey, String(nextVal));
    if (nextVal) {
      showMessage("Stage Bookmarked", `Pinned Stage: ${stage.name} for rapid navigation.`, "success");
    } else {
      showMessage("Bookmark Removed", `Unpinned Stage: ${stage.name}.`, "success");
    }
  };

  // Counting metrics
  const stageTopics = stage.topics || [];
  const doneCount = stageTopics.filter(t => completedTopics.includes(t.id)).length;
  const stageDuration = stageTopics.reduce((acc, current) => acc + (current.estimatedHours || 3), 0);
  const completionPercent = stageTopics.length > 0 ? Math.round((doneCount / stageTopics.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative bg-slate-905 w-full max-w-4xl rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Dynamic header with theme color styling depending on completion status */}
        <div className="p-6 relative bg-gradient-to-r from-emerald-600/15 via-emerald-500/5 to-transparent border-b border-slate-800/80 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
          
          <div className="space-y-1 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold">
                Waypost #{sIdx + 1} • Milestone
              </span>
              <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-bold ${
                status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' :
                status === 'Available' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                'bg-slate-800/40 text-slate-500 border-slate-800'
              }`}>
                {status}
              </span>
              {isBookmarked && (
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  <BookMarked className="h-2.5 w-2.5" /> Bookmarked
                </span>
              )}
            </div>
            
            <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {stage.name} Curriculum Core
            </h3>
          </div>

          {/* Quick Action bar (Close, Bookmark, Stats) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBookmark}
              className={`p-2.5 rounded-xl border transition ${
                isBookmarked 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Bookmark this learning stage"
            >
              <BookMarked className="h-4.5 w-4.5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-905 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Level metrics bar */}
        <div className="bg-slate-950/40 px-6 py-3 border-b border-slate-850/60 shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber-400" />
            <span className="text-slate-400">Difficulty: <b className="text-white">Level Key</b></span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-400" />
            <span className="text-slate-400">Duration: <b className="text-white">{stageDuration} Hours</b></span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Award className="h-4 w-4 text-emerald-400" />
            <div className="flex-1">
              <div className="flex justify-between font-bold text-[10px] text-slate-400 mb-1">
                <span>STAGE COMPLETION:</span>
                <span className="text-emerald-400">{completionPercent}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${completionPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Tab Controls */}
        <div className="px-6 border-b border-slate-850/60 shrink-0 bg-slate-900/10 flex overflow-x-auto gap-2 py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'syllabus' 
                ? 'bg-slate-800 text-white border border-slate-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Syllabus Milestones ({stageTopics.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'resources' 
                ? 'bg-slate-800 text-white border border-slate-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <ExternalLink className="h-4 w-4" /> Recommended Resources
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'projects' 
                ? 'bg-slate-800 text-white border border-slate-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <Code className="h-4 w-4" /> Project Tasks
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'notes' 
                ? 'bg-slate-800 text-white border border-slate-700' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <FileText className="h-4 w-4" /> Stage Notebook
          </button>
        </div>

        {/* Modal Outer Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          
          <AnimatePresence mode="wait">
            {activeTab === 'syllabus' && (
              <motion.div
                key="syllabus"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                {/* Visual Goals Box */}
                {stage.goals && stage.goals.length > 0 && (
                  <div className="p-4 bg-slate-950/20 border border-slate-850 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block mb-2">
                      Key Competencies & Outcomes:
                    </span>
                    <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      {stage.goals.map((g, gIdx) => (
                        <li key={gIdx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Subtitle list header */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                    Required study topics & lessons:
                  </span>
                  {status === 'Locked' && (
                    <span className="text-xs text-red-400 font-mono flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" /> Locked: complete previous stages first
                    </span>
                  )}
                </div>

                {/* Topics interactive list with checkboxes */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {stageTopics.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-slate-500 italic text-xs">
                      No milestones declared. Explore official resources.
                    </div>
                  ) : (
                    stageTopics.map((topic, tIdx) => {
                      const isCompleted = completedTopics.includes(topic.id);
                      return (
                        <div
                          key={topic.id || tIdx}
                          onClick={() => {
                            if (status === 'Locked') {
                              showMessage("Lock Restriction", "This learning milestone operates under dependency sequence constraints. Complete prior stages first!", "danger");
                              return;
                            }
                            onToggleTopic(roadmapId, topic.id);
                          }}
                          className={`group p-4 rounded-2xl border text-left transition select-none flex items-start gap-3.5 cursor-pointer ${
                            isCompleted 
                              ? 'bg-emerald-500/5 border-emerald-500/40 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.03)]' 
                              : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-300'
                          }`}
                        >
                          {/* Circle custom checkboxes with micro interactives */}
                          <button 
                            type="button" 
                            className="shrink-0 mt-0.5 active:scale-90 transition cursor-pointer"
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5 bg-emerald-500 text-slate-950 p-0.5 rounded-lg font-bold" />
                            ) : (
                              <div className="h-5 w-5 rounded-lg border-2 border-slate-700 group-hover:border-slate-500 transition" />
                            )}
                          </button>

                          <div className="space-y-1 flex-1 min-w-0">
                            <h5 className={`text-xs sm:text-sm font-extrabold leading-snug truncate ${
                              isCompleted ? 'line-through text-slate-400 font-medium' : 'text-slate-200'
                            }`}>
                              {topic.name}
                            </h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                              {topic.description}
                            </p>
                            {topic.estimatedHours && (
                              <span className="inline-block text-[9px] font-mono text-slate-600 font-bold bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-850/50">
                                ⌛ {topic.estimatedHours}h estimated study
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'resources' && (
              <motion.div
                key="resources"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Visual guidance cards for recommended links */}
                <div className="grid md:grid-cols-2 gap-6 font-mono text-xs">
                  {/* Lectures / YouTube tutorials lists */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-wider text-red-400 block font-bold border-b border-slate-800/80 pb-1.5">
                      🎬 Lecture Series & Video Curations
                    </span>
                    {stage.resources.youtube && stage.resources.youtube.length > 0 ? (
                      stage.resources.youtube.map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-900 border border-slate-850 hover:border-red-500/30 rounded-xl transition group group-hover:text-white"
                        >
                          <span className="truncate pr-4 text-slate-300 font-bold group-hover:text-white">{res.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0 group-hover:text-red-400 transition" />
                        </a>
                      ))
                    ) : (
                      <div className="text-slate-600 text-[11px] italic">No lectures recommended. Check official docs.</div>
                    )}
                  </div>

                  {/* Manuals / Official Guides lists */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 block font-bold border-b border-slate-800/80 pb-1.5">
                      📚 Handbooks & Tech Documentation
                    </span>
                    {stage.resources.docs && stage.resources.docs.length > 0 ? (
                      stage.resources.docs.map((res, rIdx) => (
                        <a
                          key={rIdx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-3 bg-slate-950/40 hover:bg-slate-900 border border-slate-850 hover:border-emerald-500/30 rounded-xl transition group"
                        >
                          <span className="truncate pr-4 text-slate-300 font-bold group-hover:text-white">{res.title || 'Technical Spec'}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0 group-hover:text-emerald-400 transition" />
                        </a>
                      ))
                    ) : (
                      <div className="text-slate-600 text-[11px] italic">No documentation specified.</div>
                    )}
                  </div>

                  {/* Practice links / Free Courses */}
                  <div className="col-span-full space-y-3 pt-3 border-t border-slate-850/40">
                    <span className="text-[10px] uppercase tracking-wider text-blue-400 block font-bold">
                      ⚔️ Recommended Practice Gateways & Manual Curations
                    </span>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {stage.resources.practice && stage.resources.practice.length > 0 ? (
                        stage.resources.practice.map((res, rIdx) => (
                          <a
                            key={rIdx}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-3 bg-slate-950/40 hover:bg-slate-900 border border-slate-850 hover:border-blue-500/30 rounded-xl transition text-slate-300 font-sans font-semibold hover:text-white text-[11px]"
                          >
                            <Sparkles className="h-3 w-3 text-amber-400 animate-pulse shrink-0" />
                            <span className="truncate">{res.title}</span>
                          </a>
                        ))
                      ) : (
                        <div className="col-span-full text-slate-600 text-[11px] italic">Enjoy studying standard textbook guides.</div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">
                  Curation of capstones & practice project ideas:
                </span>

                <div className="space-y-3">
                  {stage.resources.projects && stage.resources.projects.length > 0 ? (
                    stage.resources.projects.map((proj, pIdx) => (
                      <div 
                        key={pIdx} 
                        className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/[0.01]"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-200">{proj.title}</h4>
                            <span className="inline-block text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
                              {proj.difficulty || 'Stage Capstone'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">{proj.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            showMessage("Project Assigned", `Assigned "${proj.title}" checklist to notebook!`, "success");
                            setActiveTab('notes');
                          }}
                          className="px-3.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-xl transition text-[11px] font-mono font-bold whitespace-nowrap self-start sm:self-center cursor-pointer"
                        >
                          + Clip to notebook
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-600 bg-slate-950/20 border border-slate-850 rounded-2xl text-xs italic">
                      No project assignments specified for this waypoint. Check custom syllabus descriptions.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div
                key="notes"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider block">
                    Save key equations, summaries, or clipped notes:
                  </span>
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/15"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Notebook
                  </button>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Capture study outcomes, draft project architectures, write reminders..."
                    className="w-full h-80 p-5 bg-transparent border-none text-xs sm:text-sm leading-relaxed text-slate-200 focus:ring-0 outline-none placeholder-slate-600 font-sans"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Modal bottom bar actions */}
        <div className="p-5 bg-slate-950/40 border-t border-slate-850/60 shrink-0 flex items-center justify-between gap-4">
          <span className="text-[11px] text-slate-500 font-mono">
            {doneCount}/{stageTopics.length} objectives checked empty
          </span>
          
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            <span>Continue Learning Journey</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </motion.div>
    </div>
  );
}
