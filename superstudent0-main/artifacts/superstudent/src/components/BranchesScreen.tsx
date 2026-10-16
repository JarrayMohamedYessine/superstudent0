import React, { useState } from "react";
import {
  Sparkles,
  GraduationCap,
  Trophy,
  BookOpen,
  Flame,
  ArrowRight,
  ArrowLeft,
  Palette,
  Lock,
  LogIn,
  Users,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Zap,
  ChevronLeft,
  Compass,
  Cpu,
  Atom,
  TrendingUp,
  Activity,
  Award,
  MessageSquare,
  Star,
} from "lucide-react";
import { Account, LangKey } from "../types";
import { BRANCHES, T } from "../constants";
import { TopBar, SuperStudentBrandName, ModernButton, ModernIconButton } from "./Atoms";
import { getSectionBackgroundMeta } from "../services/backgroundsCatalog";
import { BackgroundGalleryModal } from "./BackgroundGalleryModal";
import { VisualBackground } from "./VisualBackground";
import { HomepageAnnouncementBanner } from "./HomepageAnnouncementBanner";

interface BranchesScreenProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account | null;
  selectedBranchId: string;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
  onPickBranch: (branchId: string) => void;
  onRequireAuth?: () => void;
  onOpenDocuments?: () => void;
  onOpenAnnouncements?: () => void;
  onOpenDiscord?: () => void;
  onOpenContribute?: () => void;
  onOpenFeedback?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

// Visual Emblems for the 7 Tunisian Sections (Replacing single letters)
const SECTION_ICONS: Record<string, React.ReactNode> = {
  math: <Compass className="w-6 h-6 text-indigo-300" />,
  sciexp: <Atom className="w-6 h-6 text-emerald-300" />,
  scitech: <Zap className="w-6 h-6 text-cyan-300" />,
  info: <Cpu className="w-6 h-6 text-violet-300" />,
  eco: <TrendingUp className="w-6 h-6 text-amber-300" />,
  lettres: <BookOpen className="w-6 h-6 text-pink-300" />,
  sport: <Activity className="w-6 h-6 text-rose-300" />,
};

export function BranchesScreen({
  lang,
  isRTL,
  user,
  selectedBranchId,
  onLogout,
  onOpenAdmin,
  onOpenSettings,
  onPickBranch,
  onRequireAuth,
  onOpenDocuments,
  onOpenAnnouncements,
  onOpenDiscord,
  onOpenContribute,
  onOpenFeedback,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}: BranchesScreenProps) {
  const t = T[lang];
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Active section for logged in user (or default to their selected branch)
  const isOwner = user?.role === "superadmin" || user?.email === "learningmyj20@gmail.com";
  const isTeacher = user?.role === "teacher";
  const isOwnerOrTeacher = isOwner || isTeacher;

  const userBranchId = user?.branch || selectedBranchId || "math";
  const userSectionMeta = isOwnerOrTeacher ? null : getSectionBackgroundMeta(userBranchId);
  const activeBranchObj = BRANCHES.find((b) => b.id === userBranchId) || BRANCHES[0];

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar
        lang={lang}
        isRTL={isRTL}
        title={t.appName}
        subtitle={lang === "ar" ? "منصة دراسية لتلاميذ الباكالوريا" : lang === "fr" ? "Ressources pour le baccalauréat tunisien" : "Study resources for Tunisian Baccalaureate students"}
        user={user}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
        onOpenSettings={onOpenSettings}
        onRequireAuth={onRequireAuth}
        onOpenNotifications={onOpenNotifications}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      <div className="flex-1 px-4 py-5 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {/* ━━━━━━━━━━━━━━━━━━━━ CASE 1: LOGGED-IN HERO ━━━━━━━━━━━━━━━━━━━━ */}
        {user ? (
          <div
            className="relative rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300"
            style={{
              background: isOwnerOrTeacher
                ? "linear-gradient(135deg, rgba(15, 23, 58, 0.95) 0%, rgba(30, 27, 75, 0.9) 50%, rgba(10, 15, 40, 0.98) 100%)"
                : undefined,
              borderColor: isOwnerOrTeacher
                ? isOwner ? "rgba(168, 85, 247, 0.45)" : "rgba(16, 185, 129, 0.45)"
                : `${activeBranchObj.color}60`,
              boxShadow: isOwnerOrTeacher
                ? isOwner ? "0 20px 50px -10px rgba(168, 85, 247, 0.3)" : "0 20px 50px -10px rgba(16, 185, 129, 0.3)"
                : `0 20px 50px -10px ${activeBranchObj.color}40`,
            }}
          >
            {/* Visual Background Canvas (Section theme for students, neutral luxury for owner/teachers) */}
            {userSectionMeta ? (
              <div className="absolute inset-0 z-0 opacity-80 pointer-events-none">
                <VisualBackground meta={userSectionMeta} intensity="banner" />
              </div>
            ) : (
              <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                  background: isOwnerOrTeacher
                    ? "radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.35), transparent 70%)"
                    : `linear-gradient(135deg, ${activeBranchObj.color}40, rgba(10, 15, 40, 0.95))`,
                }}
              />
            )}

            {/* Content Container */}
            <div className="relative z-10 p-5 md:p-7 backdrop-blur-sm bg-black/35 flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Icon Badge */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl relative border"
                    style={{
                      background: isOwner
                        ? "linear-gradient(135deg, #7C3AED, #4C1D95)"
                        : isTeacher
                        ? "linear-gradient(135deg, #059669, #064E3B)"
                        : `linear-gradient(135deg, ${activeBranchObj.color}, #0F172A)`,
                      borderColor: isOwner
                        ? "rgba(168, 85, 247, 0.8)"
                        : isTeacher
                        ? "rgba(52, 211, 153, 0.8)"
                        : `${activeBranchObj.color}80`,
                      boxShadow: isOwner
                        ? "0 8px 30px rgba(124, 58, 237, 0.5)"
                        : isTeacher
                        ? "0 8px 30px rgba(16, 185, 129, 0.5)"
                        : `0 8px 30px ${activeBranchObj.color}60`,
                    }}
                  >
                    {isOwner ? (
                      <ShieldCheck className="w-8 h-8 text-amber-300" />
                    ) : isTeacher ? (
                      <GraduationCap className="w-8 h-8 text-emerald-200" />
                    ) : (
                      SECTION_ICONS[activeBranchObj.id] || <GraduationCap className="w-8 h-8 text-white" />
                    )}
                  </div>

                  <div>
                    {/* Engraved Brand Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <SuperStudentBrandName size="sm" showTag={false} />
                    </div>

                    {/* Role / Branch Pill (No branch badge for owner or teacher) */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isOwner ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-purple-500/25 text-purple-200 border border-purple-500/40">
                          👑 {lang === "ar" ? "مشرف" : "SuperAdmin"}
                        </span>
                      ) : isTeacher ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-emerald-500/25 text-emerald-200 border border-emerald-500/40">
                          👨‍🏫 {lang === "ar" ? "أستاذ(ة)" : "Enseignant(e)"}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white border"
                          style={{
                            background: `${activeBranchObj.color}35`,
                            borderColor: `${activeBranchObj.color}70`,
                          }}
                        >
                          {activeBranchObj.name[lang]}
                        </span>
                      )}
                    </div>

                    <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>
                        {isOwner
                          ? lang === "ar" ? `مرحباً بك، مشرف المنصة ${user.displayName}` : `Bienvenue, Administrateur ${user.displayName}`
                          : isTeacher
                          ? lang === "ar" ? `مرحباً بك، أستاذ(ة) ${user.displayName}` : `Bienvenue, Professeur ${user.displayName}`
                          : lang === "ar" ? `مرحباً بك، ${user.displayName}` : `Bienvenue, ${user.displayName}`}
                      </span>
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ━━━━━━━━━━━━━━━━━━━━ CASE 2: VISITOR / UNREGISTERED INTRODUCTORY HERO & INSTRUCTIONS ━━━━━━━━━━━━━━━━━━━━ */
          <div className="space-y-4">
            {/* Main Presentation Hero */}
            <div
              className="relative rounded-3xl p-6 md:p-8 overflow-hidden border backdrop-blur-xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(15, 23, 58, 0.95) 0%, rgba(30, 27, 75, 0.9) 50%, rgba(10, 15, 40, 0.98) 100%)",
                borderColor: "rgba(99, 102, 241, 0.4)",
                boxShadow: "0 20px 50px -10px rgba(99, 102, 241, 0.35)",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3 max-w-xl">
                  {/* Engraved Brand Header */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <SuperStudentBrandName size="lg" showTag={false} />
                  </div>

                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {lang === "ar"
                      ? "أهلاً بك في SuperStudent"
                      : lang === "fr"
                        ? "Bienvenue sur SuperStudent"
                        : "Welcome to Superstudent"}
                  </h1>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                  <ModernButton
                    onClick={onRequireAuth}
                    size="lg"
                    variant="primary"
                    icon={<LogIn size={18} />}
                    className="shadow-2xl shadow-indigo-600/40"
                  >
                    <span>{lang === "ar" ? "تسجيل الدخول / إنشاء حساب" : lang === "fr" ? "Connexion / Inscription" : "Sign in / Create account"}</span>
                  </ModernButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━ PLATFORM FEATURES SHOWCASE ━━━━━━━━━━━━━━━━━━━━ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Feature 1: Announcements & Live */}
          <div
            onClick={onOpenAnnouncements}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.08] transition-all flex flex-col gap-2 cursor-pointer shadow-lg"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              📢
            </div>
            <h3 className="text-xs font-bold text-white flex items-center justify-between">
              <span>{lang === "ar" ? "الإعلانات والحصص المباشرة" : "Annonces & Directs"}</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === "ar"
                ? "متابعة الحصص التفاعلية المباشرة، التنبيهات الرسمية، والنصائح المنهجية."
                : "Suivi des cours en direct, alertes et fiches d'orientation."}
            </p>
          </div>

          {/* Feature 2: Community */}
          <div
            onClick={onOpenDiscord ? onOpenDiscord : () => onPickBranch(userBranchId)}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/[0.08] transition-all flex flex-col gap-2 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="text-xs font-bold text-white">
              {lang === "ar" ? "قاعات المراجعة والتواصل" : lang === "fr" ? "Salons d’étude" : "Study Rooms"}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === "ar"
                ? "مساحة للتواصل وتبادل الأسئلة وتنظيم جلسات المراجعة الجماعية."
                : "Un espace pour poser des questions et réviser en groupe."}
            </p>
          </div>

          {/* Feature 3: Archive */}
          <div
            onClick={onOpenDocuments}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.08] transition-all flex flex-col gap-2 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <h3 className="text-xs font-bold text-white">
              {lang === "ar" ? "بنك الوثائق والامتحانات" : lang === "fr" ? "Documents et sujets" : "Documents and exam papers"}
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {lang === "ar"
                ? "وثائق وملخصات وامتحانات وتمارين مع الإصلاح حسب المواد والشعب."
                : "Des documents, fiches, sujets et exercices corrigés."}
            </p>
          </div>
        </div>


      </div>

      {/* 25 Academic Backgrounds System Gallery Modal */}
      <BackgroundGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        lang={lang}
      />
    </div>
  );
}
