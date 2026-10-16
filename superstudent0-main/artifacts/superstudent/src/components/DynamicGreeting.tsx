import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Trophy, Award, Flame } from "lucide-react";
import { Account, LangKey } from "../types";
import { COLORS, GRAD_GOLD, T } from "../constants";

interface DynamicGreetingProps {
  user: Account | null;
  lang: LangKey;
  isRTL: boolean;
  onOpenAi?: () => void;
  onOpenArchive?: () => void;
}

export function DynamicGreeting({
  user,
  lang,
  isRTL,
  onOpenAi,
  onOpenArchive,
}: DynamicGreetingProps) {
  const t = T[lang];
  const studentName = user?.displayName || user?.username || (lang === "ar" ? "يا بطل" : "Futur Lauréat");

  function triggerConfetti() {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#6366F1", "#EC4899", "#FBBF24", "#10B981", "#3B82F6"],
      });
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        triggerConfetti();
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [user?.username]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5 mb-5 bac-card-shadow bac-in"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(236,72,153,0.14) 50%, rgba(251,191,36,0.18))",
        border: "1px solid rgba(255,255,255,0.16)",
      }}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-28 h-28 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 shadow-sm" style={{ background: "rgba(251,191,36,0.18)", color: COLORS.gold, border: "1px solid rgba(251,191,36,0.3)" }}>
          <Trophy size={13} className="text-amber-400" />
          <span>SuperStudent 2027 🇹🇳</span>
          <Sparkles size={13} className="text-amber-400" />
        </div>

        <h1
          onClick={triggerConfetti}
          className="text-2xl sm:text-3xl font-extrabold cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
          style={{ color: "#FFF", letterSpacing: isRTL ? 0 : "-0.02em" }}
          title={lang === "ar" ? "اضغط هنا للاحتفال!" : "Cliquez pour célébrer !"}
        >
          <span style={{ color: "#FDE047" }}>إن شاء الله </span>
          <span className="bac-grad-text font-black">ADMIS </span>
          <span style={{ color: "#FFF" }}>{studentName}</span>
        </h1>

        <p className="text-xs sm:text-sm mt-1.5 max-w-md leading-relaxed" style={{ color: COLORS.textSoft }}>
          {lang === "ar"
            ? "المنهاج التونسي الرسمي • 17 سنة امتحانات وإصلاح • المساعد الذكي خطوة بخطوة"
            : lang === "fr"
            ? "Programme officiel tunisien • 17 ans d'épreuves corrigées • Tuteur IA pas à pas"
            : "Official Tunisian Curriculum • 17-Year Solved Exams Archive • Step-by-Step AI Tutor"}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {onOpenAi && (
            <button
              onClick={onOpenAi}
              className="bac-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              <Sparkles size={14} />
              {lang === "ar" ? "اسأل المساعد الذكي" : "Consulter l'IA"}
            </button>
          )}
          {onOpenArchive && (
            <button
              onClick={onOpenArchive}
              className="bac-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)", color: COLORS.text, border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <Award size={14} className="text-amber-400" />
              {lang === "ar" ? "أرشيف الباكالوريا 17 سنة" : "Archives Bac 17 ans"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
