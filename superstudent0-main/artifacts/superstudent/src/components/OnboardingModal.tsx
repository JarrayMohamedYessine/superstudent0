import React, { useState } from "react";
import { Sparkles, GraduationCap, Compass, ArrowRight, ArrowLeft, Check, Eye } from "lucide-react";
import { GradeLevel, LangKey } from "../types";
import { BRANCHES, COLORS, GRADE_LEVELS, T } from "../constants";

interface OnboardingModalProps {
  isOpen: boolean;
  lang: LangKey;
  isRTL: boolean;
  onComplete: (branchId: string, gradeLevel: GradeLevel) => void;
  onBrowseGuest: (branchId: string, gradeLevel: GradeLevel) => void;
}

export function OnboardingModal({
  isOpen,
  lang,
  isRTL,
  onComplete,
  onBrowseGuest,
}: OnboardingModalProps) {
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>("4eme_bac");
  const [selectedBranch, setSelectedBranch] = useState<string>("math");
  const t = T[lang];

  if (!isOpen) return null;

  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md bac-in">
      <div
        className="w-full max-w-xl rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        style={{
          background: COLORS.bg1,
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.8)",
        }}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg" style={{ background: "linear-gradient(135deg, #6366F1, #EC4899)" }}>
            <GraduationCap size={28} className="text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t.onboardingTitle}
          </h2>
          <p className="text-xs sm:text-sm mt-1.5" style={{ color: COLORS.textSoft }}>
            {t.onboardingSub}
          </p>
        </div>

        {/* Step 1: Grade Level */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: COLORS.gold }}>
            1. {t.chooseLevel}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {GRADE_LEVELS.map((g) => {
              const active = selectedGrade === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGrade(g.id)}
                  className="bac-btn p-3 rounded-2xl text-start flex flex-col justify-between cursor-pointer transition-all"
                  style={{
                    background: active ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                    border: active ? "2px solid #6366F1" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: active ? "#6366F1" : "rgba(255,255,255,0.08)", color: "#FFF" }}>
                      {g.badge}
                    </span>
                    {active && <Check size={14} className="text-indigo-400" />}
                  </div>
                  <span className="text-xs font-semibold text-white mt-1">
                    {g.name[lang]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Stream */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: COLORS.cyan }}>
            2. {t.chooseStream} (7 شعب رسمية)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {BRANCHES.map((b) => {
              const active = selectedBranch === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBranch(b.id)}
                  className="bac-btn p-3 rounded-2xl flex items-center gap-2.5 cursor-pointer text-start transition-all"
                  style={{
                    background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: active ? `2px solid ${b.color}` : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm"
                    style={{ background: b.color, color: "#0A0F1F" }}
                  >
                    {b.mono[lang]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {b.name[lang]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => onComplete(selectedBranch, selectedGrade)}
            className="bac-btn w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-bold text-sm cursor-pointer text-white flex items-center justify-center gap-2 shadow-lg"
            style={{ background: "linear-gradient(135deg, #6366F1, #EC4899)" }}
          >
            <span>{t.startExploring}</span>
            <NextIcon size={16} />
          </button>

          <button
            type="button"
            onClick={() => onBrowseGuest(selectedBranch, selectedGrade)}
            className="bac-btn w-full sm:w-auto py-3.5 px-5 rounded-2xl font-semibold text-xs cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: COLORS.textSoft,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Eye size={14} />
            <span>{t.browseAsGuest}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
