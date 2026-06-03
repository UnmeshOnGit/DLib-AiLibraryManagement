import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Sparkles, RefreshCw, Layers, CheckCircle2, Award, ArrowLeft, Send, Sparkle, Bookmark, Check, ArrowRight } from 'lucide-react';

interface ExamNotesPanelProps {
  token: string;
  book: any;
  onClose: () => void;
  showMessage: (title: string, text: string, type?: 'success' | 'danger') => void;
}

export function ExamNotesPanel({ token, book, onClose, showMessage }: ExamNotesPanelProps) {
  const [activeTab, setActiveTab] = useState<'units' | 'revision' | 'flashcards' | 'chat'>('units');
  const [notes, setNotes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Flashcards state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [bookmarkedCards, setBookmarkedCards] = useState<Record<string, boolean>>({});
  const [completedCards, setCompletedCards] = useState<Record<string, boolean>>({});

  // Chat assistant state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { sender: 'assistant', text: `Hi Scholar! I am your AI Exam Prep Assistant. I have indexed the whole text of "${book.title}". Ask me any custom viva/midterm questions or formula breakdowns!` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotes();
  }, [book.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${book.id}/exam-notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showMessage("API Key Warning", "Online notes compilation requires GEMINI_API_KEY. Using core system compiled notes.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const prompt = chatInput;
    setChatInput('');

    setChatMessages(prev => [...prev, { sender: 'user', text: prompt }]);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/books/${book.id}/exam-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: prompt })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { sender: 'assistant', text: data.answer }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: `⚠️ Throttled: ${err.message || 'API error'}. Please connect your internet/API keys under system settings.` }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070b19]/70 backdrop-blur-sm flex items-center justify-center">
        <div className="p-8 bg-slate-900 border border-white/20 rounded-3xl max-w-sm w-full text-center space-y-4">
          <RefreshCw className="h-10 w-10 text-blue-500 animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-white font-mono uppercase tracking-widest">Compiling Exam Revision notes</h4>
          <p className="text-xs text-slate-400">Librarian AI is reading Units structure, generating LaTeX mathematical formula trees, and engineering mock viva flashcards...</p>
        </div>
      </div>
    );
  }

  const actNotes = notes || {
    units: [],
    frequentlyAskedConcepts: [],
    revisionSheet: { keyTakeaways: [], definitions: [], formulas: [], tips: [] },
    flashcards: []
  };

  const currentFlashcard = actNotes.flashcards[currentIdx] || { question: "Empty", answer: "Empty" };

  return (
    <div className="fixed inset-0 z-50 bg-[#070b19]/70 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-2xl bg-[#0d1527] border-l border-white/20 h-full overflow-y-auto flex flex-col justify-between shadow-2xl relative">
        
        {/* Header Block */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0f1930] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-1 px-3 bg-white/5 text-slate-300 hover:text-white rounded-lg text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Catalog
            </button>
            <div className="text-left">
              <h4 className="font-extrabold text-white text-sm uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" /> Final Exam Copilot Guide
              </h4>
              <p className="text-[10px] text-slate-400 line-clamp-1">{book.title}</p>
            </div>
          </div>

          <span className="text-[10px] uppercase font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full select-none leading-none">
            {book.category}
          </span>
        </div>

        {/* Navigation Tabs bar */}
        <div className="bg-[#0f1930] px-6 border-b border-white/10 flex gap-2 overflow-x-auto shrink-0 select-none">
          <button
            onClick={() => { setActiveTab('units'); setIsFlipped(false); }}
            className={`py-3 px-3 text-xs font-bold font-mono border-b-2 transition shrink-0 ${activeTab === 'units' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Unit Notes
          </button>
          <button
            onClick={() => { setActiveTab('revision'); setIsFlipped(false); }}
            className={`py-3 px-3 text-xs font-bold font-mono border-b-2 transition shrink-0 ${activeTab === 'revision' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            15-Min Cheat Sheet
          </button>
          <button
            onClick={() => { setActiveTab('flashcards'); setIsFlipped(false); }}
            className={`py-3 px-3 text-xs font-bold font-mono border-b-2 transition shrink-0 ${activeTab === 'flashcards' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Interactive Flashcards
          </button>
          <button
            onClick={() => { setActiveTab('chat'); setIsFlipped(false); }}
            className={`py-3 px-3 text-xs font-bold font-mono border-b-2 transition shrink-0 ${activeTab === 'chat' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            Ask book LLM
          </button>
        </div>

        {/* Core Contents Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">

          {/* TAB 1: UNIT STUDY GUIDE */}
          {activeTab === 'units' && (
            <div className="space-y-6 text-left">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Unit Curriculum Core Notes</span>
              
              {actNotes.units.map((unit: any, idx: number) => (
                <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 backdrop-blur-md">
                  <div className="flex justify-between items-start">
                    <h5 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-400" /> {unit.unitName}
                    </h5>
                  </div>
                  
                  {/* Summary */}
                  <p className="text-xs text-slate-350 leading-relaxed text-slate-350">{unit.summary}</p>
                  
                  {/* Definitions Grid */}
                  {unit.definitions && unit.definitions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 block">Critical Midterm Vocabulary:</span>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {unit.definitions.map((def: any, dIdx: number) => (
                          <div key={dIdx} className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs">
                            <span className="font-extrabold text-white block mb-0.5">{def.term}</span>
                            <span className="text-slate-400 leading-relaxed text-[11px]">{def.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mathematical Formulas */}
                  {unit.formulas && unit.formulas.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 block">Formula Equations Extraction:</span>
                      <div className="space-y-2">
                        {unit.formulas.map((frm: any, fIdx: number) => (
                          <div key={fIdx} className="p-3 bg-blue-600/5 rounded-xl border border-blue-500/15 text-xs text-left flex flex-col md:flex-row gap-3">
                            <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] flex-1 text-center font-bold text-blue-400 border border-white/5 flex items-center justify-center max-w-full overflow-x-auto">
                              <code>{frm.formula}</code>
                            </div>
                            <div className="flex-1 space-y-1">
                              <span className="text-slate-200 font-semibold block text-[11px]">Explanation: {frm.explanation}</span>
                              <span className="text-teal-400 text-[10px] block font-mono">Use Case: {frm.useCase}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Likely Exam Questions */}
                  {unit.questions && unit.questions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400 block">Examiners Likely Questions:</span>
                      <div className="space-y-2">
                        {unit.questions.map((qst: any, qIdx: number) => (
                          <div key={qIdx} className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-left space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-amber-400">Q: {qst.question}</span>
                              <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full">{qst.marks} Marks</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed pre-wrap bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                              <span className="font-bold text-[10px] uppercase text-teal-400 block mb-1 font-mono">Recommended Model Answer:</span>
                              {qst.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: 15-MINUTE REVISION CHEAT SHEET */}
          {activeTab === 'revision' && (
            <div className="space-y-6 text-left">
              <div className="p-4 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 border border-white/20 rounded-2xl backdrop-blur-md">
                <span className="text-xs uppercase font-mono text-blue-400 font-bold tracking-widest block">15-Minute Revision Mode</span>
                <p className="text-[11px] text-slate-400 mt-1">High-impact study sheet designed to review critical equations, takeaways, and examiner secrets on your dynamic commute walk.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                
                {/* Takeaways List */}
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-300 block">Essential Concepts</span>
                  <div className="space-y-2">
                    {actNotes.revisionSheet.keyTakeaways.map((tkw: string, tIdx: number) => (
                      <div key={tIdx} className="flex gap-2 text-xs text-slate-400">
                        <Check className="h-4 w-4 shrink-0 text-teal-400 mt-0.5" />
                        <p>{tkw}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Examiner Secret Tips List */}
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-300 block">Secret Examiner Tips</span>
                  <div className="space-y-2">
                    {actNotes.revisionSheet.tips.map((tip: string, tIdx: number) => (
                      <div key={tIdx} className="flex gap-2 text-xs text-slate-400">
                        <Sparkle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <p>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Formulas Sheet */}
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3 sm:col-span-2">
                  <span className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-300 block">Critical Equations Formula Sheet</span>
                  <div className="space-y-2">
                    {actNotes.revisionSheet.formulas.map((fName: string, tIdx: number) => (
                      <div key={tIdx} className="p-2 bg-slate-900 border border-white/10 rounded-xl font-mono text-[11px] text-blue-400 font-bold block text-center">
                        <code>{fName}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6 text-center select-none">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block text-left">Interactive Memorization deck</span>

              {/* FLIP CARD CORE */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full h-64 cursor-pointer relative perspective-1000 select-none group"
              >
                <div 
                  className={`w-full h-full duration-500 transform-style-3d relative flex items-center justify-center p-6 rounded-3xl border transition shadow-xl ${
                    isFlipped 
                      ? 'bg-slate-900/90 border-blue-500/40' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-3 max-w-lg text-center">
                    {isFlipped ? (
                      <div className="space-y-3">
                        <span className="text-[10px] uppercase font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 font-bold">Answer revealed</span>
                        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans font-medium">{currentFlashcard.answer}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <span className="text-[10px] uppercase font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">Question card</span>
                        <p className="text-base sm:text-lg text-white leading-relaxed font-sans font-extrabold">{currentFlashcard.question}</p>
                        <span className="text-[11px] text-slate-500 font-mono italic block pt-4 group-hover:text-slate-400">Click anywhere to flip answer</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD UTILITY INTERACTIVE ACTIONS */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setBookmarkedCards(prev => ({ ...prev, [currentIdx]: !prev[currentIdx] }))}
                    className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-mono font-bold leading-none ${bookmarkedCards[currentIdx] ? 'bg-amber-500/10 border-amber-500/35 text-amber-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <Bookmark className={`h-4 w-4 ${bookmarkedCards[currentIdx] ? 'fill-amber-400 text-amber-400' : ''}`} />
                    {bookmarkedCards[currentIdx] ? 'Bookmarked' : 'Flag Bookmark'}
                  </button>
                  <button
                    onClick={() => setCompletedCards(prev => ({ ...prev, [currentIdx]: !prev[currentIdx] }))}
                    className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-mono font-bold leading-none ${completedCards[currentIdx] ? 'bg-teal-500/10 border-teal-500/35 text-teal-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    <Check className="h-4 w-4" />
                    {completedCards[currentIdx] ? 'Mastered!' : 'Mark Mastered'}
                  </button>
                </div>

                <span className="text-xs text-slate-400 font-mono font-medium">Card {currentIdx + 1} of {actNotes.flashcards.length}</span>
              </div>

              {/* CARD DECK CONTROLLERS */}
              <div className="pt-4 flex gap-4 w-full">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => { setCurrentIdx(prev => prev - 1); setIsFlipped(false); }}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold font-mono text-slate-300 disabled:opacity-40 select-none transition disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous Deck Card
                </button>
                <button
                  disabled={currentIdx >= actNotes.flashcards.length - 1}
                  onClick={() => { setCurrentIdx(prev => prev + 1); setIsFlipped(false); }}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-bold font-mono text-white disabled:opacity-40 select-none transition disabled:cursor-not-allowed cursor-pointer"
                >
                  Next Deck Card
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ASK BOOK LLM COMPANION CHAT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[55vh] justify-between relative text-left">
              
              {/* Messages area scroll block */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 select-text">
                {chatMessages.map((m, idx) => {
                  const isAi = m.sender === 'assistant';
                  return (
                    <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'} gap-3 items-start`}>
                      <div className="space-y-1 max-w-[85%]">
                        <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${isAi ? 'bg-white/5 border border-white/10 text-slate-300' : 'bg-blue-600 text-white'}`}>
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {chatLoading && (
                  <div className="flex justify-start gap-4 items-center">
                    <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg shrink-0 border border-white/10 animate-pulse">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    </div>
                    <div className="p-3 bg-white/5 border border-white/5 text-slate-400 text-xs rounded-xl italic backdrop-blur-sm">
                      Exam Prep LLM scanning index models...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input core controls */}
              <div className="relative shrink-0 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Ask questions from "${book.title}"...`}
                  className="block w-full pl-4 pr-16 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 text-xs sm:text-sm focus:border-blue-500 focus:ring-0"
                />
                <button
                  disabled={chatLoading}
                  onClick={handleSendMessage}
                  className="absolute right-2 top-4 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition cursor-pointer disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
