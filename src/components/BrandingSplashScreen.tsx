import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Library, Sparkles } from "lucide-react";

interface BrandingSplashScreenProps {
  onComplete: () => void;
}

export default function BrandingSplashScreen({ onComplete }: BrandingSplashScreenProps) {
  const [step, setStep] = useState<"dlib" | "expand" | "tagline">("dlib");

  useEffect(() => {
    // Sequence of animations:
    // 0s to 1s: Show huge "D-Lib"
    // 1s to 2s: Expand and transition to "DBATU-LIBRARY"
    // 2s: Show Tagline
    // 3.5s: Complete splash screen and proceed to dashboard
    const t1 = setTimeout(() => {
      setStep("expand");
    }, 1200);

    const t2 = setTimeout(() => {
      setStep("tagline");
    }, 2200);

    const t3 = setTimeout(() => {
      onComplete();
    }, 3900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      id="dbatu-brand-splash"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden"
    >
      {/* Smooth Ambient Background Grids or Circles in green */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_65%)] pointer-events-none" />
      
      {/* Decorative floating micro-stars in the background */}
      <div className="absolute top-[20%] left-[10%] w-[15vw] h-[15vw] rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[10%] w-[20vw] h-[20vw] rounded-full bg-teal-500/5 blur-[90px] pointer-events-none animate-pulse" />

      <div className="flex flex-col items-center justify-center space-y-6 max-w-lg text-center px-6 relative z-10">
        
        {/* Glowing Academic Library Cap Insignia */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.1 }}
          className="h-16 w-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-[0_0_40px_rgba(16,185,129,0.4)] border border-white/20 mb-2"
        >
          <Library className="h-8 w-8 text-slate-950 shrink-0" />
        </motion.div>

        {/* Dynamic Typography Expansion Animation */}
        <div className="relative h-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {step === "dlib" && (
              <motion.h1
                key="dlib_text"
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 1.05 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 uppercase select-none"
              >
                D-Lib
              </motion.h1>
            )}

            {(step === "expand" || step === "tagline") && (
              <motion.h1
                key="dbatu_text"
                initial={{ opacity: 0, scale: 0.9, letterSpacing: "0.1em" }}
                animate={{ opacity: 1, scale: 1, letterSpacing: "0.15em" }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 uppercase select-none font-sans"
              >
                DBATU-LIBRARY
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Underline decorative bar */}
        <div className="w-24 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent relative overflow-hidden rounded-full">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white to-transparent"
          />
        </div>

        {/* Dynamic Tagline Animation */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence>
            {step === "tagline" && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-xs sm:text-sm text-emerald-350 dark:text-emerald-400 font-medium tracking-wide flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                Find the right book everytime
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic loading micro progress line */}
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden mt-6">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3.5, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
          />
        </div>
      </div>
    </div>
  );
}
