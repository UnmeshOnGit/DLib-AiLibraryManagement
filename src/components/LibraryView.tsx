import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, BookOpen, User, BookMarked, Calendar, HelpCircle, Star, Sparkles, Mic, MicOff, AlertCircle, RefreshCw, QrCode, ClipboardList, CheckCircle2 } from 'lucide-react';
import { Book, IssueRecord, ReservationRecord } from '../types';
import { ExamNotesPanel } from './ExamNotesPanel';

interface LibraryViewProps {
  token: string;
  user: any;
  onUpdateStats: () => void;
  showMessage: (title: string, text: string, type?: 'success' | 'danger') => void;
}

export function LibraryView({ token, user, onUpdateStats, showMessage }: LibraryViewProps) {
  // Books Stock State
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [availability, setAvailability] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('title');

  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Active Selected Book detailing for AI Summary
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [examNotesBook, setExamNotesBook] = useState<any>(null);

  // Issues & Reservations lists
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // QR Modal State
  const [activeQrIssue, setActiveQrIssue] = useState<IssueRecord | null>(null);

  // Rating Interaction
  const [bookRatingValue, setBookRatingValue] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    fetchStudentLogs();
    
    // Check voice support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory, selectedDept, availability, minRating, sortBy]);

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const q = new URLSearchParams({
        search,
        category: selectedCategory,
        department: selectedDept,
        availability,
        rating: minRating,
        sortBy
      });
      const res = await fetch(`/api/books?${q}`);
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/books/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentLogs = async () => {
    setLoadingLogs(true);
    try {
      // Get issues
      const resI = await fetch('/api/issues', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataI = await resI.json();
      if (dataI.success) {
        setIssues(dataI.issues);
      }

      // Get reservations
      const resR = await fetch('/api/reservations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataR = await resR.json();
      if (dataR.success) {
        setReservations(dataR.reservations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Voice recognition logic
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      showMessage("Listening...", "Say a textbook title, author, or category topic...", "success");
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
      showMessage("Microphone Error", "Failed to capture audio cleanly. Try again.", "danger");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      showMessage("Search Filled", `Filtered directory for term: "${transcript}"`, "success");
    };

    recognition.start();
  };

  // Issue Textbook
  const requestBookIssue = async (bookId: string) => {
    try {
      const res = await fetch('/api/issues/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Issue failed');
      }
      showMessage("Request Submitted!", "Submitted to catalog librarian for checkout approval.", "success");
      fetchBooks();
      fetchStudentLogs();
      onUpdateStats();
    } catch (err: any) {
      showMessage("Issue Restriction", err.message, "danger");
    }
  };

  // Join Reservation Waiting List
  const joinReserveList = async (bookId: string) => {
    try {
      const res = await fetch('/api/reservations/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reservation failed');
      }
      showMessage("Added to Queue", "You have joined the active reservation list for this textbook.", "success");
      fetchBooks();
      fetchStudentLogs();
    } catch (err: any) {
      showMessage("Queue Error", err.message, "danger");
    }
  };

  // Renew active book
  const renewBook = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/renew`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      showMessage("Checkout Renewed", "We extended your return deadline by 14 calendar days.", "success");
      fetchStudentLogs();
      onUpdateStats();
    } catch (err: any) {
      showMessage("Cannot Renew", err.message, "danger");
    }
  };

  // Return book via mock QR / checkin
  const returnBook = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      showMessage("Returned Successfully", "Point stats updated on your leaderboard.", "success");
      fetchStudentLogs();
      fetchBooks();
      onUpdateStats();
      setActiveQrIssue(null);
    } catch (err: any) {
      showMessage("Return Failed", err.message, "danger");
    }
  };

  // AI textbook Summary
  const generateAiSummary = async (bookId: string) => {
    setLoadingAi(true);
    setAiSummary('');
    setAiReview('');
    try {
      const res = await fetch(`/api/books/${bookId}/generate-summary`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAiSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // AI Textbook review
  const generateAiReview = async (bookId: string) => {
    setLoadingAi(true);
    setAiSummary('');
    setAiReview('');
    try {
      const res = await fetch(`/api/books/${bookId}/generate-review`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAiReview(data.review);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Star Rating Submit
  const handleRatingSubmit = async (bookId: string, value: number) => {
    try {
      const res = await fetch(`/api/books/${bookId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: value })
      });
      const data = await res.json();
      if (data.success) {
        setBookRatingValue(prev => ({ ...prev, [bookId]: value }));
        showMessage("Feedback Logged", `You rated this textbook ${value} Stars. Average is now: ${data.ratingValue}`, "success");
        fetchBooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Search Header Banner */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/20 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full filter blur-2xl" />
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">Campus Textbook Catalogue</h2>
        <p className="text-slate-400 text-xs sm:text-sm">Find, hold, or reserve university core literature. Powered by voice filters and instant AI summary engines.</p>

        {/* Input cluster */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Title, Author, Category, Subject, or ISBN..."
              className="block w-full pl-10 pr-24 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-0 text-white placeholder-slate-400 text-xs sm:text-sm backdrop-blur-md"
            />
            {voiceSupported && (
              <button
                onClick={handleVoiceSearch}
                className={`absolute right-2 top-1.5 p-1 rounded-lg transition ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-850 hover:bg-slate-800 text-slate-300'} cursor-pointer`}
                title="Voice Search Books"
              >
                {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
              </button>
            )}
          </div>

          {/* Sorters and filter sliders */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 backdrop-blur-md cursor-pointer"
            >
              <option value="" className="bg-[#12182b] text-white">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c} className="bg-[#12182b] text-white">{c}</option>
              ))}
            </select>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 backdrop-blur-md cursor-pointer"
            >
              <option value="" className="bg-[#12182b] text-white">All Departments</option>
              <option value="Computer Science" className="bg-[#12182b] text-white">Computer Science</option>
              <option value="Engineering" className="bg-[#12182b] text-white">Engineering</option>
              <option value="Business Administration" className="bg-[#12182b] text-white">Business Admin</option>
              <option value="Fine Arts" className="bg-[#12182b] text-white">Fine Arts</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 backdrop-blur-md cursor-pointer"
            >
              <option value="title" className="bg-[#12182b] text-white">Alphabetical (A-Z)</option>
              <option value="popularity" className="bg-[#12182b] text-white">Popular checked out</option>
              <option value="rating" className="bg-[#12182b] text-white">Highest Rated</option>
              <option value="latest" className="bg-[#12182b] text-white">Latest Additions</option>
            </select>
          </div>
        </div>
      </div>

      {/* Book Catalogue grid */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 font-mono mb-4 flex items-center gap-2">
          <span>Catalog Results</span>
          <span className="text-xs text-blue-500 font-bold bg-blue-500/15 px-2.5 py-0.5 rounded-full">{books.length} shelves books</span>
        </h3>

        {loadingBooks ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
            <span>Scanning library catalogue databases...</span>
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/30 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm font-medium">No textbook matching criteria was found on shelves.</p>
            <p className="text-slate-500 text-xs mt-1">Try specifying a broader subject search term or checking and clearing active filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(b => {
              const ratedAt = bookRatingValue[b.id] || 0;
              return (
                <div key={b.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition flex flex-col group p-4 gap-4 relative backdrop-blur-md shadow-xl">
                  
                  {/* Textbook visual header */}
                  <div className="flex gap-4">
                    <img
                      src={b.coverImage}
                      alt={b.title}
                      referrerPolicy="no-referrer"
                      className="w-18 h-24 object-cover rounded-lg border border-white/10 shadow-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <span className="inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">
                          {b.category}
                        </span>
                        {(b as any).compatibilityScore !== undefined && (
                          <span className="inline-block text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-md">
                            🔥 {(b as any).compatibilityScore}% Match
                          </span>
                        )}
                        {(b as any).difficultyLevel !== undefined && (
                          <span className="inline-block text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-[#c084fc] border border-purple-500/20">
                            📚 {(b as any).difficultyLevel}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold leading-tight text-white line-clamp-2">{(b as any).title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{(b as any).author}</p>
                      {(b as any).compatibilityReason && (
                        <p className="text-[11.5px] text-teal-400 font-mono font-medium mt-1">{(b as any).compatibilityReason}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center text-amber-400">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span className="text-xs font-bold text-slate-200 ml-1">{(b as any).ratingValue}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[11px] text-slate-400">{(b as any).department}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed mt-1 flex-1">{b.description}</p>

                  {/* Stock parameters details badge */}
                  <div className="text-[11px] bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center justify-between text-slate-300 backdrop-blur-md">
                    <div>
                      <span>Stock Avail: </span>
                      <span className={`font-bold ${b.availableCopies > 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                        {b.availableCopies} / {b.quantity}
                      </span>
                    </div>
                    <span>ISBN: <code className="text-slate-350 font-mono text-[10px]">{b.isbn.slice(-6)}</code></span>
                  </div>

                  {/* Actions drawer panel */}
                  <div className="space-y-2 mt-2">
                    {/* Issues checkout trigger */}
                    {b.availableCopies > 0 ? (
                      <button
                        onClick={() => requestBookIssue(b.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl transition cursor-pointer"
                      >
                        Request Academic Issue
                      </button>
                    ) : (
                      <button
                        onClick={() => joinReserveList(b.id)}
                        className="w-full py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-600/30 font-medium text-xs rounded-xl transition cursor-pointer"
                      >
                        Join Reservation List
                      </button>
                    )}

                    {/* AI summarizing panels */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setSelectedBook(b);
                          generateAiSummary(b.id);
                        }}
                        className="py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-[10px] font-mono rounded-lg transition inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" /> AI Summary
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBook(b);
                          generateAiReview(b.id);
                        }}
                        className="py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-[10px] font-mono rounded-lg transition inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="h-3 w-3 text-blue-400" /> Prof Review
                      </button>
                    </div>

                    {/* Book Exam-to-Notes Guide Interactive portal */}
                    <button
                      onClick={() => setExamNotesBook(b)}
                      className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" /> Book exam Notes & Prep
                    </button>

                    {/* Star Rating interactive feedback */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                      <span className="text-[10px] text-slate-500 font-mono">Submit stars:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(v => (
                          <button
                            key={v}
                            onClick={() => handleRatingSubmit(b.id, v)}
                            className="p-0.5 text-slate-500 hover:text-amber-400 transition cursor-pointer"
                          >
                            <Star className={`h-3 w-3 ${ratedAt >= v ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>      {/* AI Summary Sidebar Modal Draw */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-[#070b19]/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-slate-900/90 border-l border-white/20 backdrop-blur-xl h-full p-6 sm:p-8 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                  <span className="text-sm font-extrabold uppercase tracking-wider text-slate-205 text-slate-300 font-mono">AI Smart Reading Assistant</span>
                </div>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="p-1 px-3 bg-white/5 text-slate-300 hover:text-white rounded-lg text-xs border border-white/10 cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Cover info */}
              <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <img src={selectedBook.coverImage} className="w-16 h-22 object-cover rounded-lg shadow-md" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-bold text-white text-base leading-tight">{selectedBook.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Author: {selectedBook.author}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">ISBN: {selectedBook.isbn}</p>
                </div>
              </div>

              {/* Gemini Output */}
              <div className="space-y-4">
                <h5 className="text-xs font-mono text-slate-400 uppercase tracking-widest">Assistant Generated Output</h5>
                
                {loadingAi ? (
                  <div className="py-20 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
                    <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                    <span>Librarian AI helper synthezising response...</span>
                  </div>
                ) : aiSummary ? (
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3 prose prose-invert max-w-full text-xs sm:text-sm leading-relaxed text-slate-300 backdrop-blur-md shadow">
                    <div className="whitespace-pre-line">{aiSummary}</div>
                  </div>
                ) : aiReview ? (
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3 prose prose-invert max-w-full text-xs sm:text-sm leading-relaxed text-slate-300 backdrop-blur-md shadow">
                    <div className="whitespace-pre-line">{aiReview}</div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-550 text-slate-500 font-mono">Press option below to prompt.</span>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex gap-3">
              <button
                onClick={() => generateAiSummary(selectedBook.id)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium rounded-xl text-slate-300 transition cursor-pointer font-mono"
              >
                Regenerate Summary
              </button>
              <button
                onClick={() => generateAiReview(selectedBook.id)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium rounded-xl text-slate-300 transition cursor-pointer font-mono"
              >
                Regenerate Critique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issues & Reservations Logistics Tracking */}
      <div className="border-t border-white/10 pt-8 mt-12 grid lg:grid-cols-12 gap-8">
        
        {/* Checkout registers */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 font-mono mb-2 flex items-center gap-2">
            <ClipboardList className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
            <span>My Textbook Checkouts Log</span>
          </h3>

          {loadingLogs ? (
            <div className="py-6 text-center text-xs text-slate-500">Checking logs...</div>
          ) : issues.length === 0 ? (
            <div className="p-6 text-center bg-white/5 rounded-2xl border border-white/10 text-slate-400 text-xs backdrop-blur-md">
              No textbook issue records recorded under your account.
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map(iss => {
                const isOverdue = iss.status === 'issued' && iss.dueDate && new Date() > new Date(iss.dueDate);
                return (
                  <div key={iss.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
                    
                    <div className="space-y-1.5 font-sans">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          iss.status === 'issued' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                          iss.status === 'returned' ? 'bg-white/5 text-slate-400 border border-white/10' :
                          iss.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/10 text-slate-300'
                        }`}>
                          {iss.status.toUpperCase()}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{iss.bookTitle}</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono">
                        {iss.issueDate && (
                          <span>Issued: {new Date(iss.issueDate).toLocaleDateString()}</span>
                        )}
                        {iss.dueDate && (
                          <span className={`${isOverdue ? 'text-red-400 font-bold' : ''}`}>
                            Due: {new Date(iss.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {iss.fineAmount > 0 && (
                          <span className="text-amber-400 font-bold">Late Penalty: ${iss.fineAmount.toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions - renew returned QR view */}
                    <div className="flex items-center gap-2">
                      {iss.status === 'issued' && (
                        <>
                          <button
                            onClick={() => renewBook(iss.id)}
                            disabled={iss.isRenewed}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 rounded-lg border border-white/10 transition disabled:opacity-40 cursor-pointer font-mono"
                            title={iss.isRenewed ? 'Already renewed link once' : 'Extend 14 days'}
                          >
                            Renew Limit {iss.isRenewed ? '1/1' : '0/1'}
                          </button>
                          
                          <button
                            onClick={() => setActiveQrIssue(iss)}
                            className="p-1 px-3.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] rounded-lg tracking-wider font-semibold ml-1 inline-flex items-center gap-1 cursor-pointer font-mono"
                          >
                            <QrCode className="h-3.5 w-3.5" /> Return QR
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reservations holding */}
        <div className="lg:col-span-5 space-y-4 font-sans">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 font-mono mb-2 flex items-center gap-2">
            <BookMarked className="h-4.5 w-4.5 text-amber-400 animate-pulse" />
            <span>My Holds & Queue Positions</span>
          </h3>

          {loadingLogs ? (
            <div className="py-6 text-center text-xs text-slate-500">Checking queues...</div>
          ) : reservations.length === 0 ? (
            <div className="p-6 text-center bg-white/5 rounded-2xl border border-white/10 text-slate-400 text-xs backdrop-blur-md">
              No active catalog reservations holding currently.
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map(r => (
                <div key={r.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 backdrop-blur-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-normal">{r.bookTitle}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">Requested hold: {new Date(r.requestDate).toLocaleDateString()}</p>
                    </div>
                    <span className="text-[10.5px] font-mono font-semibold uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                      {r.status}
                    </span>
                  </div>

                  {/* Claim helper button if available copies have returned */}
                  {r.status === 'available' && (
                    <div className="p-2.5 bg-teal-500/5 rounded-xl border border-teal-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-teal-400">Your textbook became available! Ready for pickup.</span>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/reservations/${r.id}/claim`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (data.success) {
                              showMessage("Book Claimed!", "Checkout record finalized. Book is officially issued to you.", "success");
                              fetchStudentLogs();
                              onUpdateStats();
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-3 py-1 bg-teal-600/80 hover:bg-teal-500 text-white font-bold text-[10px] rounded"
                      >
                        Claim Issue
                      </button>
                    </div>
                  )}

                  {r.status === 'waiting' && (
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-white/10 pt-2">
                      <span>Queue Position Indicator:</span>
                      <span className="font-bold text-blue-400 font-mono">Pos #{r.queuePosition}</span>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* QR Code return modal trigger simulation */}
      {activeQrIssue && (
        <div className="fixed inset-0 z-50 bg-[#070b19]/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-[#10162a]/95 border border-white/20 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full text-center space-y-6 shadow-2xl relative">
            <h4 className="text-base font-extrabold text-white">QR Code Book Issue System</h4>
            <p className="text-xs text-slate-300 leading-normal">Scan this QR code at any library kiosk or terminal to auto check-in and return of textbook.</p>

            {/* Fake QR box drawing */}
            <div className="mx-auto w-48 h-48 bg-white rounded-2xl flex items-center justify-center p-4 shadow-xl border-4 border-blue-500">
              <div className="bg-slate-900 w-full h-full rounded-lg flex flex-col items-center justify-center text-white">
                <QrCode className="h-28 w-28 text-white stroke-[1.5]" />
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-50 mt-1">Ref: {activeQrIssue.id.slice(-8)}</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] text-slate-300">
              <span className="font-bold block text-white">Book Details:</span>
              <span>{activeQrIssue.bookTitle}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => returnBook(activeQrIssue.id)}
                className="flex-1 py-2 bg-blue-600/85 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Mock Scan / Force Check-In
              </button>
              <button
                onClick={() => setActiveQrIssue(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Book Exam Notes & Preparation overlay drawer */}
      {examNotesBook && (
        <ExamNotesPanel
          token={token}
          book={examNotesBook}
          onClose={() => setExamNotesBook(null)}
          showMessage={showMessage}
        />
      )}

    </div>
  );
}
