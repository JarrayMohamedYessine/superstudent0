import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Sparkles,
  HelpCircle,
  Settings as SettingsIcon,
  ShieldAlert,
  GraduationCap,
  LogIn,
  Home,
  Lock,
  FileText,
  Compass,
  Award,
  Eye,
  Megaphone,
  Archive,
} from "lucide-react";
import { Account, GradeLevel, LangKey, RoomItem, UserRole, BacDocumentItem } from "./types";
import { COLORS, GRAD, PRESENCE_WINDOW_MS, isAccountBanned, BRANCHES, T, isOwnerEmail } from "./constants";
import { getJSON, setJSON, delKey, normEmail, getAccountByEmail, getEliteApplications } from "./services/dataService";
import { getMeApi, setStoredToken } from "./services/authClient";
import { Logo } from "./components/Atoms";
import { AuthScreen } from "./components/AuthScreen";
import { BranchesScreen } from "./components/BranchesScreen";
import { BranchDiscordScreen } from "./components/BranchDiscordScreen";
import { AdminScreen } from "./components/AdminScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { DocumentsScreen } from "./components/DocumentsScreen";
import { AnnouncementsScreen } from "./components/AnnouncementsScreen";
import { FaqAndTrustPages } from "./components/FaqAndTrustPages";
import { BranchOnboardingModal } from "./components/BranchOnboardingModal";
import { NotificationCenterModal } from "./components/NotificationCenterModal";
import { getBacDocumentById } from "./services/documentsService";
import { getUserNotifications, isNotificationUnread } from "./services/notificationService";
import { getStreamTheme } from "./services/themeEngine";
import { saveUserProfileToLocalCache } from "./data/userProfilesCache";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=Cairo:wght@400;600;700;800&display=swap');
.bac-root * { box-sizing: border-box; }
.bac-root { -webkit-tap-highlight-color: transparent; }
@keyframes bacFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.bac-in { animation: bacFadeUp .35s cubic-bezier(0.16, 1, 0.3, 1) backwards; }
@keyframes bacPop { from { opacity: 0; transform: scale(.94) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.bac-msg-in { animation: bacPop .25s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes bacFloat { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-7px) rotate(1.5deg); } }
.bac-float { animation: bacFloat 6s ease-in-out infinite; }
@keyframes bacPulseGlow { 0%, 100% { opacity: 0.45; transform: scale(1); } 50% { opacity: 0.75; transform: scale(1.05); } }
.bac-glow-pulse { animation: bacPulseGlow 4s ease-in-out infinite; }
.bac-glass { background: rgba(15, 23, 42, 0.72); border: 1px solid rgba(255,255,255,.12); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); }
.bac-grad-text { background: linear-gradient(135deg,#818CF8,#C084FC,#F472B6); -webkit-background-clip: text; background-clip: text; color: transparent; }
.bac-card-shadow { box-shadow: 0 10px 35px -5px rgba(2,6,23,.6), 0 0 0 1px rgba(255,255,255,0.08); }
.bac-btn { transition: all .18s cubic-bezier(0.16, 1, 0.3, 1); }
.bac-btn:hover { transform: translateY(-1.5px); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.25); }
.bac-btn:active { transform: scale(.97); }
.bac-scroll::-webkit-scrollbar { width: 7px; height: 7px; }
.bac-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.22); border-radius: 8px; }
.bac-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.35); }
.bac-scroll::-webkit-scrollbar-track { background: transparent; }
.bac-root button:focus-visible, .bac-root input:focus-visible, .bac-root select:focus-visible, .bac-root [tabindex]:focus-visible { outline: 2px solid #818CF8; outline-offset: 2px; }
[dir="rtl"] .bac-root { font-family: 'Cairo', sans-serif; }
[dir="ltr"] .bac-root { font-family: 'Inter', sans-serif; }
[dir="rtl"] .bac-display { font-family: 'Cairo', sans-serif; }
[dir="ltr"] .bac-display { font-family: 'Plus Jakarta Sans', sans-serif; }
@media (prefers-reduced-motion: reduce) { .bac-root * { animation-duration: .001ms !important; transition-duration: .001ms !important; } }
`;

export type AppScreen =
  | "auth"
  | "branches"
  | "discord"
  | "documents"
  | "announcements"
  | "contribute"
  | "admin"
  | "settings"
  | "faq";

export default function App() {
  const [lang, setLangState] = useState<LangKey>("ar");
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<Account | null>(null);
  const [screen, setScreen] = useState<AppScreen>("branches");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("math");
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>("4eme_bac");
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Executive Role Simulator for Platform Owner
  const [impersonatedRole, setImpersonatedRole] = useState<UserRole | "guest" | null>(null);
  const [settingsSource, setSettingsSource] = useState<"role" | "owner">("role");

  // Check if current user's contribution request was approved or rejected
  const [hasResolvedContributionApp, setHasResolvedContributionApp] = useState(false);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const docId = searchParams.get("pdf_doc") || searchParams.get("view_pdf");
      const directPdfUrl = searchParams.get("pdf_url");

      if (docId || directPdfUrl) {
        // Clean URL to prevent browser sandbox redirection traps
        window.history.replaceState({}, document.title, window.location.pathname);
        setScreen("documents");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setHasResolvedContributionApp(false);
      return;
    }
    saveUserProfileToLocalCache(user);
    let isMounted = true;
    getEliteApplications()
      .then((apps) => {
        if (!isMounted) return;
        const myApp = apps.find(
          (a) =>
            (a.email && a.email.toLowerCase() === user.email.toLowerCase()) ||
            (a.username && a.username.toLowerCase() === user.username.toLowerCase())
        );
        if (myApp && (myApp.status === "approved" || myApp.status === "rejected")) {
          setHasResolvedContributionApp(true);
        } else {
          setHasResolvedContributionApp(false);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user]);

  const effectiveUser = useMemo<Account | null>(() => {
    if (!user) return null;
    const isOwner = user.role === "superadmin" || isOwnerEmail(user.email);
    if (!isOwner) return user;
    if (impersonatedRole === "guest") return null;
    if (impersonatedRole) {
      return {
        ...user,
        role: impersonatedRole,
        canUpload: impersonatedRole === "superadmin" || impersonatedRole === "teacher" || impersonatedRole === "moderator" || impersonatedRole === "elite_student",
      };
    }
    return user;
  }, [user, impersonatedRole]);

  const isPromotedRole = Boolean(
    effectiveUser &&
    (effectiveUser.role === "teacher" ||
     effectiveUser.role === "elite_student" ||
     effectiveUser.role === "superadmin" ||
     effectiveUser.role === "moderator")
  );

  // Contribution page is only for standard users without a decided/promoted status
  const canShowContributionPage = !isPromotedRole && !hasResolvedContributionApp;

  // Auto-redirect away from contribute page if not eligible
  useEffect(() => {
    if (screen === "contribute" && !canShowContributionPage) {
      setScreen("branches");
    }
  }, [screen, canShowContributionPage]);

  const isRTL = lang === "ar";
  const bodyFont = lang === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif";
  const t = T[lang];

  // Scroll to top immediately on screen change
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const mainEl = document.querySelector("main");
      if (mainEl) mainEl.scrollTop = 0;
    } catch {
      // fallback
      window.scrollTo(0, 0);
    }
  }, [screen]);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setUnreadNotifCount(0);
      return;
    }
    try {
      const notifs = await getUserNotifications(user);
      const unread = notifs.filter((n) => isNotificationUnread(n, user)).length;
      setUnreadNotifCount(unread);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const setLang = useCallback((l: LangKey) => {
    setLangState(l);
    setJSON("lang-pref", { lang: l }, false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await getJSON<{ lang?: LangKey }>("lang-pref", false);
        if (savedLang?.lang && ["ar", "fr", "en"].includes(savedLang.lang)) {
          setLangState(savedLang.lang);
        }

        // 1. First check real server-side JWT session
        const serverUser = await getMeApi();
        if (serverUser && !isAccountBanned(serverUser)) {
          setUser(serverUser);
          setSelectedBranchId(serverUser.branch || "math");
          setScreen("branches");
        } else {
          const session = await getJSON<{ email?: string }>("session", false);
          if (session && session.email) {
            const account = await getAccountByEmail(session.email);
            if (account && !isAccountBanned(account)) {
              setUser(account);
              setSelectedBranchId(account.branch || "math");
              setScreen("branches");
            } else {
              await delKey("session", false);
            }
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;

    // Local Registry Heartbeat
    async function beat() {
      if (!user) return;
      try {
        const presence =
          (await getJSON<Record<string, number>>("presence-registry", true)) || {};
        const now = Date.now();
        presence[user.email] = now;
        Object.keys(presence).forEach((k) => {
          if (now - presence[k] > PRESENCE_WINDOW_MS * 2) delete presence[k];
        });
        if (active) await setJSON("presence-registry", presence, true);
      } catch {
        // ignore
      }
    }
    beat();
    const iv = setInterval(beat, 45000);

    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [user]);

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
      document.body.dir = isRTL ? "rtl" : "ltr";
    } catch {
      // ignore
    }
  }, [lang, isRTL]);

  function handleAuthed(account: Account) {
    setUser(account);
    setSelectedBranchId(account.branch || "math");
    setScreen("branches");
  }

  async function handleLogout() {
    try {
      setStoredToken(null);
      await delKey("session", false);
    } catch {
      // ignore
    }
    setUser(null);
    setSelectedBranchId("math");
    setScreen("branches");
  }

  async function handleSelectBranch(branchId: string) {
    setSelectedBranchId(branchId);
    if (user && user.branch !== branchId) {
      const updated = { ...user, branch: branchId };
      setUser(updated);
      await setJSON(`account:${user.email}`, updated, true);
    }
  }

  function handlePickBranch(branchId: string) {
    handleSelectBranch(branchId);
    setScreen("branches");
  }

  if (initializing) {
    return (
      <div
        className="bac-root flex flex-col items-center justify-center min-h-screen gap-4 text-white"
        style={{
          background: `linear-gradient(180deg, ${COLORS.bg0}, ${COLORS.bg1})`,
        }}
      >
        <style>{GLOBAL_CSS}</style>
        <Logo size={72} showText={true} />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          {lang === "ar" ? "جارٍ التحميل…" : lang === "fr" ? "Chargement…" : "Loading…"}
        </p>
      </div>
    );
  }

  const showBottomNav = true;

  const isOwner = effectiveUser?.role === "superadmin" || isOwnerEmail(effectiveUser?.email);
  const isTeacher = effectiveUser?.role === "teacher";
  const isOwnerOrTeacher = isOwner || isTeacher;

  // For Owner and Teachers: Keep the original platform baseline theme (not restricted or tinted by a stream)
  const activeBranch = isOwnerOrTeacher ? null : (effectiveUser?.branch || selectedBranchId || "math");
  const activeTheme = getStreamTheme(activeBranch);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="bac-root w-full flex flex-col min-h-screen relative selection:bg-indigo-500 selection:text-white"
      style={{
        background: activeTheme.backgroundGradient,
        color: COLORS.text,
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* Floating Role Simulator Indicator for Platform Owner */}
      {impersonatedRole !== null && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-700 text-white text-xs font-bold py-2 px-4 flex items-center justify-between shadow-xl sticky top-0 z-50 border-b border-white/20 animate-fade-in flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-amber-300 animate-pulse" />
            <span>
              {lang === "ar"
                ? `👁️ وضع المعاينة النشط: تتصفح المنصة الآن بصفتك (${
                    impersonatedRole === "guest"
                      ? "زائر غير مسجل"
                      : impersonatedRole === "teacher"
                      ? "أستاذ معتمد"
                      : impersonatedRole === "moderator"
                      ? "مشرف مادة"
                      : impersonatedRole === "elite_student"
                      ? "تلميذ نخبة / مساهم"
                      : "تلميذ مسجل عادي"
                  })`
                : `Mode simulation actif : Vous naviguez en tant que (${impersonatedRole})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSettingsSource("owner");
                setScreen("settings");
              }}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-xl text-[11px] font-bold text-white flex items-center gap-1.5 cursor-pointer transition-all border border-white/25 shadow-sm"
              title={lang === "ar" ? "لوحة إعدادات المالك والتحكم بالمحاكاة" : "Paramètres du Propriétaire"}
            >
              <SettingsIcon size={13} className="text-amber-300" />
              <span>{lang === "ar" ? "الإعدادات ⚙️" : "Paramètres"}</span>
            </button>
            <button
              onClick={() => setImpersonatedRole(null)}
              className="px-3 py-1 bg-black/40 hover:bg-black/70 rounded-xl text-[11px] font-black border border-white/30 text-amber-300 hover:text-white cursor-pointer transition-all shadow"
            >
              {lang === "ar" ? "العودة لوضع المالك (الإدارة) 👑" : "Quitter la simulation"}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Responsive across all mobile phones, tablets, and desktop screens */}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto flex flex-col ${
          "pb-28 sm:pb-32"
        } px-2 sm:px-4 md:px-6`}
        style={{ fontFamily: bodyFont }}
      >
        {screen === "auth" && (
          <AuthScreen
            lang={lang}
            setLang={setLang}
            isRTL={isRTL}
            onAuthed={handleAuthed}
            onGuestExplore={() => setScreen("branches")}
          />
        )}

        {screen === "branches" && (
          <BranchesScreen
            lang={lang}
            isRTL={isRTL}
            user={effectiveUser}
            selectedBranchId={selectedBranchId}
            onLogout={handleLogout}
            onOpenAdmin={() => setScreen("admin")}
            onOpenSettings={() => {
              setSettingsSource("role");
              setScreen("settings");
            }}
            onPickBranch={handlePickBranch}
            onRequireAuth={() => setScreen("auth")}
            onOpenDocuments={() => setScreen("documents")}
            onOpenAnnouncements={() => setScreen("announcements")}
            onOpenDiscord={() => setScreen("discord")}
            onOpenContribute={() => setScreen("contribute")}
            onOpenFeedback={() => setScreen("faq")}
            onOpenNotifications={() => setIsNotifModalOpen(true)}
            unreadNotificationsCount={unreadNotifCount}
          />
        )}

        {screen === "discord" && (
          <BranchDiscordScreen
            lang={lang}
            isRTL={isRTL}
            user={effectiveUser}
            onBack={() => setScreen("branches")}
            onLogout={handleLogout}
            onOpenAdmin={() => setScreen("admin")}
            onOpenSettings={() => {
              setSettingsSource("role");
              setScreen("settings");
            }}
            onRequireAuth={() => setScreen("auth")}
            onOpenNotifications={() => setIsNotifModalOpen(true)}
            unreadNotificationsCount={unreadNotifCount}
          />
        )}

        {screen === "documents" && (
          <div className="flex flex-col min-h-screen">
            <DocumentsScreen
              user={effectiveUser}
              lang={lang}
              isRTL={isRTL}
              onLogout={handleLogout}
              onOpenAdmin={() => setScreen("admin")}
              onOpenSettings={() => {
                setSettingsSource("role");
                setScreen("settings");
              }}
              onRequireAuth={() => setScreen("auth")}
              onOpenContribute={canShowContributionPage ? () => setScreen("contribute") : undefined}
              onOpenNotifications={() => setIsNotifModalOpen(true)}
              unreadNotificationsCount={unreadNotifCount}
            />
          </div>
        )}

        {screen === "announcements" && (
          <div className="flex flex-col min-h-screen">
            <AnnouncementsScreen
              user={effectiveUser}
              lang={lang}
              isRTL={isRTL}
              onLogout={handleLogout}
              onOpenAdmin={() => setScreen("admin")}
              onOpenSettings={() => {
                setSettingsSource("role");
                setScreen("settings");
              }}
              onRequireAuth={() => setScreen("auth")}
              onOpenNotifications={() => setIsNotifModalOpen(true)}
              unreadNotificationsCount={unreadNotifCount}
            />
          </div>
        )}

        {screen === "contribute" && (
          <div className="flex flex-col min-h-screen">
            <FaqAndTrustPages
              view="contribute"
              lang={lang}
              isRTL={isRTL}
              user={effectiveUser}
              onBack={() => setScreen("branches")}
              onLogout={handleLogout}
              onOpenAdmin={() => setScreen("admin")}
              onOpenSettings={() => {
                setSettingsSource("role");
                setScreen("settings");
              }}
              onRequireAuth={() => setScreen("auth")}
              onOpenNotifications={() => setIsNotifModalOpen(true)}
              unreadNotificationsCount={unreadNotifCount}
            />
          </div>
        )}

        {screen === "faq" && (
          <div className="flex flex-col min-h-screen">
            <FaqAndTrustPages
              view="faq"
              lang={lang}
              isRTL={isRTL}
              user={effectiveUser}
              onLogout={handleLogout}
              onOpenAdmin={() => setScreen("admin")}
              onOpenSettings={() => {
                setSettingsSource("role");
                setScreen("settings");
              }}
              onRequireAuth={() => setScreen("auth")}
              onOpenNotifications={() => setIsNotifModalOpen(true)}
              unreadNotificationsCount={unreadNotifCount}
            />
          </div>
        )}

        {screen === "admin" && user && user.role === "superadmin" && (
          <AdminScreen
            lang={lang}
            isRTL={isRTL}
            user={user}
            onLogout={handleLogout}
            onBack={() => setScreen("branches")}
            onOpenNotifications={() => setIsNotifModalOpen(true)}
            unreadNotificationsCount={unreadNotifCount}
          />
        )}

        {screen === "settings" && (
          <SettingsScreen
            lang={lang}
            setLang={setLang}
            isRTL={isRTL}
            user={settingsSource === "owner" ? user : effectiveUser}
            realUser={user}
            settingsSource={settingsSource}
            onToggleSettingsSource={setSettingsSource}
            setUser={setUser}
            onLogout={handleLogout}
            onRequireAuth={() => setScreen("auth")}
            onBack={() => setScreen("branches")}
            impersonatedRole={impersonatedRole}
            onSetImpersonatedRole={setImpersonatedRole}
            onOpenEliteModal={() => setScreen("contribute")}
          />
        )}
      </main>

      {/* Persistent Bottom Floating Dock Navigation - Optimized for all screen sizes */}
      {showBottomNav && (
        <div
          className="fixed inset-x-0 z-40 pointer-events-none px-2 sm:px-4"
          style={{ bottom: "max(0.625rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <nav
            className="pointer-events-auto max-w-2xl mx-auto p-1 sm:p-2 rounded-2xl sm:rounded-3xl bg-slate-950/90 backdrop-blur-2xl border border-slate-800/90 flex items-center justify-around gap-0.5 sm:gap-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)]"
            style={{
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12), 0 16px 36px -4px rgba(0,0,0,0.8), 0 0 20px rgba(99,102,241,0.15)",
            }}
          >
            {/* Tab 1: Home / Branches */}
            <button
              onClick={() => setScreen("branches")}
              className={`nav-dock-tab flex-1 min-w-0 py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl sm:rounded-2xl cursor-pointer ${
                screen === "branches" ? "active" : ""
              }`}
            >
              <div className={`btn-graphic-box w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                screen === "branches"
                  ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/40"
                  : "bg-white/[0.05] text-slate-400"
              }`}>
                <Home size={16} />
              </div>
              <span className={`text-[9px] sm:text-[11px] font-bold truncate max-w-full text-center tracking-tight transition-colors ${
                screen === "branches" ? "text-indigo-300" : "text-slate-400"
              }`}>
                {lang === "ar" ? "الرئيسية" : lang === "fr" ? "Accueil" : "Home"}
              </span>
            </button>

            {/* Tab: Documents Bank (Exams, Summaries, National Tests, Corrections) */}
            <button
              onClick={() => setScreen("documents")}
              className={`nav-dock-tab flex-1 min-w-0 py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl sm:rounded-2xl cursor-pointer ${
                screen === "documents" ? "active" : ""
              }`}
            >
              <div className={`btn-graphic-box w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                screen === "documents"
                  ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/40"
                  : "bg-white/[0.05] text-slate-400"
              }`}>
                <FileText size={16} />
              </div>
              <span className={`text-[9px] sm:text-[11px] font-bold truncate max-w-full text-center tracking-tight transition-colors ${
                screen === "documents" ? "text-emerald-300" : "text-slate-400"
              }`}>
                {lang === "ar" ? "بنك الوثائق" : lang === "fr" ? "Sujets & Docs" : "Documents"}
              </span>
            </button>

            {/* Tab: Announcements & Live Classes */}
            <button
              onClick={() => setScreen("announcements")}
              className={`nav-dock-tab flex-1 min-w-0 py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl sm:rounded-2xl cursor-pointer ${
                screen === "announcements" ? "active" : ""
              }`}
            >
              <div className={`btn-graphic-box w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                screen === "announcements"
                  ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/40"
                  : "bg-white/[0.05] text-slate-400"
              }`}>
                <Megaphone size={16} />
              </div>
              <span className={`text-[9px] sm:text-[11px] font-bold truncate max-w-full text-center tracking-tight transition-colors ${
                screen === "announcements" ? "text-amber-300 font-black" : "text-slate-400"
              }`}>
                {lang === "ar" ? "الإعلانات" : lang === "fr" ? "Annonces" : "Announcements"}
              </span>
            </button>

            {/* Tab: Dedicated Contribution Request (Hidden once user is promoted or application is approved/rejected) */}
            {canShowContributionPage && (
              <button
                onClick={() => setScreen("contribute")}
                className={`nav-dock-tab flex-1 min-w-0 py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl sm:rounded-2xl cursor-pointer ${
                  screen === "contribute" ? "active" : ""
                }`}
              >
                <div className={`btn-graphic-box w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                  screen === "contribute"
                    ? "bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/40"
                    : "bg-white/[0.05] text-slate-400"
                }`}>
                  <Award size={16} />
                </div>
                <span className={`text-[9px] sm:text-[11px] font-bold truncate max-w-full text-center tracking-tight transition-colors ${
                  screen === "contribute" ? "text-amber-300 font-black" : "text-slate-400"
                }`}>
                  {lang === "ar" ? "طلب المساهمة" : lang === "fr" ? "Contribuer" : "Contribute"}
                </span>
              </button>
            )}

            {/* Tab: Discord */}
            <button
              onClick={() => setScreen("discord")}
              aria-label="Discord"
              className={`nav-dock-tab flex-1 min-w-0 py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl sm:rounded-2xl cursor-pointer ${
                screen === "discord" ? "active" : ""
              }`}
            >
              <div className={`btn-graphic-box w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                screen === "discord"
                  ? "bg-[#5865F2] text-white shadow-md shadow-indigo-500/40"
                  : "bg-white/[0.05] text-slate-400"
              }`}>
                <MessageSquare size={16} />
              </div>
              <span className={`text-[9px] sm:text-[11px] font-bold truncate max-w-full text-center tracking-tight transition-colors ${
                screen === "discord" ? "text-indigo-300" : "text-slate-400"
              }`}>Discord</span>
            </button>

            {/* Tab: FAQ & Support */}
            <button
              onClick={() => setScreen("faq")}
              className={`nav-dock-tab flex-1 min-w-0 py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-xl sm:rounded-2xl cursor-pointer ${
                screen === "faq" ? "active" : ""
              }`}
            >
              <div className={`btn-graphic-box w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all ${
                screen === "faq"
                  ? "bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/40"
                  : "bg-white/[0.05] text-slate-400"
              }`}>
                <HelpCircle size={16} />
              </div>
              <span className={`text-[9px] sm:text-[11px] font-bold truncate max-w-full text-center tracking-tight transition-colors ${
                screen === "faq" ? "text-sky-300" : "text-slate-400"
              }`}>
                {lang === "ar" ? "الأسئلة والدعم" : lang === "fr" ? "FAQ & Aide" : "FAQ & Support"}
              </span>
            </button>
          </nav>
        </div>
      )}

      {/* Branch Onboarding Modal for New Google Sign-Ins */}
      {user && (user.needsBranchSetup || !user.branch) && (
        <BranchOnboardingModal
          lang={lang}
          isRTL={isRTL}
          user={user}
          onComplete={(updatedUser) => {
            setUser(updatedUser);
            setSelectedBranchId(updatedUser.branch || "math");
            if (updatedUser.gradeLevel) setSelectedGrade(updatedUser.gradeLevel);
          }}
        />
      )}

      {/* Notification Center Modal for Super Admin, Moderators & Elite Students */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => {
          setIsNotifModalOpen(false);
          refreshNotifications();
        }}
        user={user}
        lang={lang}
        isRTL={isRTL}
        onNavigateScreen={(scrKey) => {
          if (scrKey === "documents") setScreen("documents");
          else if (scrKey === "admin") setScreen("admin");
          else if (scrKey === "faq") setScreen("faq");
          else if (scrKey === "branches") setScreen("branches");
          setIsNotifModalOpen(false);
        }}
      />
    </div>
  );
}
