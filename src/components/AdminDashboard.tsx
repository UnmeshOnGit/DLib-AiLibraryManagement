import React, { useState, useEffect } from 'react';
import { ShieldAlert, BookOpen, UserCheck, Users, HelpCircle, FileDown, Plus, Trash2, Check, X, AlertOctagon, RefreshCw, Upload, Search, FileText, Clock, User } from 'lucide-react';
import { Book, IssueRecord } from '../types';

interface AdminDashboardProps {
  token: string;
  showMessage: (title: string, text: string, type?: 'success' | 'danger') => void;
}

export function AdminDashboard({ token, showMessage }: AdminDashboardProps) {
  // Pending actions
  const [pendingIssues, setPendingIssues] = useState<IssueRecord[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [loadingPendingStudents, setLoadingPendingStudents] = useState(false);

  // Books CRUD
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  // Stats Analytics Compilation
  const [adminStats, setAdminStats] = useState<any>({
    totalUsers: 0,
    totalBooks: 0,
    totalIssued: 0,
    totalPending: 0
  });

  // Student circulation logs & search state
  const [studentsActivity, setStudentsActivity] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchPRN, setSearchPRN] = useState('');

  // New Book Input State Form
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState('Computer Science');
  const [newDept, setNewDept] = useState('Computer Science');
  const [newIsbn, setNewIsbn] = useState('');
  const [newQuantity, setNewQuantity] = useState(5);
  const [newImage, setNewImage] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Tab State (Approvals, Books, Reports, or Students list by PRN)
  const [adminTab, setAdminTab] = useState<'approvals' | 'books' | 'reports' | 'students'>('approvals');

  useEffect(() => {
    fetchPendingIssues();
    fetchPendingStudents();
    fetchBooks();
    fetchReportsStats();
    fetchStudentActivities();
  }, [token]);

  const fetchPendingIssues = async () => {
    setLoadingIssues(true);
    try {
      const res = await fetch('/api/admin/issues/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPendingIssues(data.issues);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingIssues(false);
    }
  };

  const fetchBooks = async () => {
    setLoadingBooks(true);
    try {
      const res = await fetch('/api/books');
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

  const fetchReportsStats = async () => {
    try {
      const res = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAdminStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentActivities = async () => {
    setLoadingStudents(true);
    try {
      const res = await fetch('/api/admin/students-activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStudentsActivity(data.students);
      }
    } catch (err) {
      console.error("Failed loading student operations activity tracer:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleApprove = async (issueId: string) => {
    try {
      const res = await fetch('/api/admin/issues/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ issueId })
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Issue Approved!", "Status locked to active checkout. Student is notified.", "success");
        fetchPendingIssues();
        fetchReportsStats();
        fetchBooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (issueId: string) => {
    try {
      const res = await fetch('/api/admin/issues/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ issueId })
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Issue Rejected", "Checkout request canceled.", "danger");
        fetchPendingIssues();
        fetchReportsStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingStudents = async () => {
    setLoadingPendingStudents(true);
    try {
      const res = await fetch('/api/admin/users/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPendingStudents(data.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPendingStudents(false);
    }
  };

  const handleApproveStudent = async (studentId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${studentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Student Approved!", "Account registration approved & activated standardly.", "success");
        fetchPendingStudents();
        fetchStudentActivities();
        fetchReportsStats();
      } else {
        showMessage("Error", data.error || "Failed to approve student", "danger");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${studentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Student Dismissed", "Registration request declined successfully.", "danger");
        fetchPendingStudents();
        fetchReportsStats();
      } else {
        showMessage("Error", data.error || "Failed to dismiss registration request", "danger");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuthor || !newIsbn) return;

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          author: newAuthor,
          category: newCategory,
          department: newDept,
          description: newDesc || "Authentic academic reference literature.",
          coverImage: newImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&auto=format&fit=crop&q=60",
          quantity: newQuantity,
          isbn: newIsbn
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Textbook Logged!", `Added "${newTitle}" back into storage systems.`, "success");
        setNewTitle('');
        setNewAuthor('');
        setNewIsbn('');
        setNewDesc('');
        setNewImage('');
        fetchBooks();
        fetchReportsStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (bookId: string, titleStr: string) => {
    if (!confirm(`Are you absolutely sure you want to write-off and delete manual ${titleStr} from active indexes?`)) return;

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Written off", "Removed book shelf logs.", "danger");
        fetchBooks();
        fetchReportsStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compile CSV Excel and Trigger Browser Download stream
  const exportCsvReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "REPORT PARAMETER, VALUE\n";
    csvContent += `Total Enrolled Campus Students, ${adminStats.totalUsers}\n`;
    csvContent += `Textbook Titles Cataloged, ${adminStats.totalBooks}\n`;
    csvContent += `Active Textbook Checkouts, ${adminStats.totalIssued}\n`;
    csvContent += `Pending Queue Demands, ${adminStats.totalPending}\n`;
    
    // Add books rows
    csvContent += "\nCATALOG INDEX,TITLE,AUTHOR,QUANTITY ON SHELVES,DEPARTMENT\n";
    books.forEach((b, idx) => {
      csvContent += `${idx + 1},"${b.title.replace(/"/g, '""')}","${b.author.replace(/"/g, '""')}",${b.availableCopies}/${b.quantity},"${b.department}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "AcademicHub_LibrarianReport_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMessage("Report Exported!", "Compiled raw spreadsheet matrices. File download started.", "success");
  };

  return (
    <div className="space-y-8 font-sans pb-16">
      
      {/* Visual Analytics Widgets summary banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Students Enrolled</span>
            <span className="text-xl sm:text-2xl font-bold block text-white">{adminStats.totalUsers}</span>
          </div>
          <Users className="h-7 w-7 text-blue-400" />
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Catalog Titles</span>
            <span className="text-xl sm:text-2xl font-bold block text-teal-400">{adminStats.totalBooks}</span>
          </div>
          <BookOpen className="h-7 w-7 text-teal-400" />
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Active Checkouts</span>
            <span className="text-xl sm:text-2xl font-bold block text-amber-400">{adminStats.totalIssued}</span>
          </div>
          <UserCheck className="h-7 w-7 text-amber-450 text-amber-400" />
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Pending Actions</span>
            <span className="text-xl sm:text-2xl font-bold block text-rose-400">{adminStats.totalPending}</span>
          </div>
          <ShieldAlert className="h-7 w-7 text-rose-450 text-rose-400" />
        </div>

      </div>

      {/* Internal Navigation Subtabs */}
      <div className="flex flex-wrap border-b border-white/10 gap-2">
        <button
          onClick={() => setAdminTab('approvals')}
          className={`py-2 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition ${adminTab === 'approvals' ? 'border-blue-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
        >
          Approvals Desk ({pendingIssues.length + pendingStudents.length})
        </button>
        <button
          onClick={() => setAdminTab('students')}
          className={`py-2 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition ${adminTab === 'students' ? 'border-sky-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
        >
          🔎 Student PRN Search & Logs
        </button>
        <button
          onClick={() => setAdminTab('books')}
          className={`py-2 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition ${adminTab === 'books' ? 'border-teal-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
        >
          Manage Catalog & Stocks ({books.length})
        </button>
        <button
          onClick={() => setAdminTab('reports')}
          className={`py-2 px-4 text-xs sm:text-sm font-semibold border-b-2 cursor-pointer transition ${adminTab === 'reports' ? 'border-amber-500 text-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
        >
          Spreadsheet Exporter reports
        </button>
      </div>

      {/* RENDER CHOSEN TAB VIEW */}
      <div>
        
        {/* APPROVALS TAB */}
        {adminTab === 'approvals' && (
          <div className="space-y-8">
            
            {/* 1. STUDENT REGISTRATION APPROVALS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                <Users className="h-4.5 w-4.5 text-blue-400" />
                <span>New Student Registration Requests ({pendingStudents.length})</span>
              </h3>

              {loadingPendingStudents ? (
                <div className="text-center text-xs text-slate-500 py-6">Checking registry tables...</div>
              ) : pendingStudents.length === 0 ? (
                <div className="p-6 text-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 text-xs backdrop-blur-md">
                  No student registrations currently waiting approval.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingStudents.map(student => (
                    <div key={student.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
                      
                      <div className="space-y-1.5 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                            REGISTRATION PENDING
                          </span>
                          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                            PRN / STUDENT ID: {student.studentId}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-white">{student.name}</h4>
                        <div className="text-[11px] text-slate-400 space-y-0.5">
                          <p>Academic Email: <b className="text-slate-300">{student.email}</b></p>
                          <p className="font-mono text-[10px]">Division: <b>{student.department} • {student.year}</b></p>
                        </div>
                      </div>

                      {/* Operational controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApproveStudent(student.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-4 w-4" /> Approve & Activate
                        </button>
                        <button
                          onClick={() => handleRejectStudent(student.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-4 w-4" /> Decline
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-t border-white/10" />

            {/* 2. TEXTBOOK ISSUE APPROVALS */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                <UserCheck className="h-4.5 w-4.5 text-blue-400" />
                <span>Pending Desk Issue Approvals ({pendingIssues.length})</span>
              </h3>

              {loadingIssues ? (
                <div className="text-center text-xs text-slate-500 py-6">Scanning request tables...</div>
              ) : pendingIssues.length === 0 ? (
                <div className="p-6 text-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 text-xs backdrop-blur-md">
                  No students currently waiting on book checkout approvals.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingIssues.map(iss => (
                    <div key={iss.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded font-mono">PENDING DESK</span>
                          <h4 className="text-sm font-bold text-white">{iss.bookTitle}</h4>
                        </div>
                        <div className="text-[11px] text-slate-400 space-y-1 text-left">
                          <p>Academic Scholar: <b className="text-slate-300">{iss.studentName || 'Unknown Student'}</b> ({iss.studentEmail || iss.userEmail})</p>
                          <p className="flex items-center gap-2">
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                              PRN / Student ID: {(iss as any).studentPRN || 'N/A'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">Ref ID: {iss.id}</span>
                          </p>
                        </div>
                      </div>

                      {/* Operational controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(iss.id)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-4 w-4" /> Approve Checkout
                        </button>
                        <button
                          onClick={() => handleReject(iss.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <X className="h-4 w-4" /> Decline
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* STUDENT PRN SEARCH & CIRCULATION RECORDS TAB */}
        {adminTab === 'students' && (
          <div className="space-y-6">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <Search className="h-5 w-5 text-sky-400" />
                    <span>Student PRN Circulation & Access Desk</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Search student university databases by PRN (Student ID), name, or enrollment details to trace checked books and historical approvals.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={fetchStudentActivities}
                  disabled={loadingStudents}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 self-start sm:self-center cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingStudents ? 'animate-spin' : ''}`} />
                  <span>Sync DB Logs</span>
                </button>
              </div>

              {/* Search fields input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchPRN}
                  onChange={(e) => setSearchPRN(e.target.value)}
                  placeholder="Enter Student PRN (e.g. U-2026-9041), Name, or Department name..."
                  className="w-full bg-[#0d1325]/40 text-xs sm:text-sm pl-10 pr-4 py-2.5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-sky-500/55 transition"
                />
                {searchPRN && (
                  <button
                    type="button"
                    onClick={() => setSearchPRN('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-405 hover:text-white cursor-pointer px-2"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {loadingStudents ? (
              <div className="text-center text-xs text-slate-500 py-12">Querying database access nodes...</div>
            ) : studentsActivity.filter(s => {
                const q = searchPRN.trim().toLowerCase();
                if (!q) return true;
                return (
                  (s.studentId && s.studentId.toLowerCase().includes(q)) ||
                  (s.name && s.name.toLowerCase().includes(q)) ||
                  (s.email && s.email.toLowerCase().includes(q)) ||
                  (s.department && s.department.toLowerCase().includes(q))
                );
              }).length === 0 ? (
              <div className="p-12 text-center bg-white/5 border border-white/10 rounded-3xl text-slate-400 text-xs backdrop-blur-md space-y-2">
                <p>No student accounts located matching your search query.</p>
                <p className="text-[10px] text-slate-500">Verify the PRN is registered or type a name to lookup.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {studentsActivity
                  .filter(s => {
                    const q = searchPRN.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (s.studentId && s.studentId.toLowerCase().includes(q)) ||
                      (s.name && s.name.toLowerCase().includes(q)) ||
                      (s.email && s.email.toLowerCase().includes(q)) ||
                      (s.department && s.department.toLowerCase().includes(q))
                    );
                  })
                  .map(student => (
                    <div key={student.id} className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-xl text-left space-y-4 transition hover:border-white/20">
                      
                      {/* Student Identity profile ribbon description */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              PRN: {student.studentId}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {student.department} • {student.year}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
                            <User className="h-4.5 w-4.5 text-slate-400" />
                            <span>{student.name}</span>
                          </h4>
                        </div>
                        
                        <div className="text-right text-xs font-mono text-slate-400">
                          <p className="text-[11px] text-slate-300">{student.email}</p>
                          <p className="text-[10px] text-sky-400 mt-1 font-bold">Outstanding Checked Books: {student.activeCheckoutsCount}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-12 gap-6 pt-1">
                        
                        {/* Left: Active books check list */}
                        <div className="md:col-span-4 bg-slate-950/20 p-4 border border-white/5 rounded-2xl space-y-3">
                          <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-amber-400 block border-b border-white/5 pb-1.5 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span>Books in Possession</span>
                          </span>
                          
                          {student.activeCheckouts.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2">No active book checkouts found.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {student.activeCheckouts.map((bookTitle: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-200 bg-white/[0.03] p-2 rounded-xl border border-white/5">
                                  <span className="text-emerald-400">⚫</span>
                                  <span>{bookTitle}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right: History trace list */}
                        <div className="md:col-span-8 bg-slate-950/20 p-4 border border-white/5 rounded-2xl space-y-3">
                          <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-sky-400 block border-b border-white/5 pb-1.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Book Circulation History Log</span>
                          </span>

                          {student.history.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-2 text-center">No historic circulation logs found.</p>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {student.history.map((log: any) => {
                                // Color code states
                                let badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                                if (log.status === 'issued') badgeColor = "bg-amber-500/15 text-amber-400 border-amber-500/25 font-bold";
                                if (log.status === 'returned') badgeColor = "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
                                if (log.status === 'pending') badgeColor = "bg-blue-500/15 text-blue-400 border-blue-500/25 font-bold";
                                if (log.status === 'rejected') badgeColor = "bg-rose-500/15 text-rose-400 border-rose-500/25";

                                return (
                                  <div key={log.id} className="text-xs bg-[#12192c]/55 p-2 rounded-xl border border-white/5 space-y-1 flex items-start justify-between gap-4">
                                    <div className="space-y-1 text-left min-w-0">
                                      <h5 className="font-bold text-slate-100 truncate">{log.bookTitle}</h5>
                                      <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5">
                                        <span>Request: <b>{log.requestDate ? new Date(log.requestDate).toLocaleDateString() : 'N/A'}</b></span>
                                        {log.issueDate && <span>Issue: <b>{new Date(log.issueDate).toLocaleDateString()}</b></span>}
                                        {log.returnDate && <span className="text-emerald-400">Returned: <b>{new Date(log.returnDate).toLocaleDateString()}</b></span>}
                                        {log.dueDate && !log.returnDate && (
                                          <span className={new Date() > new Date(log.dueDate) ? 'text-rose-450 font-extrabold' : 'text-slate-400'}>
                                            Due: <b>{new Date(log.dueDate).toLocaleDateString()}</b>
                                          </span>
                                        )}
                                      </div>
                                      {log.fineAmount > 0 && (
                                        <p className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/25 inline-block">
                                          Outstanding Fine: ₹{log.fineAmount}
                                        </p>
                                      )}
                                    </div>
                                    
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wide border shrink-0 ${badgeColor}`}>
                                      {log.status === 'issued' ? 'checked out' : log.status}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                        </div>

                      </div>

                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* BOOK STOCKS INVENTORY CRUD TAB */}
        {adminTab === 'books' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Textbook CRUD inventory lists */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-teal-400" />
                <span>Textbook active directories</span>
              </h3>

              {loadingBooks ? (
                <div className="text-center text-xs text-slate-500">Checking inventory tables...</div>
              ) : books.length === 0 ? (
                <div className="p-6 text-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 text-xs backdrop-blur-md">No books recorded.</div>
              ) : (
                <div className="space-y-2.5">
                  {books.map(b => (
                    <div key={b.id} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={b.coverImage} className="w-10 h-14 object-cover rounded border" referrerPolicy="no-referrer" />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">{b.title}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{b.author} • {b.category}</p>
                          <p className="text-[10px] font-mono text-slate-500">Copies: {b.availableCopies} available / {b.quantity} physical</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteBook(b.id, b.title)}
                        className="p-2 bg-slate-950/40 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border border-slate-850 rounded-xl transition cursor-pointer"
                        title="Delete and write-off manual"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick entry submission form */}
            <div className="lg:col-span-4 bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl space-y-4 backdrop-blur-md">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300 font-mono flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-blue-500" />
                <span>Submit Textbook</span>
              </h3>
              <p className="text-[11px] text-slate-450 leading-normal">Configure new volume entry properties into databases.</p>

              <form onSubmit={handleAddBookSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-405 text-slate-400 font-mono">Textbook Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Quantitative Chemistry Analysis"
                    className="w-full bg-white/5 text-xs px-2.5 py-1.5 border border-white/10 rounded-xl text-white placeholder-slate-450 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-405 text-slate-400 font-mono">Course Author / Editor</label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Dr. Arthur Simmons"
                    className="w-full bg-white/5 text-xs px-2.5 py-1.5 border border-white/10 rounded-xl text-white placeholder-slate-450 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-405 text-slate-400 font-mono">Level Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#11172a] text-xs px-2 py-1.5 border border-white/10 rounded-xl text-white cursor-pointer"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Sciences">Sciences</option>
                      <option value="Fine Arts">Fine Arts</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-405 text-slate-400 font-mono">Department</label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full bg-[#11172a] text-xs px-2 py-1.5 border border-white/10 rounded-xl text-white cursor-pointer"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Sciences">Sciences</option>
                      <option value="Fine Arts">Fine Arts</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-405 text-slate-400 font-mono">ISBN Serial</label>
                    <input
                      type="text"
                      required
                      value={newIsbn}
                      onChange={(e) => setNewIsbn(e.target.value)}
                      placeholder="e.g. 978-3-16-1481"
                      className="w-full bg-white/5 text-xs px-2.5 py-1.5 border border-white/10 rounded-xl text-white placeholder-slate-450 font-mono focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-405 text-slate-400 font-mono">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value))}
                      className="w-full bg-white/5 text-xs px-2.5 py-1.5 border border-white/10 rounded-xl text-white focus:outline-none"
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-405 text-slate-400 font-mono">Cover Image asset URL</label>
                  <input
                    type="url"
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="Provide image link..."
                    className="w-full bg-white/5 text-xs px-2.5 py-1.5 border border-white/10 rounded-xl text-white placeholder-slate-450 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-405 text-slate-400 font-mono">Subject Summary</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Short course description values..."
                    className="w-full bg-white/5 text-xs p-2.5 border border-white/10 rounded-xl text-white h-14 placeholder-slate-450 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-650 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md font-mono"
                >
                  Log textbook into shelves
                </button>
              </form>
            </div>

          </div>
        )}

        {/* STATS ANALYTICS CSV SPREADSHEET EXPORTER TAB */}
        {adminTab === 'reports' && (
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 shadow-xl max-w-xl mx-auto space-y-6 text-center backdrop-blur-md">
            
            <div className="mx-auto w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center animate-bounce">
              <FileDown className="h-6 w-6 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-white">Generate Campus Diagnostics spreadsheets</h3>
              <p className="text-xs text-slate-350 max-w-sm mx-auto leading-relaxed text-slate-300">Assemble database summaries, user statistics arrays, fine calculations, outstanding checkout issues, and category representations into an Excel-compatible CSV file.</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 grid grid-cols-2 gap-4 text-left text-xs font-mono text-slate-400 leading-relaxed backdrop-blur-md">
              <div>
                <span>Records: </span>
                <span className="font-bold text-white">{adminStats.totalUsers} registered accounts</span>
              </div>
              <div>
                <span>Checked Issues: </span>
                <span className="font-bold text-white">{adminStats.totalIssued} active</span>
              </div>
              <div>
                <span>Librarian Desk: </span>
                <span className="font-bold text-slate-300">{adminStats.totalPending} waiting desk actions</span>
              </div>
              <div>
                <span>Department categories: </span>
                <span className="font-bold text-white">Grid active directories</span>
              </div>
            </div>

            <button
              onClick={exportCsvReport}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:brightness-110 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-500/20 cursor-pointer font-mono"
            >
              Export & Download Excel CSV Report
            </button>

          </div>
        )}

      </div>

    </div>
  );
}
