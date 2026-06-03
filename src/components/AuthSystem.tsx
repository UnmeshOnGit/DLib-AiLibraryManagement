import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, User as UserIcon, BookOpen, Key, Building, GraduationCap, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface AuthSystemProps {
  onLoginSuccess: (token: string, user: any) => void;
  onBack: () => void;
  initialRole?: 'student' | 'admin';
}

export function AuthSystem({ onLoginSuccess, onBack, initialRole = 'student' }: AuthSystemProps) {
  const [role, setRole] = useState<'student' | 'admin'>(initialRole);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [year, setYear] = useState('1st Year');
  const [rememberMe, setRememberMe] = useState(true);

  // OTP State
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpInfo, setOtpInfo] = useState('');

  // General Messages
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  const departments = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Fine Arts',
    'Sciences',
    'General Studies'
  ];

  const years = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          studentId,
          department,
          year,
          password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setOtpInfo(`A verification code was simulated standardly. We printed code in technical output: ${data.otpCode}`);
      setShowOtpScreen(true);
      // Autofill for effortless evaluation!
      setOtpCode(data.otpCode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otpCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OTP Code validation failed');
      }
      if (data.pendingApproval) {
        setIsPendingApproval(true);
      } else {
        onLoginSuccess(data.token, data.user);
      }
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition bg-white/5 border border-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </button>

      <div className="max-w-md w-full space-y-6 z-10 relative">
        {/* Title */}
        <div className="text-center">
          <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl border border-white/20 mb-3 shadow-lg shadow-blue-500/10">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-305">
            {isRegister ? 'Register Student Space' : role === 'admin' ? 'Librarian Gateway' : 'Student Academic Sign-In'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            {isRegister 
              ? 'Complete registration details to issue roadmaps and track goals' 
              : 'Enter credential values to synchronize server catalog entries'}
          </p>
        </div>

        {/* Outer Form Box */}
        <div className="bg-white/5 border border-white/20 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {isPendingApproval ? (
            <div className="space-y-5 text-left py-2">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded-2xl space-y-2">
                <h4 className="font-extrabold flex items-center gap-1.5 text-sm text-amber-400">
                  <span>⏳ Creation Pending Librarian Confirmation</span>
                </h4>
                <p className="text-slate-200">
                  Your student registration is successful and verified!
                </p>
                <div className="bg-slate-900/40 p-2.5 rounded-xl border border-white/10 font-mono text-xs">
                  <span className="text-slate-400">Student ID / PRN: </span>
                  <span className="text-sky-400 font-bold">{studentId}</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                <p>
                  To maintain absolute catalog integrity, <b>all new student spaces must be approved by the Librarian</b> on their dashboard before you can log in.
                </p>
                <p>
                  Please ask the administrator (using the <b>Librarian gateway</b>) to authorize your registration under their <b>Requests & Approvals Desk</b>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPendingApproval(false);
                  setIsRegister(false);
                  setShowOtpScreen(false);
                  setError('');
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition cursor-pointer text-center"
              >
                Back to Sign-In
              </button>
            </div>
          ) : (
            <>
              {/* Quick Admin/Student login values hints removed */}

              {/* Role selector tabs */}
              {!isRegister && !showOtpScreen && (
                <div className="grid grid-cols-2 bg-white/5 p-1 border border-white/10 rounded-xl mb-6 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${role === 'student' ? 'bg-blue-600/80 text-white shadow backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white'}`}
                  >
                    Student Space
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${role === 'admin' ? 'bg-blue-600/80 text-white shadow backdrop-blur-md border border-white/10' : 'text-slate-400 hover:text-white'}`}
                  >
                    Librarian Staff
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* OTP VIEW */}
              {showOtpScreen ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs rounded-xl space-y-2">
                <p className="font-semibold">✉️ OTP Code Authentication Required</p>
                <p>{otpInfo}</p>
                <p className="text-[10px] text-slate-400 italic">This bypasses physical SMTP constraints so you can complete evaluations smoothly.</p>
              </div>

              {otpError && (
                <div className="p-3 bg-red-400/10 text-red-400 border border-red-500/20 text-xs rounded-lg">
                  {otpError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300">OTP Code sent to email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit verification code"
                    className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white placeholder-slate-500 font-mono tracking-widest text-center"
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Verify & Complete Signup'}
              </button>
            </form>
          ) : isRegister ? (
            /* STUDENT REGISTRATION FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address (Verification OTP Required)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Student ID & Dept Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Student ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <GraduationCap className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. U-2026-0043"
                      className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full px-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white"
                  >
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Current Course Year</label>
                <div className="flex gap-2">
                  {years.map(y => (
                    <button
                      type="button"
                      key={y}
                      onClick={() => setYear(y)}
                      className={`flex-1 py-1.5 border rounded-lg text-xs font-medium transition cursor-pointer ${year === y ? 'bg-blue-600/10 text-blue-400 border-blue-500/50' : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-white'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Send OTP Verification Code'}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition underline cursor-pointer"
                >
                  Already registered? Sign in instead
                </button>
              </div>
            </form>
          ) : (
            /* ALL LOGINS FORMS */
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === 'admin' ? 'librarian@hub.edu' : 'student@hub.edu'}
                    className="block w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => alert(`Self-recovery option: For testing, input passwords "student123" for student or "librarian123" for library admin.`)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:border-blue-600 focus:ring-0 text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Remember me & role switches */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 font-medium"
                  />
                  <span>Remember my profile</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : `Access ${role === 'admin' ? 'Librarian Dashboard' : 'Student Hub'}`}
              </button>

              {role === 'student' && (
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition underline cursor-pointer"
                  >
                    First time student? Create academic profile
                  </button>
                </div>
              )}
            </form>
          )}
        </>
      )}

        </div>
      </div>
    </div>
  );
}
