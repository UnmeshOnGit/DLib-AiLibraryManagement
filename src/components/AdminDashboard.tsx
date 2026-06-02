import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  BookOpen, PlusCircle, Trash2, Edit, Check, X, Shield, Activity, 
  FileText, RotateCw, AlertTriangle, Star, Sliders, RefreshCw, Library, UserCheck, 
  Download, BookLock, Landmark, GraduationCap, Trash, Database, Settings
} from "lucide-react";
import { Book, IssueRequest, LogEntry, Feedback } from "../types";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  id?: string;
}

export default function AdminDashboard({ user, onLogout, id }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'student-approvals' | 'audit-logs' | 'feedback' | 'system'>('requests');
  
  // State elements
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<IssueRequest[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; provider: string; connectionString: string; lastError?: string | null } | null>(null);
  const [logActionFilter, setLogActionFilter] = useState('All');
  const [syncingMongo, setSyncingMongo] = useState(false);

  // New/Edit Book Form Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');
  const [bookDept, setBookDept] = useState('Computer Engineering');
  const [bookDesc, setBookDesc] = useState('');
  const [bookTotalCols, setBookTotalCols] = useState(5);
  const [bookCategory, setBookCategory] = useState('Algorithms');
  const [bookLocation, setBookLocation] = useState('Rack A-3, Central Library');

  // Loading indicator states
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const departments = ["Computer Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Civil Engineering", "Information Technology"];

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Parallelize fetches
      const [booksRes, issuesRes, logsRes, feedbackRes, pendingRes, dbStatusRes] = await Promise.all([
        fetch("/api/books"),
        fetch("/api/issues"),
        fetch("/api/logs"),
        fetch("/api/feedback"),
        fetch("/api/admin/pending-students"),
        fetch("/api/system/db-status")
      ]);

      const [booksData, issuesData, logsData, feedbackData, pendingData, dbStatusData] = await Promise.all([
        booksRes.json(),
        issuesRes.json(),
        logsRes.json(),
        feedbackRes.json(),
        pendingRes.json(),
        dbStatusRes.json()
      ]);

      setBooks(booksData);
      setIssues(issuesData);
      setLogs(logsData);
      setFeedbacks(feedbackData);
      setPendingStudents(pendingData || []);
      setDbStatus(dbStatusData || null);
    } catch (err) {
      triggerToast("error", "Failed to retrieve administrators dataset from Central DBATU.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMongoDB = async () => {
    setSyncingMongo(true);
    try {
      const res = await fetch("/api/system/db-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id, adminName: user.name })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("success", data.message || "Central database stored to MongoDB cluster successfully!");
        fetchAdminData();
      } else {
        triggerToast("error", data.error || "Handshake synchronization failed.");
      }
    } catch (err) {
      triggerToast("error", "Failed connecting to database API proxy.");
    } finally {
      setSyncingMongo(false);
    }
  };

  // Student Sign-up Approval handlers
  const handleApproveStudent = async (studentId: string) => {
    setActioning(studentId);
    try {
      const res = await fetch("/api/admin/approve-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, adminId: user.id, adminName: user.name })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", data.message || "Student approved successfully!");
        fetchAdminData();
      } else {
        triggerToast("error", data.error || "Approval failed.");
      }
    } catch {
      triggerToast("error", "Network mismatch.");
    } finally {
      setActioning(null);
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    setActioning(studentId);
    try {
      const res = await fetch("/api/admin/reject-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, adminId: user.id, adminName: user.name })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", data.message || "Sign-up application deleted.");
        fetchAdminData();
      } else {
        triggerToast("error", data.error || "Rejection failed.");
      }
    } catch {
      triggerToast("error", "Network mismatch.");
    } finally {
      setActioning(null);
    }
  };

  // Issue/Reservation approvals
  const handleApproveCheckout = async (issueId: string) => {
    setActioning(issueId);
    try {
      const res = await fetch(`/api/issues/approve/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id, adminName: user.name })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Allocation cleared! Checkout order successfully issued.");
        fetchAdminData();
      } else {
        triggerToast("error", data.error || "Approval rejected.");
      }
    } catch {
      triggerToast("error", "Network mismatch.");
    } finally {
      setActioning(null);
    }
  };

  // Reject Issue request
  const handleRejectCheckout = async (issueId: string) => {
    setActioning(issueId);
    try {
      const res = await fetch(`/api/issues/reject/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id, adminName: user.name })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Issue request rejected.");
        fetchAdminData();
      } else {
        triggerToast("error", data.error || "Rejection logic failed.");
      }
    } catch {
      triggerToast("error", "Operation aborted.");
    } finally {
      setActioning(null);
    }
  };

  // Approve renewal extension request
  const handleApproveRenewal = async (issueId: string) => {
    setActioning(issueId);
    try {
      const res = await fetch(`/api/issues/approve-renewal/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id, adminName: user.name })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Textbook term successfully extended (+7 Days).");
        fetchAdminData();
      } else {
        triggerToast("error", data.error || "Renewal approval failed.");
      }
    } catch {
      triggerToast("error", "Network issue.");
    } finally {
      setActioning(null);
    }
  };

  // Mark Book Returned
  const handleRegisterReturn = async (issueId: string) => {
    setActioning(issueId);
    try {
      const res = await fetch(`/api/issues/return/${issueId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id, adminName: user.name })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("success", "Book return successfully logged! Stock replenished.");
        fetchAdminData();
      } else {
        triggerToast("error", data.error || "Return log failed.");
      }
    } catch {
      triggerToast("error", "Process crashed.");
    } finally {
      setActioning(null);
    }
  };

  // Add/Edit Book action handler
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle || !bookAuthor || !bookIsbn || !bookCategory) {
      triggerToast("error", "Fill in necessary fields.");
      return;
    }

    try {
      const isEdit = !!editingBookId;
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit ? `/api/books/${editingBookId}` : "/api/books";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookTitle,
          author: bookAuthor,
          isbn: bookIsbn,
          department: bookDept,
          description: bookDesc,
          totalCopies: bookTotalCols,
          category: bookCategory,
          location: bookLocation,
          adminId: user.id,
          adminName: user.name
        })
      });

      if (res.ok) {
        triggerToast("success", isEdit ? "Indexed textbook database updated." : "New book registered to DBATU.");
        setShowBookModal(false);
        resetBookForm();
        fetchAdminData();
      } else {
        const data = await res.json();
        triggerToast("error", data.error || "Save rejected.");
      }
    } catch {
      triggerToast("error", "Network validation failed.");
    }
  };

  const startEditBook = (book: Book) => {
    setEditingBookId(book.id);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookIsbn(book.isbn);
    setBookDept(book.department);
    setBookDesc(book.description);
    setBookTotalCols(book.totalCopies);
    setBookCategory(book.category);
    setBookLocation(book.location);
    setShowBookModal(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm("Permanently archive this textbook from DBATU assets? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id, adminName: user.name })
      });

      if (res.ok) {
        triggerToast("success", "Book reference permanently purged.");
        fetchAdminData();
      } else {
        triggerToast("error", "Delete rejected.");
      }
    } catch {
      triggerToast("error", "Network issue.");
    }
  };

  const resetBookForm = () => {
    setEditingBookId(null);
    setBookTitle('');
    setBookAuthor('');
    setBookIsbn('');
    setBookDept('Computer Engineering');
    setBookDesc('');
    setBookTotalCols(5);
    setBookCategory('Algorithms');
    setBookLocation('Rack A-3, Central Library');
  };

  const triggerFactoryReset = async () => {
    if (!window.confirm("Reset entire collegiate DBATU catalog, active issue arrays, and feedback logs back to factory defaults?")) return;

    try {
      const res = await fetch("/api/system/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: user.id, adminName: user.name })
      });

      if (res.ok) {
        triggerToast("success", "Central database reset completed.");
        fetchAdminData();
      } else {
        triggerToast("error", "Reset process blocked.");
      }
    } catch {
      triggerToast("error", "Failure.");
    }
  };

  // Export current logs to CSV
  const handleExportCSV = () => {
    try {
      const header = ["Timestamp", "User ID", "User Name", "Role", "Action Type", "Action Details"];
      const rows = filteredLogs.map((l) => [
        l.timestamp,
        l.userId,
        l.userName,
        l.userRole,
        l.action,
        l.details.replace(/,/g, ";") // Escape CSV commas
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [header.join(","), ...rows.map(e => e.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `DBATU_SmartLibrary_AuditLogs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast("success", "Audit CSV download initialized.");
    } catch {
      triggerToast("error", "Unable to construct file stream.");
    }
  };

  // Log calculation properties
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.userId.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase());
    
    const matchesAction = logActionFilter === 'All' || log.action === logActionFilter;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = ['All', ...new Set(logs.map(l => l.action))];

  // System Stats Computing
  const totalBooks = books.length;
  const activeIssues = issues.filter(i => i.status === 'approved' || i.status === 'renewal_pending').length;
  const pendingApprovals = issues.filter(i => i.status === 'pending').length;
  const renewalsCount = issues.filter(i => i.status === 'renewal_pending').length;
  const totalFinesTally = issues.reduce((sum, item) => sum + (item.status === 'approved' ? item.fine : 0), 0);
  const overdueCount = issues.filter(i => {
    return i.status === 'approved' && i.dueDate && new Date("2026-06-02T07:13:59Z") > new Date(i.dueDate);
  }).length;

  return (
    <div id={id || "admin-dashboard-root"} className="space-y-8 pb-12">
      {/* Toast Warning */}
      {notification && (
        <div id="admin-toast-wrapper" className="fixed bottom-6 right-6 z-55 max-w-sm">
          <div className={`p-4 rounded-xl shadow-lg border text-sm flex items-start gap-2.5 ${
            notification.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-850 dark:text-emerald-300' 
              : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900/60 text-red-850 dark:text-red-300'
          }`}>
            {notification.type === 'success' ? <Check className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Admin header */}
      <div id="admin-control-header" className="relative p-6 bg-slate-900 text-white rounded-lg border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-700 rounded text-white shadow-xs">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Librarian Control Center</h1>
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
              <span>Active Registrar: <strong className="text-white">{user.name}</strong> • Dr. Babasaheb Ambedkar Technological University (Lonere)</span>
              {dbStatus && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold font-sans uppercase tracking-wide gap-1 shadow-3xs ${
                  dbStatus.connected 
                    ? "bg-emerald-950/40 text-emerald-400 border border-emerald-550/20" 
                    : "bg-amber-955/40 text-amber-500 border border-amber-550/20"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dbStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-500"}`} />
                  {dbStatus.provider}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          id="admin-factory-reset-trigger-header"
          onClick={triggerFactoryReset}
          className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          Factory Reset DB
        </button>
      </div>

      {/* Numerical Bento-Grid Stats Row */}
      <div id="telemetry-stats-row" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Book Materials", val: totalBooks, icon: Library, style: "text-blue-700" },
          { label: "Pending Sign-offs", val: pendingApprovals, icon: UserCheck, style: "text-amber-600" },
          { label: "Active Loans", val: activeIssues, icon: BookOpen, style: "text-emerald-700" },
          { label: "Overdue Items", val: overdueCount, icon: AlertTriangle, style: "text-rose-600" },
          { label: "Outstanding Fines", val: `₹${totalFinesTally}.00`, icon: Landmark, style: "text-indigo-700" },
        ].map((stat, sIdx) => {
          const Icon = stat.icon;
          return (
            <div key={sIdx} className="bg-white dark:bg-slate-900 p-4 rounded border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
              <div className={`p-2 bg-slate-100 dark:bg-slate-950/40 rounded ${stat.style}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">{stat.label}</span>
                <strong className="text-base font-bold text-slate-900 dark:text-white font-mono">{stat.val}</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs navigation */}
      <div id="admin-main-tabs" className="flex flex-wrap gap-2 border-b border-slate-250 dark:border-slate-800 pb-3">
        {[
          { tabId: 'requests', label: 'Circulation Queue', icon: UserCheck, badge: pendingApprovals + renewalsCount },
          { tabId: 'student-approvals', label: 'Student Signups', icon: GraduationCap, badge: pendingStudents.length },
          { tabId: 'inventory', label: 'Core Inventory Manager', icon: Library },
          { tabId: 'audit-logs', label: 'Interactive Activity Logs', icon: Activity },
          { tabId: 'feedback', label: 'Evaluation Reviews', icon: FileText },
          { tabId: 'system', label: 'DB & System Status', icon: Database },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tabId;
          return (
            <button
              id={`admin-nav-${item.tabId}`}
              key={item.tabId}
              onClick={() => setActiveTab(item.tabId as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer hover:shadow-sm ${
                isActive 
                  ? "bg-slate-800 text-white shadow-md dark:bg-blue-600 border border-slate-705"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 bg-rose-600 text-white font-bold font-mono text-[9px] rounded-full animate-bounce shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* PANELS SPACE */}
      <div id="admin-panels">
        {/* TAB: STUDENT SIGNUP APPROVALS */}
        {activeTab === 'student-approvals' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Pending Student Portal Signups</h2>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-sans">
                Approve or reject newly registered student accounts requesting access to DBATU Central portal.
              </p>
            </div>

            {pendingStudents.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl">
                <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-2 dark:text-slate-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">All Clear! No pending signups</h3>
                <p className="text-xs text-slate-550 mt-1 dark:text-slate-400">There are no outstanding student accounts awaiting administrative clearance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-800 shadow-3xs flex flex-col justify-between space-y-4 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-md transition-all duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg font-sans text-xs">
                        <span className="text-blue-700 dark:text-blue-300 font-bold">Roll ID: {student.rollNumber}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Branch: {student.branch}</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-850 dark:text-white">{student.name}</h4>
                        <p className="text-xs text-slate-500 font-mono mt-1 dark:text-slate-400">{student.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleRejectStudent(student.id)}
                        disabled={actioning === student.id}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/35 text-rose-600 dark:text-rose-450 font-bold uppercase tracking-wider text-[10px] rounded-lg border border-transparent transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject Account
                      </button>
                      <button
                        onClick={() => handleApproveStudent(student.id)}
                        disabled={actioning === student.id}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve Student
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: CIRCULATION REQUESTS QUEUE */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Active Student Circulation Queue</h2>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                Review pending book issues, renewals requests, or check out returned textbooks.
              </p>
            </div>

            {issues.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-150 rounded-2xl">
                <UserCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-900 dark:text-white">Queue completely silent</h3>
                <p className="text-xs text-slate-500 mt-1">No active, pending, or historical checkout requests registered.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {issues.map((issue) => {
                  const isPending = issue.status === 'pending';
                  const isRenewalPending = issue.status === 'renewal_pending';
                  const isApproved = issue.status === 'approved';

                  return (
                    <div
                      id={`admin-issue-queue-card-${issue.id}`}
                      key={issue.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-800 shadow-3xs flex flex-col justify-between space-y-4 hover:border-slate-450 dark:hover:border-slate-705 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.025]"
                    >
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/45 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 font-sans text-xs">
                          <span className="text-slate-500 font-medium">Issue Reference: #{issue.id}</span>
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-bold uppercase rounded-lg text-[10px] tracking-wide">
                            {issue.status}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                            {issue.bookTitle}
                          </h3>
                          <p className="text-xs text-slate-650 dark:text-slate-400 mt-1">
                            Applied by: <strong className="text-slate-900 dark:text-white">{issue.studentName}</strong> (ID: {issue.studentRoll || issue.studentId})
                          </p>
                        </div>

                        <div className="text-xs space-y-1.5 font-sans bg-slate-50/50 dark:bg-slate-955/10 p-3 rounded-xl border border-slate-100/60 dark:border-slate-850/40">
                          <div className="flex justify-between text-slate-700 dark:text-slate-300">
                            <span className="text-slate-450 dark:text-slate-500 font-medium font-sans">Requested On:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{issue.requestDate}</span>
                          </div>
                          {issue.dueDate && (
                            <div className="flex justify-between text-slate-700 dark:text-slate-300">
                              <span className="text-slate-450 dark:text-slate-500 font-medium font-sans">Return Due Date:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{issue.dueDate}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center border-t border-slate-150 dark:border-slate-800 pt-1.5 mt-1.5 leading-relaxed font-sans font-semibold text-slate-700 dark:text-slate-350">
                            <span className="text-slate-500 font-bold font-sans">Overdue Fees:</span>
                            <span className={issue.fine > 0 ? "text-rose-500 font-black" : "text-emerald-600 dark:text-emerald-450"}>₹{issue.fine}.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                        {isPending && (
                          <>
                            <button
                              id={`admin-issue-reject-btn-${issue.id}`}
                              disabled={actioning === issue.id}
                              onClick={() => handleRejectCheckout(issue.id)}
                              className="flex-1 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 dark:text-slate-300 hover:text-rose-650 cursor-pointer text-xs font-bold border border-slate-205 dark:border-slate-800 rounded-xl hover:border-rose-150 transition-all font-sans hover:scale-[1.02] active:scale-[0.98]"
                            >
                              Deny Request
                            </button>
                            <button
                              id={`admin-issue-approve-btn-${issue.id}`}
                              disabled={actioning === issue.id}
                              onClick={() => handleApproveCheckout(issue.id)}
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer text-xs font-bold border-none rounded-xl flex items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Approve Checkout
                            </button>
                          </>
                        )}

                        {isRenewalPending && (
                          <button
                            id={`admin-approve-renewal-btn-${issue.id}`}
                            disabled={actioning === issue.id}
                            onClick={() => handleApproveRenewal(issue.id)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer text-xs font-bold border-none rounded-xl flex items-center justify-center gap-1 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve Renewal (+7 Days)
                          </button>
                        )}

                        {isApproved && (
                          <button
                            id={`admin-return-settle-btn-${issue.id}`}
                            disabled={actioning === issue.id}
                            onClick={() => handleRegisterReturn(issue.id)}
                            className="w-full py-2 bg-slate-900 border border-slate-850 hover:bg-emerald-600 dark:border-slate-800 dark:hover:bg-emerald-650 text-white cursor-pointer text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                          >
                            <Library className="h-4 w-4 shrink-0" />
                            Register Return
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

        {/* TAB 2: INVENTORY MANAGER */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-150 dark:border-slate-850 pb-4 gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-905 dark:text-white">Central Book Storage Catalog</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inject new textbook reserves, adjust total shelf allocations, or delete obsolete material.
                </p>
              </div>

              <button
                id="open-new-book-modal"
                onClick={() => { resetBookForm(); setShowBookModal(true); }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md border-none transition-all"
              >
                <PlusCircle className="h-4.5 w-4.5 text-white" />
                Index New Book Entry
              </button>
            </div>

            {/* In-view modal overlay */}
            {showBookModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-50 dark:bg-slate-950/65 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-6"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase font-sans">
                  {editingBookId ? "Adjust Catalog Record" : "File Central Inventory Entry form"}
                </h3>

                <form onSubmit={handleSaveBook} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Book Title Name</label>
                    <input
                      id="form-book-title"
                      type="text"
                      required
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      placeholder="e.g. Introduction to Algorithms"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Author String / Creators</label>
                    <input
                      id="form-book-author"
                      type="text"
                      required
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      placeholder="Thomas H. Cormen"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">ISBN Number ID</label>
                    <input
                      id="form-book-isbn"
                      type="text"
                      required
                      value={bookIsbn}
                      onChange={(e) => setBookIsbn(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-905 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      placeholder="978-0262033848"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Division Department</label>
                    <select
                      id="form-book-dept"
                      value={bookDept}
                      onChange={(e) => setBookDept(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Subject domain / Topic Category</label>
                    <input
                      id="form-book-category"
                      type="text"
                      required
                      value={bookCategory}
                      onChange={(e) => setBookCategory(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      placeholder="Algorithms"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Shelf / Classroom location rack</label>
                    <input
                      id="form-book-location"
                      type="text"
                      value={bookLocation}
                      onChange={(e) => setBookLocation(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      placeholder="Rack A-3, Central Library"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Textbook Syllabus Abstract / Summary</label>
                    <textarea
                      id="form-book-desc"
                      rows={2}
                      value={bookDesc}
                      onChange={(e) => setBookDesc(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-sans"
                      placeholder="A short syllabus indexing notes."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">Physical Copies Indexed (Volume)</label>
                    <input
                      id="form-book-total-copies"
                      type="number"
                      min={1}
                      value={bookTotalCols}
                      onChange={(e) => setBookTotalCols(Number(e.target.value))}
                      className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-3 pt-3">
                    <button
                      id="form-book-cancel"
                      type="button"
                      onClick={() => { setShowBookModal(false); resetBookForm(); }}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-805 text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold cursor-pointer bg-transparent"
                    >
                      Bypass Form
                    </button>
                    <button
                      id="form-book-save"
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold cursor-pointer transition-all border-none"
                    >
                      Commit Book to Inventory
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* List Table of Books */}
            <div className="bg-white dark:bg-slate-905 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-3xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans leading-relaxed border-collapse border-spacing-0">
                  <thead className="bg-slate-50 dark:bg-slate-950/45 text-slate-500 border-b border-slate-150 dark:border-slate-800 font-mono tracking-wider uppercase text-[10px]">
                    <tr>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-350">Indexed Textbook</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-350">Academic Division</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-350">ISBN Code</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-350">Central Storage Room Shelf</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-350">Stock Volume</th>
                      <th className="p-4 font-bold text-slate-705 dark:text-slate-355 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                    {books.map((book) => (
                      <tr id={`admin-book-row-${book.id}`} key={book.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all font-sans">
                        <td className="p-4">
                          <strong className="text-slate-900 dark:text-white block font-extrabold">{book.title}</strong>
                          <span className="text-[11px] text-slate-450 mt-0.5 block">{book.author}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-lg text-[10px] font-bold tracking-wide uppercase font-sans">
                            {book.department}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-655 dark:text-slate-350">{book.isbn}</td>
                        <td className="p-4 font-mono text-slate-655 dark:text-slate-350">{book.location}</td>
                        <td className="p-4 font-bold font-mono">
                          <span className={book.availableCopies === 0 ? "text-rose-500 font-black" : "text-emerald-550 dark:text-emerald-450"}>
                            {book.availableCopies}
                          </span> / {book.totalCopies} Left
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              id={`admin-edit-action-${book.id}`}
                              onClick={() => startEditBook(book)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-455 hover:text-blue-650 rounded-lg cursor-pointer transition-all bg-transparent border-none"
                              title="Modify Inventory Details"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              id={`admin-delete-action-${book.id}`}
                              onClick={() => handleDeleteBook(book.id)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-455 hover:text-rose-650 rounded-lg cursor-pointer transition-all bg-transparent border-none"
                              title="Archive Textbook"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT EVENT LOGS */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-150 dark:border-slate-850 pb-4 gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-905 dark:text-white">IEEE Administrative Audit Event Logs</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fully operational, un-simulated transaction log listing operations indexed across DBATU.
                </p>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  id="logs-export-csv-trigger"
                  onClick={handleExportCSV}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-3xs"
                >
                  <Download className="h-4 w-4" />
                  Export Sheet (CSV)
                </button>
              </div>
            </div>

            {/* Logs controller filter system */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 dark:bg-slate-950/45 p-4 rounded-xl border border-slate-150 dark:border-slate-800">
              <div className="relative w-full md:flex-1 shadow-3xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Sliders className="h-4 w-4" />
                </span>
                <input
                  id="logs-search-field"
                  type="text"
                  placeholder="Filter logs by Roll Name, description, action verb ID..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">Action Category:</span>
                <select
                  id="logs-action-filter-select"
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="block w-full md:w-44 px-3 py-2 border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                >
                  {uniqueActions.map(act => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table layout logs rendering */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-3xs">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs font-sans leading-relaxed border-collapse border-spacing-0">
                  <thead className="bg-slate-50 dark:bg-slate-950/45 text-slate-500 border-b border-slate-150 dark:border-slate-800 font-mono tracking-wider uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-350">Calendar Timestamp</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-350">Colleague ID</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-350">Operator Name</th>
                      <th className="p-3 font-bold text-slate-700 dark:text-slate-350">Operation Type</th>
                      <th className="p-4 font-bold text-slate-700 dark:text-slate-350">Operational Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-mono text-[11px]">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-450 dark:text-slate-500">
                          Search filter mapped zero activities logs.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const isAdminLog = log.userRole === 'admin';
                        return (
                          <tr id={`audit-log-row-${log.id}`} key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all font-mono">
                            <td className="p-3 text-slate-450 dark:text-slate-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString()} • {new Date(log.timestamp).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{log.userId}</td>
                            <td className="p-3 font-sans font-semibold">
                              <span className={isAdminLog ? "text-indigo-650 dark:text-indigo-400" : "text-slate-800 dark:text-slate-300"}>
                                {log.userName}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                log.action.startsWith('auth') 
                                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700' 
                                  : log.action.includes('error') || log.action.includes('delete')
                                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4 font-sans text-xs text-slate-655 dark:text-slate-350">{log.details}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CAMPUS FEEDBACK EVALUATIONS */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Student Evaluation Feedback Forms</h2>
              <p className="text-xs text-slate-550 dark:text-slate-400">
                Observe individual ratings and comments filed by student profiles to modify university tech solutions.
              </p>
            </div>

            {feedbacks.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-905 border border-slate-150 rounded-2xl">
                <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-900 dark:text-white">No submissions</h3>
                <p className="text-xs text-slate-500 mt-1">Review ledger empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedbacks.map((f) => (
                  <div
                    id={`feedback-card-detail-${f.id}`}
                    key={f.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-805 shadow-3xs flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-955/35 text-blue-755 dark:text-blue-350 rounded-md font-bold uppercase text-[10px]">
                          Category: {f.category}
                        </span>
                        <span className="text-slate-450 font-mono whitespace-nowrap">
                          {new Date(f.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-1 py-1">
                        {[1, 2, 3, 4, 5].map((sVal) => (
                          <Star key={sVal} className={`h-4.5 w-4.5 ${
                            sVal <= f.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-205 dark:text-slate-700'
                          }`} />
                        ))}
                      </div>

                      <p className="text-xs font-medium text-slate-700 dark:text-slate-350 italic font-sans pl-2 border-l-2 border-indigo-400">
                        "{f.comment}"
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-850 text-xs flex justify-between items-center text-slate-500">
                      <span>Submitted Studnet: <strong className="text-slate-700 dark:text-slate-300">{f.studentName}</strong></span>
                      <span className="font-mono text-[10px] uppercase">ID: #{f.studentId}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DATABASE & SYSTEM STATUS */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Central Network & Database Settings</h2>
              <p className="text-xs text-slate-550 dark:text-slate-400">
                Audit live MongoDB cluster handshake protocols, database counts, and configure localized synchronization fallbacks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Grid: Connection status */}
              <div className="lg:col-span-2 space-y-6 font-sans">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${dbStatus?.connected ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-500'}`}>
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Database Provider</h3>
                        <p className="text-xs text-slate-500">Currently hosting system operational matrices</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto ${
                      dbStatus?.connected 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-500'
                    }`}>
                      {dbStatus?.connected ? "ONLINE (Atlas MongoDB)" : "FALLBACK ACTIVE (Local JSON)"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Current Datastore engine</span>
                      <strong className="text-xs text-slate-800 dark:text-slate-200">{dbStatus?.provider || "High Performance JSON Engine"}</strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Connection string mask</span>
                      <strong className="text-xs text-slate-800 dark:text-slate-200 font-mono tracking-tight">{dbStatus?.connectionString || "None"}</strong>
                    </div>
                  </div>

                  {dbStatus?.lastError && (
                    <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 space-y-2">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider font-sans">Handshake Connection Interruption</span>
                      </div>
                      <div className="font-mono text-[11px] text-red-600 dark:text-red-400/90 bg-red-950/10 dark:bg-slate-950 p-2.5 rounded border border-red-900/10 dark:border-red-955/35 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                        {dbStatus.lastError}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Deploy datasets on cluster manually</span>
                      <p className="text-slate-500 leading-snug">Writes all structural librarian logs, book catalogs, and approved student metrics directly into your cloud Mongo instance.</p>
                    </div>
                    <button
                      type="button"
                      disabled={syncingMongo}
                      onClick={handleSyncMongoDB}
                      className={`px-4 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 font-sans shrink-0 ${syncingMongo ? 'animate-pulse' : ''}`}
                    >
                      {syncingMongo ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Streaming to Atlas...</span>
                        </>
                      ) : (
                        <>
                          <Database className="h-3.5 w-3.5" />
                          <span>Store &amp; Sync to MongoDB</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* DBATU Troubleshooting Wizard */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                    <Settings className="h-4.5 w-4.5" />
                    <span>Database Connection Configuration Diagnostic Guide</span>
                  </div>
                  
                  <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p>
                      Dr. Babasaheb Ambedkar Technological University (Lonere) Technical Registrar automates hot-synchronization between database engines. If your Atlas DB setup shows offline fallback status, perform these corrective checks:
                    </p>
                    
                    <ul className="list-decimal list-inside space-y-2.5 pl-1.5">
                      <li>
                        <strong className="text-slate-800 dark:text-slate-200">Whitelist All Outbound Port / IPs:</strong> Since this app runs in a serverless elastic Cloud Run environment, the outbound IP address resides on Google's dynamic server pool list. You <strong>must configure 0.0.0.0/0 (allow all access)</strong> in your MongoDB Atlas cluster network access settings dashboard.
                      </li>
                      <li>
                        <strong className="text-slate-800 dark:text-slate-200">Check Authentication Credentials:</strong> Ensure your password is correct and does not contain raw special characters (like <code>@</code>, <code>:</code>, or <code>/</code>). If they are present, you must substitute them with their URL-encoded values (e.g. <code>@</code> with <code>%40</code>).
                      </li>
                      <li>
                        <strong className="text-slate-805 dark:text-slate-200">Declare proper URI:</strong> Expand your <strong>Settings / .env variables</strong> panel in this AI Studio workspace and define <code>MONGODB_URI</code> correctly with your database name (e.g., <code>mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.abcde.mongodb.net/libraryDB?retryWrites=true&amp;w=majority</code>).
                      </li>
                    </ul>
                    
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 rounded-lg text-[11px] leading-relaxed flex items-start gap-2">
                      <span className="font-bold shrink-0 text-xs">ℹ️ Note:</span>
                      Our smart local disk persistence layers will catch and sync any active changes instantly. When MongoDB connections re-awaken, the app automatically back-updates records with flawless precision.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Grid: Entity stats mapping */}
              <div className="space-y-6 font-sans">
                <div className="bg-slate-900 text-white rounded-xl p-5 space-y-4 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider font-mono">Telemetry Data Volume Ledger</span>
                  
                  <div className="space-y-3">
                    {[
                      { name: "Active Textbooks", val: dbStatus?.stats?.books ?? books.length, desc: "Catalogued in central database inventory" },
                      { name: "Sign-offs & Approvals", val: dbStatus?.stats?.users ?? (pendingStudents.length + 1), desc: "Registered student profile accounts" },
                      { name: "Issuance Records", val: dbStatus?.stats?.issues ?? issues.length, desc: "Total historical checkouts and returns" },
                      { name: "Evaluations Received", val: dbStatus?.stats?.feedbacks ?? feedbacks.length, desc: "Direct feedback reports from students" },
                      { name: "Audit Trail Size", val: dbStatus?.stats?.logs ?? logs.length, desc: "Librarian action tracking elements" },
                    ].map((row, rIdx) => (
                      <div key={rIdx} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-white block">{row.name}</span>
                          <span className="text-[10px] text-slate-400 block">{row.desc}</span>
                        </div>
                        <span className="font-mono text-xs font-bold bg-white/10 px-2.5 py-1 rounded text-white">{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
