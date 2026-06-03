import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, BookOpen, ChevronRight } from 'lucide-react';

interface LoginSplashProps {
  onComplete: () => void;
  userName?: string;
  theme?: 'light' | 'dark';
}

export function LoginSplash({ onComplete, userName, theme = 'dark' }: LoginSplashProps) {
  const [step, setStep] = useState<'initial' | 'transitioning' | 'tagline' | 'done'>('initial');

  useEffect(() => {
    // Step 1: Show D-Lib (0 to 1.2s)
    const timer1 = setTimeout(() => {
      setStep('transitioning');
    }, 1300);

    // Step 2: Show DBATU-LIBRARY (1.2s to 2.4s)
    const timer2 = setTimeout(() => {
      setStep('tagline');
    }, 2500);

    // Step 3: Complete animation (3.8s)
    const timer3 = setTimeout(() => {
      setStep('done');
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  // Letters of DBATU-LIBRARY for individual stagger animation
  const libraryText = "DBATU-LIBRARY";
  const taglineText = "find the right book everytime";

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'} overflow-hidden select-none transition-colors duration-350`}>
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Dynamic moving emerald orbs */}
        <motion.div 
          animate={{
            scale: [1, 1.2, 0.9, 1],
            x: [0, 50, -30, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute -top-12 -left-12 w-96 h-96 rounded-full ${theme === 'light' ? 'bg-emerald-450/[0.04]' : 'bg-emerald-500/10'} blur-3xl`}
        />
        <motion.div 
          animate={{
            scale: [1, 0.8, 1.1, 1],
            x: [0, -60, 40, 0],
            y: [0, 50, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute -bottom-12 -right-12 w-96 h-96 rounded-full ${theme === 'light' ? 'bg-emerald-600/[0.03]' : 'bg-emerald-600/10'} blur-3xl`}
        />
        
        {/* Center glowing source */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
          <div className={`w-[400px] h-[400px] rounded-full ${theme === 'light' ? 'bg-emerald-500/[0.02]' : 'bg-emerald-500/[0.04]'} blur-2xl`} />
        </div>

        {/* Diagonal Tech-Grid Background */}
        <div className={`absolute inset-0 ${theme === 'light' ? 'bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] opacity-25' : 'bg-[linear-gradient(to_right,#022c22_1px,transparent_1px),linear-gradient(to_bottom,#022c22_1px,transparent_1px)] opacity-30'} bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]`} />
      </div>

      {/* Main Container */}
      <div className="relative px-6 max-w-2xl text-center flex flex-col items-center justify-center min-h-[300px]">
        {/* Welcoming Sub-Header */}
        {userName && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 ${theme === 'light' ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} border rounded-full text-xs font-mono font-bold tracking-wider`}>
              <Sparkles className="h-3 w-3 animate-spin text-emerald-500" />
              AUTHENTICATION VERIFIED · SECURE ACCESS
            </span>
          </motion.div>
        )}

        {/* Animated Brand Core Text Assembly */}
        <div className="relative flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 'initial' ? (
              /* Phase 1: Show Large "D-Lib" with Glowing Base */
              <motion.div
                key="dlib"
                initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.15, filter: 'blur(8px)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center gap-1"
              >
                {/* Book logo icon inside "D-Lib" during entrance */}
                <motion.div
                  initial={{ rotate: -15, scale: 0.7 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                  className={`p-3 ${theme === 'light' ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'} border rounded-2xl mr-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]`}
                >
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10" />
                </motion.div>
                
                <h1 className={`text-4xl sm:text-5xl font-black tracking-tighter ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  D-<span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.35)]">Lib</span>
                </h1>
              </motion.div>
            ) : (
              /* Phase 2: Show "DBATU-LIBRARY" with Staggered Characters & Slit Scan Glare Effects */
              <motion.div
                key="dbatu-library"
                className="flex flex-col items-center gap-1"
              >
                <div className="flex flex-wrap justify-center items-center gap-x-1 sm:gap-x-2 font-black tracking-tight select-none">
                  {libraryText.split("").map((char, index) => {
                    const isSeparator = char === '-';
                    return (
                      <motion.span
                        key={index}
                        initial={{ 
                          opacity: 0, 
                          y: 35, 
                          scale: 0.5,
                          filter: 'blur(4px)'
                        }}
                        animate={{ 
                          opacity: 1, 
                          y: 0, 
                          scale: 1,
                          filter: 'blur(0px)'
                        }}
                        transition={{
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 120,
                          damping: 12
                        }}
                        className={`text-2xl sm:text-4xl md:text-5xl ${
                          isSeparator 
                            ? 'text-emerald-500/50' 
                            : (theme === 'light' ? 'text-slate-800' : 'text-white')
                        }`}
                      >
                        {char}
                      </motion.span>
                    );
                  })}
                </div>

                {/* Ambient Sweep Lens Flare across DBATU-LIBRARY */}
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: '200%' }}
                  transition={{ duration: 1.8, delay: 0.8, ease: "easeInOut" }}
                  className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent skew-x-12 pointer-events-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Tagline reveal from the bottom */}
          <div className="h-10 mt-6 overflow-hidden flex items-center justify-center">
            {(step === 'tagline' || step === 'done') && (
              <div className="flex justify-center items-center gap-x-1 sm:gap-x-1.5 font-sans">
                {taglineText.split(" ").map((word, wIdx) => (
                  <motion.span
                    key={wIdx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.5 + wIdx * 0.1,
                      duration: 0.5,
                      ease: "easeOut"
                    }}
                    className={`text-xs sm:text-sm md:text-base font-medium uppercase font-mono ${
                      word === 'right' || word === 'everytime' 
                        ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400 font-extrabold drop-shadow-[0_0_10px_rgba(16,185,129,0.35)]') 
                        : (theme === 'light' ? 'text-slate-505 text-slate-500' : 'text-slate-400')
                    }`}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Personalized Welcome Loading indicator */}
        <div className="mt-12 h-16 flex flex-col items-center justify-center">
          <AnimatePresence>
            {step !== 'done' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2"
              >
                <div className={`relative w-48 h-1 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'} rounded-full overflow-hidden border border-white/5`}>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "easeInOut" }}
                    className="absolute h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'} font-mono tracking-widest uppercase`}>
                    {userName ? `Preparing custom shelf recommendations for ${userName}` : 'Initializing cognitive systems'}
                  </span>
                  <motion.span
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[10px] text-emerald-500 font-bold font-mono"
                  >
                    ...
                  </motion.span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Direct Skip Button in Bottom Corner to avoid frustration on multiple entries */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1, scale: 1.05 }}
          onClick={onComplete}
          className={`absolute bottom-[-100px] flex items-center gap-1 px-4 py-2 ${theme === 'light' ? 'bg-slate-200/80 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'} border rounded-full text-[11px] font-mono font-semibold cursor-pointer transition`}
        >
          Skip Intro
          <ChevronRight className="h-3 w-3" />
        </motion.button>
      </div>
    </div>
  );
}
