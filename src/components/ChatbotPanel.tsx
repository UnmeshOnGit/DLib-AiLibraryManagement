import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, BookOpen, User, HelpCircle, GraduationCap, ArrowUpRight } from 'lucide-react';

interface ChatbotPanelProps {
  token: string;
}

export function ChatbotPanel({ token }: ChatbotPanelProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; date: string }>>([
    {
      sender: 'assistant',
      text: "Welcome to the Academic Hub AI Assistant! 🎓\n\nI am grounded securely in our library database. I can:\n1. Suggest relevant textbooks by department interests\n2. Outline learning roadmaps and suggest study channels\n3. Describe checkout logistics, due dates, and fine metrics\n\nHow can I support your study target goals today?",
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: "Suggest Python textbooks", prompt: "Recommend python books in our library catalog and specify if they are on shelf." },
    { label: "Explain Library checkout rules", prompt: "What are the rules regarding textbook checkout length, and late fine rates?" },
    { label: "Suggest Web Dev learning path", prompt: "Suggest a learning path for full-stack web development." },
    { label: "List computer science textbooks", prompt: "Find available Computer Science department category books on shelves." }
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim()) return;

    if (!customPrompt) setInput('');

    const userMsg = {
      sender: 'user' as const,
      text: promptToSend,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: promptToSend, chatHistory: messages })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.reply,
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `⚠️ Assistant failed to respond: ${err.message}. Ensure your GEMINI_API_KEY is configured under Settings secrets.`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl h-[75vh] flex flex-col justify-between font-sans backdrop-blur-md relative overflow-hidden">
      
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-650/10 bg-blue-500/10 rounded-xl border border-white/10">
            <Sparkles className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-sans sm:text-base">Librarian Scholar AI</h3>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase block leading-none mt-0.5">Academic Assist Service</span>
          </div>
        </div>
        <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono font-bold px-2 py-0.5 rounded-full">Grounded Catalog On Shelf</span>
      </div>

      {/* Messages area scroll blocks */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 select-text">
        {messages.map((m, idx) => {
          const isAi = m.sender === 'assistant';
          return (
            <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'} gap-3 items-start`}>
              {isAi && (
                <div className="p-1.5 bg-blue-600/10 text-blue-400 rounded-lg shrink-0 mt-1 border">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
              )}
              
              <div className="space-y-1 max-w-[85%]">
                <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${isAi ? 'bg-white/5 border border-white/10 text-slate-350 text-slate-300 backdrop-blur-sm shadow-sm' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'}`}>
                  {m.text}
                </div>
                <span className="text-[9px] font-mono text-slate-500 uppercase block text-right pr-1">{m.date}</span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start gap-4 items-center">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg shrink-0 border border-white/10 animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            </div>
            <div className="p-3 bg-white/5 border border-white/5 text-slate-400 text-xs rounded-xl italic backdrop-blur-sm">
              AI Librarian scanning textbook index systems...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Dynamic Actions panel footer */}
      <div className="space-y-4 shrink-0 col-span-1">
        
        {/* Quick Prompts slider if session is blank */}
        {messages.length < 3 && !loading && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest block font-bold">Frequently Asked Questions:</span>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((qp, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] text-slate-300 hover:text-white text-left transition flex items-center justify-between gap-1.5 cursor-pointer max-w-full backdrop-blur-md"
                >
                  <span>{qp.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-505 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TextInput controls */}
        <div className="flex gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder="Type your curriculum / catalog query here (e.g. explain circuit nodes)..."
            className="block flex-1 px-4 py-2.5 bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-0 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-450 focus:outline-none"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 select-none text-white rounded-xl transition disabled:opacity-40 cursor-pointer text-sm shrink-0 flex items-center justify-center shadow-lg"
          >
            <Send className="h-4.5 w-4.5 text-white" />
          </button>
        </div>
      </div>

    </div>
  );
}
