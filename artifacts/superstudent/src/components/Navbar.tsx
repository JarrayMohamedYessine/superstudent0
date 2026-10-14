import React from "react";
import {
  GraduationCap,
  Sparkles,
  Layers,
  Compass,
  FileText,
  Users,
  Calculator,
  Crown,
  Settings,
  LogIn,
  LogOut,
  User,
  Globe,
} from "lucide-react";
import { LangKey, Account, BranchInfo } from "../types";
import { BRANCHES, T } from "../constants";

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentBranch: string;
  onSelectBranch: (branchId: string) => void;
  lang: LangKey;
  onSelectLang: (lang: LangKey) => void;
  currentUser: Account | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenGeminiSettings?: () => void;
  onOpenEliteModal: () => void;
  onOpenFeedback: () => void;
}

export function Navbar({
  activeTab,
  onSelectTab,
  currentBranch,
  onSelectBranch,
  lang,
  onSelectLang,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenGeminiSettings,
  onOpenEliteModal,
  onOpenFeedback,
}: NavbarProps) {
  const currentBranchInfo = BRANCHES.find((b) => b.id === currentBranch) || BRANCHES[0];
  const t = T[lang] || T.ar;

  const NAV_ITEMS = [
    {
      id: "ai_tutor",
      label: lang === "ar" ? "المساعد الذكي" : "Tuteur IA",
      icon: Sparkles,
      badge: "Gemini 2.5",
    },
    {
      id: "flashcards",
      label: lang === "ar" ? "البطاقات التعليمية" : "Flashcards",
      icon: Layers,
      badge: "12 Styles",
    },
    {
      id: "exams",
      label: lang === "ar" ? "بنك الامتحانات" : "Banque d'Examens",
      icon: FileText,
      badge: "2025",
    },
    {
      id: "rooms",
      label: lang === "ar" ? "قاعات المذاكرة" : "Salles d'Étude",
      icon: Users,
    },
    {
      id: "calculator",
      label: lang === "ar" ? "حساب السكور" : "Calculateur FG",
      icon: Calculator,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier: Brand, Branch Picker, Settings, User */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg md:text-xl text-white tracking-tight">
                  SuperStudent<span className="text-indigo-400">.TN</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Bac 2027 🇹🇳
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                {lang === "ar" ? "المنصة الذكية الرائدة لتلاميذ الباكالوريا في تونس" : "Plateforme éducative d'excellence pour le Baccalauréat tunisien"}
              </div>
            </div>
          </div>

          {/* Controls: Branch Switcher, Elite Badge, AI Settings, Auth */}
          <div className="flex items-center gap-2.5">
            {/* Branch Selector Pill */}
            <div className="relative">
              <select
                value={currentBranch}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="appearance-none bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-xl cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {BRANCHES.map((bInfo) => (
                  <option key={bInfo.id} value={bInfo.id}>
                    {bInfo.name[lang] || bInfo.name.ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px] font-bold">
              <button
                onClick={() => onSelectLang("ar")}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  lang === "ar" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => onSelectLang("fr")}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  lang === "fr" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                FR
              </button>
              <button
                onClick={() => onSelectLang("en")}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  lang === "en" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>

            {/* Elite Student CTA */}
            <button
              onClick={onOpenEliteModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === "ar" ? "نادي النخبة" : "Club Élite"}</span>
            </button>

            {/* User Auth */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentUser.displayName}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.signIn || (lang === "ar" ? "تسجيل الدخول" : "Connexion")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Tier: Feature Tabs Navigation */}
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar border-t border-slate-850">
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive
                        ? "bg-indigo-800 text-indigo-200"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
