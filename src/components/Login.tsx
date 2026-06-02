import React, { useState } from "react";
import { motion } from "motion/react";
import { School, ShieldCheck, Lock, User, KeyRound, AlertCircle, ArrowRight, Mail, GraduationCap } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  id?: string;
}

export default function Login({ onLoginSuccess, id }: LoginProps) {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Student Sign-Up Form States
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpRollNumber, setSignUpRollNumber] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpBranch, setSignUpBranch] = useState("Computer Engineering");

  // 2FA Stage States
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    if (!signUpRollNumber.trim() || !signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim() || !signUpBranch) {
      setError("Please fill in all student registration details.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNumber: signUpRollNumber.trim(),
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          password: signUpPassword,
          branch: signUpBranch
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed registration during submission.");
      }

      setSuccessMsg(data.message || "Sign-up application received! Awaiting admin approval.");
      setSignUpName("");
      setSignUpEmail("");
      setSignUpRollNumber("");
      setSignUpPassword("");
      setTimeout(() => {
        setIsSignUp(false);
        setSuccessMsg("");
      }, 4000);

    } catch (err: any) {
      setError(err.message || "An error occurred during student sign-up registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    // Clean placeholder defaults values for ease of hackathon evaluations
    const defaultRoll = rollNumber.trim() || (role === 'student' ? 'DBATU1001' : 'DBATUADMIN');
    const defaultPass = password || (role === 'student' ? 'password123' : 'adminpassword');

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: defaultRoll, password: defaultPass })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Clear your parameters.");
      }

      if (data.step === "verification_required") {
        setShow2FA(true);
        setSimulatedOtp(data.simulatedOtp);
        setRollNumber(data.rollNumber);
      }
    } catch (err: any) {
      setError(err.message || "Unable to reach server core.");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber, otp: otpCode.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Security token invalid.");
      }

      setSuccessMsg("Two-Step registration cleared! Booting DBATU Workspace...");
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "OTP check failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (selectedRole: 'student' | 'admin') => {
    setRole(selectedRole);
    if (selectedRole === 'student') {
      setRollNumber('DBATU1001');
      setPassword('password123');
    } else {
      setRollNumber('DBATUADMIN');
      setPassword('adminpassword');
    }
  };

  return (
    <div
      id={id || "login-portal-wrapper"}
      className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm"
      >
        {/* DBATU Academic Header */}
        <div id="login-header-section" className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-700 dark:bg-blue-650 rounded flex items-center justify-center text-white shadow-sm">
            <School className="h-6 w-6" />
          </div>
          <h2 id="portal-title" className="mt-4 text-2xl font-bold tracking-tight text-slate-850 dark:text-white font-sans">
            DBATU Portal
          </h2>
          <p id="portal-subtitle" className="mt-1 text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Smart Library &amp; Academic Roadmap
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-emerald-650 dark:text-emerald-400 text-sm flex items-start gap-2.5"
          >
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {!show2FA ? (
          <div className="space-y-4">
            {/* Role Select Tabs */}
            <div id="role-select-tabs" className="flex bg-slate-150 dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700">
              <button
                id="role-box-student"
                type="button"
                onClick={() => { setRole('student'); setRollNumber(''); setPassword(''); setIsSignUp(false); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'student'
                    ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Student Portal
              </button>
              <button
                id="role-box-librarian"
                type="button"
                onClick={() => { setRole('admin'); setRollNumber(''); setPassword(''); setIsSignUp(false); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === 'admin'
                    ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Librarian Access
              </button>
            </div>

            {isSignUp && role === 'student' ? (
              /* Student Sign Up/Registration Form */
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div className="text-center py-1">
                  <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider font-sans">Student Registration</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Fields are checked by Dr. S. R. Mahajan</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative rounded shadow-3xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="signup-name-input"
                      type="text"
                      required
                      placeholder="e.g. Omkar Suryavanshi"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-700 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    University Roll Number (Roll ID)
                  </label>
                  <div className="relative rounded shadow-3xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="signup-roll-input"
                      type="text"
                      required
                      placeholder="e.g. DBATU1005"
                      value={signUpRollNumber}
                      onChange={(e) => setSignUpRollNumber(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-700 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative rounded shadow-3xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="signup-email-input"
                      type="email"
                      required
                      placeholder="e.g. omkar.s@student.dbatu.ac.in"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-700 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Engineering Branch / Department
                  </label>
                  <div className="relative rounded shadow-3xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <select
                      id="signup-branch-select"
                      value={signUpBranch}
                      onChange={(e) => setSignUpBranch(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-700 text-xs h-[36px]"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative rounded shadow-3xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="signup-password-input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-700 text-xs"
                    />
                  </div>
                </div>

                <button
                  id="signup-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 flex justify-center items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Submitting Application..." : "Request Access / Sign Up"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <div className="text-center mt-3 text-xs font-sans">
                  <span className="text-slate-500 dark:text-slate-400">Already registered? </span>
                  <button
                    id="toggle-login-mode-btn"
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); setSuccessMsg(''); }}
                    className="text-blue-605 dark:text-blue-400 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                  >
                    Login here
                  </button>
                </div>
              </form>
            ) : (
              /* Standard Login Form */
              <form onSubmit={handleInitialSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {role === 'student' ? "University Roll Number (Roll ID)" : "Librarian Employee ID"}
                  </label>
                  <div className="relative rounded shadow-3xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="login-roll-input"
                      type="text"
                      required
                      placeholder={role === 'student' ? "e.g. DBATU1001" : "e.g. DBATUADMIN"}
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Account Password
                  </label>
                  <div className="relative rounded shadow-3xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-700 focus:border-blue-700 text-xs"
                    />
                  </div>
                </div>

                <button
                  id="login-auth-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9 flex justify-center items-center gap-2 rounded bg-blue-700 hover:bg-blue-800 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? "Validating Account..." : "Login to Portal"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                {role === 'student' && (
                  <div className="text-center mt-3 text-xs font-sans">
                    <span className="text-slate-500 dark:text-slate-400 font-medium animate-fade-in">New student? </span>
                    <button
                      id="toggle-signup-mode-btn"
                      type="button"
                      onClick={() => { setIsSignUp(true); setError(''); setSuccessMsg(''); }}
                      className="text-blue-650 dark:text-blue-400 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                    >
                      Create an account
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Quick Demo Assist Links */}
            <div id="demo-quick-auth" className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2 font-mono">
                IEEE EVALUATOR DEMO CREDENTIALS
              </span>
              <div className="flex gap-2 justify-center">
                <button
                  id="demo-student-auto-fill"
                  onClick={() => fillDemoCredentials('student')}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 text-[10px] uppercase font-bold rounded tracking-wide transition-all cursor-pointer"
                >
                  Student Demo
                </button>
                <button
                  id="demo-admin-auto-fill"
                  onClick={() => fillDemoCredentials('admin')}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-350 text-[10px] uppercase font-bold rounded tracking-wide transition-all cursor-pointer"
                >
                  Librarian Demo
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Factor Authentication Stage */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Live Simulation Warning Prompt */}
            <div
              id="mfa-simulation-alert"
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded p-4 text-amber-800 dark:text-amber-400 text-xs space-y-2 shadow-xs"
            >
              <div className="flex items-center gap-1.5 font-bold font-sans uppercase tracking-wide text-[10px]">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                Security OTP Issued
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-slate-350">
                To proceed securely, accept this simulated 2-step OTP code:
              </p>
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded border border-amber-250 dark:border-amber-900 font-mono tracking-widest text-base font-extrabold text-slate-800 dark:text-amber-400">
                <span>{simulatedOtp}</span>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded">
                  Active
                </span>
              </div>
            </div>

            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 text-center">
                  6-Digit Security Token
                </label>
                <div className="relative rounded max-w-[200px] mx-auto shadow-3xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    id="mfa-otp-input"
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-center font-mono text-base tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-700"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  id="mfa-cancel-btn"
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="flex-1 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer bg-transparent"
                >
                  Back
                </button>
                <button
                  id="mfa-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-800 text-xs font-bold rounded text-white shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isLoading ? "Verifying..." : "Confirm 2FA"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
