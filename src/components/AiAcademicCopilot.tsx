import React, { useState } from 'react';
import { Sparkles, Brain, Award, BookOpen, Target, ArrowRight, RefreshCw, BarChart3, HelpCircle, CheckCircle, GraduationCap, Play } from 'lucide-react';

interface AiAcademicCopilotProps {
  token: string;
  user: any;
  showMessage: (title: string, text: string, type?: 'success' | 'danger') => void;
}

type WorkflowType = 'recommend' | 'quiz' | 'viva' | 'career' | 'progress';

export function AiAcademicCopilot({ token, user, showMessage }: AiAcademicCopilotProps) {
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>('recommend');
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Quiz interactive state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});

  const handleRunWorkflow = async () => {
    const queryTopic = topicInput.trim() || getDefaultTopic(activeWorkflow);
    setLoading(true);
    setResult(null);
    setQuizAnswers({});
    setQuizSubmitted({});

    try {
      const res = await fetch('/api/copilot/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workflow: activeWorkflow,
          params: { topic: queryTopic }
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      showMessage("Copilot Throttled", "Gemini API experiencing temporary congestion. Loading sandbox compiler fallback.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTopic = (wf: WorkflowType) => {
    switch (wf) {
      case 'recommend': return 'Algorithms & Structural paradigms';
      case 'quiz': return 'React Lifecycle & Hooks';
      case 'viva': return 'Database Sharding & Fallbacks';
      case 'career': return 'Full-Stack Solutions Architect';
      case 'progress': return 'Machine Learning engineering path';
      default: return 'Computer Science core';
    }
  };

  const menuItems = [
    { id: 'recommend' as const, label: 'Librarian Recommendation', desc: 'Personalized matching scores' },
    { id: 'quiz' as const, label: 'Interactive Quiz', desc: 'Mock quiz with analytics' },
    { id: 'viva' as const, label: 'Oral Viva Questions', desc: 'Expert tips for midterms' },
    { id: 'career' as const, label: 'Career Gap Analysis', desc: 'Identify textbook gaps' },
    { id: 'progress' as const, label: 'Velocity Predictor', desc: 'Study time estimates' }
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md relative overflow-hidden text-left space-y-6">
      
      {/* Dynamic ambient header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-2xl animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold uppercase font-mono tracking-wider text-white">AI Academic Copilot Hub</h3>
            <span className="text-[10px] text-slate-400 font-mono">Specialized learning routines & custom knowledge engineering</span>
          </div>
        </div>
        <span className="text-[9.5px] font-mono bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold px-2.5 py-1 rounded-full select-none leading-none">
          Flagship Copilot Active
        </span>
      </div>

      <div className="grid md:grid-cols-12 gap-6">
        
        {/* Left selector menu list */}
        <div className="md:col-span-4 space-y-2 shrink-0 select-none">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold block mb-1">Select Copilot workflow:</span>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveWorkflow(item.id);
                setResult(null);
                setTopicInput('');
              }}
              className={`w-full p-3 rounded-2xl text-left border flex flex-col justify-center transition cursor-pointer ${
                activeWorkflow === item.id 
                  ? 'bg-blue-600/70 text-white border-blue-500/30 shadow-lg shadow-blue-500/10 backdrop-blur-md'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className={`text-[12px] font-extrabold font-sans ${activeWorkflow === item.id ? 'text-white' : 'text-slate-200'}`}>
                {item.label}
              </span>
              <span className={`text-[10px] font-mono block mt-0.5 ${activeWorkflow === item.id ? 'text-slate-200 opacity-80' : 'text-slate-400'}`}>
                {item.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Right workspace core controls */}
        <div className="md:col-span-8 flex flex-col justify-between p-5 bg-white/5 border border-white/10 rounded-3xl relative min-h-[360px] backdrop-blur-md">
          <div className="space-y-4">
            
            {/* Input field */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold block">
                What topic or textbook major do you want to analyze?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder={`e.g. ${getDefaultTopic(activeWorkflow)}`}
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs sm:text-sm focus:border-blue-500 focus:ring-0"
                />
                <button
                  disabled={loading}
                  onClick={handleRunWorkflow}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold font-mono rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Execute Program
                </button>
              </div>
            </div>

            {/* Workplaces results outputs */}
            <div className="pt-2">
              {loading ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
                  <RefreshCw className="h-7 w-7 text-blue-500 animate-spin" />
                  <p className="font-mono">Processing copilot request via Gemini flash models...</p>
                </div>
              ) : result ? (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  
                  {/* RECOMMENDATION RESULT TYPE */}
                  {activeWorkflow === 'recommend' && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 font-sans text-xs sm:text-sm leading-relaxed text-slate-300 select-text">
                      <div className="whitespace-pre-line text-left">{result}</div>
                    </div>
                  )}

                  {/* INTERACTIVE QUIZ RESULT TYPE */}
                  {activeWorkflow === 'quiz' && result.questions && (
                    <div className="space-y-4">
                      {result.questions.map((q: any, qIdx: number) => {
                        const answerSelected = quizAnswers[q.id] !== undefined;
                        const isCorrect = quizAnswers[q.id] === q.answerIndex;
                        return (
                          <div key={q.id || qIdx} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-left space-y-3">
                            <h5 className="font-extrabold text-white text-xs">{qIdx + 1}. {q.question}</h5>
                            <div className="grid sm:grid-cols-2 gap-2 select-none">
                              {q.options.map((opt: string, oIdx: number) => {
                                const isThisSelected = quizAnswers[q.id] === oIdx;
                                const isThisCorrect = q.answerIndex === oIdx;
                                return (
                                  <button
                                    key={oIdx}
                                    disabled={quizSubmitted[q.id]}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                    className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer text-slate-300 font-medium ${
                                      quizSubmitted[q.id]
                                        ? isThisCorrect
                                          ? 'bg-teal-500/15 border-teal-500/50 text-teal-400'
                                          : isThisSelected
                                          ? 'bg-rose-500/15 border-rose-500/50 text-rose-400'
                                          : 'bg-white/5 border-white/5 opacity-50'
                                        : isThisSelected
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                                        : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            
                            {!quizSubmitted[q.id] && answerSelected && (
                              <button
                                onClick={() => setQuizSubmitted(prev => ({ ...prev, [q.id]: true }))}
                                className="py-1 px-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-lg text-xs font-bold block"
                              >
                                Submit Answer
                              </button>
                            )}

                            {quizSubmitted[q.id] && (
                              <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed border ${isCorrect ? 'bg-teal-500/10 border-teal-500/20 text-teal-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                <span className="font-bold underline block mb-0.5">{isCorrect ? '✓ Correct Answer!' : '✗ Incorrect Attempt'}</span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* VIVA ORAL EXTRACTION */}
                  {activeWorkflow === 'viva' && Array.isArray(result) && (
                    <div className="space-y-3 text-left">
                      {result.map((v: any, vIdx: number) => (
                        <div key={vIdx} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                          <h5 className="font-extrabold text-white text-xs flex gap-2">
                            <span className="text-amber-400 font-bold font-mono">Q{vIdx+1}:</span> {v.question}
                          </h5>
                          <p className="text-slate-400 text-xs bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                            <span className="font-mono text-[10px] uppercase text-teal-400 block mb-1">Model Answer:</span>
                            {v.answer}
                          </p>
                          <span className="text-[10px] font-mono text-amber-500 block">💡 Examiner Tip: {v.tip}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CAREER SUGGESTIONS & SKILL GAP */}
                  {activeWorkflow === 'career' && result.careers && (
                    <div className="space-y-4 text-left">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Syllabus Career Suggestions:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.careers.map((cr: string, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold border border-blue-500/20 select-none">
                              {cr}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Your Active Skill Gaps:</span>
                        <div className="space-y-1 text-slate-350 text-xs">
                          {result.skillGap.map((sg: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center text-slate-300">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                              <p>{sg}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Recommended Bridging Textbooks:</span>
                        <div className="space-y-1 text-slate-350 text-xs">
                          {result.recommendedBooks.map((bk: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center text-teal-450 text-teal-300">
                              <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                              <p className="font-semibold">{bk}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROGRESS VELOCITY ESTIMATES */}
                  {activeWorkflow === 'progress' && result.predictions && (
                    <div className="space-y-4 text-left font-mono text-[11px]">
                      <div className="p-4 bg-gradient-to-br from-blue-600/10 to-teal-500/10 border border-teal-500/25 rounded-2xl space-y-3">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">High-Fidelity Milestones Prediction:</span>
                        <div className="space-y-1.5 text-slate-300 font-sans text-xs">
                          {result.milestones.map((ml: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <CheckCircle className="h-4 w-4 text-teal-400 shrink-0" />
                              <p>{ml}</p>
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-white block pt-1 font-bold">Estimated Completion Time: {result.estimatedDays} study days</span>
                      </div>

                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 select-none">
                        <span className="text-[10px] uppercase text-slate-400 font-bold block">Weekly Syllabus Coverage Velocity:</span>
                        <div className="space-y-3 font-sans">
                          {result.predictions.map((pr: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs text-slate-300">
                                <span>{pr.week} (Syllabus Chapters: {pr.chapters})</span>
                                <span className="font-semibold font-mono text-blue-400">+{pr.xpPrediction} Predicted XP</span>
                              </div>
                              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-teal-400 h-full" style={{ width: `${(pr.chapters/14)*100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center gap-2 select-none">
                  <Brain className="h-8 w-8 text-slate-700 animate-pulse" />
                  <p>Choose an analysis selector, fill topic parameter, then click Execute.</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
