import React, { useState, useRef } from "react";
import {
  UserCog,
  Camera,
  ChevronDown,
  Check,
  Globe,
  KeyRound,
  Lock,
  User,
  ShieldCheck,
  Award,
  Download,
  GraduationCap,
  Sparkles,
  Palette,
  ExternalLink,
  LogIn,
  LogOut,
  Info,
  Layers,
  Code2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Zap,
  Eye,
  Settings as SettingsIcon,
} from "lucide-react";
import { Account, GradeLevel, LangKey, UserRole } from "../types";
import { COLORS, GRAD, GRAD_GOLD, GRAD_CYAN, BRANCHES, GRADE_LEVELS, T } from "../constants";
import {
  setJSON,
  resizeToDataURL,
  uploadAvatarToStorage,
  saveAccount,
} from "../services/dataService";
import { TopBar, Avatar, TextField, ErrorNote, PrimaryButton } from "./Atoms";
import { BackgroundGalleryModal } from "./BackgroundGalleryModal";

interface SettingsScreenProps {
  lang: LangKey;
  setLang?: (l: LangKey) => void;
  isRTL: boolean;
  user: Account | null;
  realUser?: Account | null;
  settingsSource?: "role" | "owner";
  onToggleSettingsSource?: (src: "role" | "owner") => void;
  setUser: (acc: Account) => void;
  onLogout: () => void;
  onRequireAuth?: () => void;
  onBack: () => void;
  impersonatedRole?: UserRole | "guest" | null;
  onSetImpersonatedRole?: (role: UserRole | "guest" | null) => void;
  onOpenEliteModal?: () => void;
}

export function SettingsScreen({
  lang,
  setLang,
  isRTL,
  user,
  realUser,
  settingsSource = "role",
  onToggleSettingsSource,
  setUser,
  onLogout,
  onRequireAuth,
  onBack,
  impersonatedRole,
  onSetImpersonatedRole,
  onOpenEliteModal,
}: SettingsScreenProps) {
  const t = T[lang];
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [branch, setBranch] = useState(user?.branch || BRANCHES[0].id);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(user?.gradeLevel || "4eme_bac");
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [passBusy, setPassBusy] = useState(false);
  const [passFlash, setPassFlash] = useState("");
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync state if simulated user profile changes
  React.useEffect(() => {
    setDisplayName(user?.displayName || "");
    setBranch(user?.branch || BRANCHES[0].id);
    setGradeLevel(user?.gradeLevel || "4eme_bac");
    setAvatar(user?.avatar || null);
  }, [user]);

  const isRealOwner =
    realUser?.role === "superadmin" ||
    realUser?.email === "learningmyj20@gmail.com" ||
    user?.role === "superadmin" ||
    user?.email === "learningmyj20@gmail.com";

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeToDataURL(file, 160, 0.7, true);
      setAvatar(dataUrl);
    } catch {
      // ignore
    }
  }

  async function handleSaveProfile() {
    if (!user) return;
    setError("");
    setSavedFlash(false);
    if (!displayName.trim()) {
      setError(t.errFields);
      return;
    }
    setSaving(true);
    let avatarUrl = avatar;
    if (avatar && avatar.startsWith("data:")) {
      avatarUrl = await uploadAvatarToStorage(avatar, user.username);
    }
    const updated: Account = {
      ...user,
      displayName: displayName.trim().slice(0, 30),
      branch,
      gradeLevel,
      avatar: avatarUrl || null,
    };
    const ok = await saveAccount(updated);
    setSaving(false);
    if (ok) {
      setUser(updated);
      setSavedFlash(true);
    }
  }

  async function handleChangePassword() {
    if (!user) return;
    setPassFlash("");
    setError("");
    if (!curPass || !newPass) {
      setError(t.errFields);
      return;
    }
    if (newPass.length < 8) {
      setError(t.errPasswordShort);
      return;
    }
    setPassBusy(true);
    try {
      await saveAccount({ ...user, password: newPass } as any);
      setPassFlash(t.passwordChanged);
      setCurPass("");
      setNewPass("");
    } catch {
      setError(t.errFields);
    } finally {
      setPassBusy(false);
    }
  }

  const languagesList: Array<{ id: LangKey; label: string; flag: string; native: string }> = [
    { id: "ar", label: "العربية", flag: "AR", native: "لغة الواجهة" },
    { id: "fr", label: "Français", flag: "FR", native: "Langue de l’interface" },
    { id: "en", label: "English", flag: "EN", native: "Interface language" },
  ];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${COLORS.bg0}, ${COLORS.bg1})`,
      }}
    >
      <TopBar
        lang={lang}
        isRTL={isRTL}
        title={
          impersonatedRole && settingsSource === "role"
            ? impersonatedRole === "teacher"
              ? (lang === "ar" ? "إعدادات الأستاذ المعتمد" : "Paramètres de l'Enseignant")
              : impersonatedRole === "member"
              ? (lang === "ar" ? "إعدادات حساب التلميذ" : "Paramètres de l'Élève")
              : impersonatedRole === "elite_student"
              ? (lang === "ar" ? "إعدادات التلميذ المتميز" : "Paramètres Élève d'Élite")
              : (lang === "ar" ? "إعدادات الزائر (غير مسجل)" : "Paramètres Visiteur")
            : (lang === "ar" ? "الإعدادات ومعلومات المنصة" : lang === "fr" ? "Paramètres & À Propos" : "Settings & About")
        }
        accent={COLORS.accent}
        onBack={onBack}
        user={user}
        onLogout={onLogout}
        onRequireAuth={onRequireAuth}
      />

      <div className="bac-scroll flex-1 px-4 py-5 overflow-y-auto flex flex-col gap-6 max-w-3xl mx-auto w-full">
        
        {/* Role Preview Indicator (Shown when browsing a role from the original TopBar gear) */}
        {impersonatedRole !== null && settingsSource === "role" && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs font-semibold flex-wrap gap-2 animate-fade-in">
            <div className="flex items-center gap-2 text-indigo-300">
              <Eye size={16} className="text-amber-400 shrink-0" />
              <span>
                {lang === "ar"
                  ? `أنت تعاين الآن ترس إعدادات (${
                      impersonatedRole === "teacher"
                        ? "الأستاذ المعتمد"
                        : impersonatedRole === "elite_student"
                        ? "التلميذ المتميز"
                        : impersonatedRole === "member"
                        ? "التلميذ المسجل"
                        : "الزائر غير المسجل"
                    }) بالضبط كما يظهر له في حسابه`
                  : `Vous visualisez la page des paramètres telle qu'elle s'affiche pour (${impersonatedRole})`}
              </span>
            </div>
            {onToggleSettingsSource && (
              <button
                type="button"
                onClick={() => onToggleSettingsSource("owner")}
                className="px-2.5 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
              >
                <SettingsIcon size={12} className="text-amber-300" />
                <span>{lang === "ar" ? "لوحة إعدادات المالك 👑" : "Panneau Propriétaire"}</span>
              </button>
            )}
          </div>
        )}

        {/* 1. Account Status & Quick Auth Control (Login / Logout) */}
        <div
          className="bac-card-shadow bac-in rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: user
              ? "linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(15, 23, 42, 0.85))"
              : "linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))",
            border: `1px solid ${user ? "rgba(99, 102, 241, 0.35)" : "rgba(255, 255, 255, 0.12)"}`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {user ? (
                <Avatar
                  src={user.avatar}
                  name={user.displayName || user.username}
                  size={52}
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-white/10 flex items-center justify-center border border-white/15">
                  <User size={26} className="text-slate-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white">
                    {user
                      ? user.displayName || user.username
                      : lang === "ar"
                      ? "حساب غير متصل (زائر)"
                      : lang === "fr"
                      ? "Compte Invité (Déconnecté)"
                      : "Guest User (Logged Out)"}
                  </h2>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      !user
                        ? "bg-slate-800 text-slate-300 border border-slate-700"
                        : user.role === "teacher"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : user.role === "elite_student"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : user.role === "moderator"
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                        : user.role === "superadmin"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}
                  >
                    {!user
                      ? (lang === "ar" ? "👤 زائر (غير مسجل)" : "Visiteur")
                      : user.role === "teacher"
                      ? (lang === "ar" ? "👨‍🏫 أستاذ(ة)" : "Enseignant(e)")
                      : user.role === "elite_student"
                      ? (lang === "ar" ? "⭐ تلميذ نخبة" : "Élève Élite")
                      : user.role === "moderator"
                      ? (lang === "ar" ? "🛡️ مشرف" : "Modérateur")
                      : user.role === "superadmin"
                      ? (lang === "ar" ? "👑 مشرف" : "SuperAdmin")
                      : (lang === "ar" ? "🎓 تلميذ مسجل" : "Élève")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user
                    ? user.email
                    : lang === "ar"
                    ? "سجّل الدخول للمشاركة في الغرف وبنك الوثائق والإعلانات."
                    : lang === "fr"
                    ? "Connectez-vous pour participer aux salons."
                    : "Sign in to participate in study rooms."}
                </p>
              </div>
            </div>

            {/* Auth Action Button: Logout if active, Login if inactive */}
            {user ? (
              <button
                type="button"
                onClick={onLogout}
                className="bac-btn flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-rose-200 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 cursor-pointer shadow-sm transition-all"
              >
                <LogOut size={15} className="text-rose-300" />
                <span>{lang === "ar" ? "تسجيل الخروج من الحساب" : lang === "fr" ? "Se Déconnecter" : "Log Out"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequireAuth}
                className="bac-btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer shadow-md transition-all"
                style={{ background: GRAD }}
              >
                <LogIn size={15} />
                <span>{lang === "ar" ? "تسجيل الدخول / إنشاء حساب" : lang === "fr" ? "Se Connecter / S'inscrire" : "Sign In / Register"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Role Simulator Switcher for Owner (Shown when settingsSource === "owner" or when not simulating) */}
        {isRealOwner && (settingsSource === "owner" || impersonatedRole === null) && (
          <div
            className="bac-card-shadow bac-in rounded-3xl p-5 space-y-3.5"
            style={{
              background: "linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))",
              border: "1.5px solid rgba(168, 85, 247, 0.5)",
              boxShadow: "0 10px 30px -5px rgba(168, 85, 247, 0.25)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{lang === "ar" ? "لوحة المالك: التحكم بالأدوار والمعاينة" : "Simulateur des paramètres par rôle"}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                      Owner Tool
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    {lang === "ar"
                      ? "اختر الصفة لعرض صفحة الإعدادات والميزات كما تظهر تماماً لذلك الحساب (تلميذ، أستاذ، زائر...):"
                      : "Visualisez la page des paramètres telle qu'elle s'affiche pour chaque type de compte :"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {[
                { id: null, labelAr: "👑 المالك (SuperAdmin)", labelFr: "👑 Propriétaire", desc: "كامل صلاحيات الإدارة" },
                { id: "teacher", labelAr: "👨‍🏫 أستاذ معتمد", labelFr: "👨‍🏫 Enseignant", desc: "إعدادات الأستاذ والصلاحيات" },
                { id: "elite_student", labelAr: "⭐ تلميذ نخبة", labelFr: "⭐ Élève d'élite", desc: "إعدادات التلميذ المتميز" },
                { id: "member", labelAr: "🎓 تلميذ مسجل", labelFr: "🎓 Élève standard", desc: "إعدادات التلميذ + طلب الترقية" },
                { id: "guest", labelAr: "👤 زائر (غير مسجل)", labelFr: "👤 Visiteur", desc: "واجهة الضيف العامة" },
              ].map((roleOpt) => {
                const isSelected = impersonatedRole === roleOpt.id || (roleOpt.id === null && impersonatedRole === null);
                return (
                  <button
                    key={String(roleOpt.id)}
                    type="button"
                    onClick={() => onSetImpersonatedRole?.(roleOpt.id as any)}
                    className={`p-3 rounded-2xl text-right transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-purple-600/30 border-2 border-purple-400 text-white shadow-lg ring-2 ring-purple-500/40"
                        : "bg-slate-900/70 border border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{lang === "ar" ? roleOpt.labelAr : roleOpt.labelFr}</p>
                      <span className="text-[10px] text-slate-400">{roleOpt.desc}</span>
                    </div>
                    {isSelected && (
                      <span className="mt-2 text-[10px] font-black text-emerald-400 flex items-center gap-1">
                        <Check size={12} /> {lang === "ar" ? "أنت تعاين هذا الحساب الآن" : "Actif"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Language Switcher Card (تغيير اللغة) */}
        <div
          className="bac-card-shadow bac-in rounded-3xl p-5"
          style={{
            background: "rgba(255,255,255,.06)",
            border: `1px solid ${COLORS.line}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === "ar" ? "لغة واجهة المنصة (Language)" : lang === "fr" ? "Langue de l'interface" : "Platform Interface Language"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            {lang === "ar"
              ? "اختر لغة الواجهة التي تفضلها."
              : lang === "fr" ? "Choisissez la langue de l’interface."
              : "Choose the language used throughout the interface."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {languagesList.map((item) => {
              const active = lang === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLang && setLang(item.id)}
                  className={`bac-btn p-3 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                    active
                      ? "bg-indigo-600/30 border-2 border-indigo-500 shadow-md text-white"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold tracking-wide">{item.flag}</span>
                    <div>
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.native}</p>
                    </div>
                  </div>
                  {active && <Check size={16} className="text-indigo-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Our Other Platforms (مواقعنا الأخرى) */}
        <div
          className="bac-card-shadow bac-in rounded-3xl p-5 space-y-4"
          style={{
            background: "rgba(255,255,255,.06)",
            border: `1px solid ${COLORS.line}`,
          }}
        >
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white">
              {lang === "ar" ? "مواقعنا ومنصاتنا التفاعلية الأخرى" : lang === "fr" ? "Nos Autres Plateformes Interactives" : "Our Other Interactive Platforms"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Platform 1: Glaxystudent */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3 hover:border-indigo-500/40 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={18} className="text-indigo-400" />
                    <h4 className="text-xs font-bold text-white">
                      Glaxystudent
                    </h4>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold uppercase tracking-wider">
                    Super
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === "ar"
                    ? "أداة لحساب المعدلات المدرسية وفق الضوارب التونسية."
                    : lang === "fr" ? "Outil de calcul des moyennes scolaires selon les coefficients tunisiens."
                    : "A tool for calculating school averages using Tunisian coefficients."}
                </p>
              </div>

              <a
                href="https://astounding-brigadeiros-b3951a.netlify.app/"
                target="_blank"
                rel="noreferrer noopener"
                className="bac-btn w-full py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <span>{lang === "ar" ? "زيارة Glaxystudent" : "Visiter Glaxystudent"}</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Platform 2: مداد (Midad) */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3 hover:border-pink-500/40 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-pink-400" />
                    <h4 className="text-xs font-bold text-white">
                      {lang === "ar" ? "مداد — استوديو الكتابة والبحوث" : "Midad — Research & Essay Studio"}
                    </h4>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono font-bold uppercase tracking-wider">
                    Super
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {lang === "ar"
                    ? "مساحة للمساعدة في تنظيم البحوث والمقالات والكتابة."
                    : lang === "fr" ? "Un espace pour structurer des recherches, des dissertations et d’autres textes."
                    : "A workspace for structuring research, essays, and other writing."}
                </p>
              </div>

              <a
                href="https://maqaltnsi-ndiwldbd.manus.space/write"
                target="_blank"
                rel="noreferrer noopener"
                className="bac-btn w-full py-2 px-3 rounded-xl bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-pink-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <span>{lang === "ar" ? "زيارة منصة مداد" : "Visiter Midad"}</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* 5. Logged-in User Exclusive Settings (Profile, Password, Gallery, Proof) */}
        {user && (
          <>
            {/* Shown if user IS a Teacher */}
            {user.role === "teacher" && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-300">
                    {lang === "ar" ? "حساب أستاذ(ة) موثق ومعتمد ✓" : "Compte Enseignant(e) vérifié ✓"}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {lang === "ar" ? "تمت ترقية وتوثيق حسابك بنجاح كأستاذ(ة) معتمد(ة)، ويمكنك نشر الحصص المباشرة والوثائق والإعلانات." : "Votre compte enseignant est vérifié."}
                  </p>
                </div>
              </div>
            )}

            {/* Shown if user IS an Elite Student */}
            {user.role === "elite_student" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                <Award size={20} className="text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-300">
                    {lang === "ar" ? "حساب تلميذ متميز موثق ومعتمد ★" : "Compte Élève d'élite vérifié ★"}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    {lang === "ar" ? "تمت ترقية حسابك بنجاح كتلميذ نخبة معتمد، ويمكنك المساهمة برفع الفروض والوثائق." : "Votre compte est déjà promu."}
                  </p>
                </div>
              </div>
            )}

            {/* Profile Card */}
            <div
              className="bac-card-shadow bac-in rounded-3xl p-5"
              style={{
                background: "rgba(255,255,255,.06)",
                border: `1px solid ${COLORS.line}`,
              }}
            >
              <p
                className="text-sm font-bold mb-3 flex items-center gap-1.5"
                style={{ color: COLORS.text }}
              >
                <UserCog size={16} color={COLORS.accent} /> {t.editProfile}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <button
                  type="button"
                  onClick={() =>
                    avatarInputRef.current && avatarInputRef.current.click()
                  }
                  className="bac-btn relative cursor-pointer"
                  style={{ borderRadius: "9999px" }}
                >
                  <Avatar
                    src={avatar}
                    name={displayName || user.username || "?"}
                    size={62}
                  />
                  <div
                    className="absolute bottom-0 right-0 rounded-full p-1 shadow-md"
                    style={{ background: GRAD }}
                  >
                    <Camera size={11} color="#fff" />
                  </div>
                </button>
                <span className="text-xs" style={{ color: COLORS.textSoft }}>
                  {t.chooseAvatar}
                </span>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
              </div>

              <div className="flex flex-col gap-3">
                <TextField
                  icon={<User size={16} color={COLORS.textSoft} />}
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder={t.displayName}
                  maxLength={30}
                />

                {/* Student Access Code Display */}
                {user.accessCode && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <KeyRound size={16} className="text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[11px] font-bold text-amber-200">
                          {lang === "ar" ? "كود الدخول السريع لحسابك:" : "Code d'accès rapide :"}
                        </p>
                        <p className="text-xs font-mono font-black text-amber-300 tracking-wider">
                          {user.accessCode}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard && user.accessCode) {
                          navigator.clipboard.writeText(user.accessCode);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold cursor-pointer transition-all"
                    >
                      {lang === "ar" ? "نسخ الكود" : "Copier"}
                    </button>
                  </div>
                )}

                {/* Stream Selector (Hidden for Owner and Teachers who do not belong to a specific branch) */}
                {user.role !== "teacher" && user.role !== "superadmin" && user.email !== "learningmyj20@gmail.com" && (
                  <div>
                    <label
                      className="text-xs mb-1 block"
                      style={{ color: COLORS.textSoft }}
                    >
                      {t.chooseBranch}
                    </label>
                    <div className="relative">
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full appearance-none rounded-xl px-3 py-2.5 text-sm"
                        style={{
                          background: COLORS.inputBg,
                          border: `1.5px solid ${COLORS.line}`,
                          color: COLORS.text,
                        }}
                      >
                        {BRANCHES.map((b) => (
                          <option
                            key={b.id}
                            value={b.id}
                            style={{ color: "#111", background: "#fff" }}
                          >
                            {b.name[lang]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={15}
                        className="pointer-events-none absolute top-1/2 -translate-y-1/2"
                        style={{
                          [isRTL ? "left" : "right"]: 12,
                          color: COLORS.textSoft,
                        }}
                      />
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: COLORS.textSoft }}>
                      {t.branchNote} — {t.branchChangedHint}
                    </p>
                  </div>
                )}

                <ErrorNote text={error} />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <PrimaryButton onClick={handleSaveProfile} busy={saving}>
                      {t.saveProfile}
                    </PrimaryButton>
                  </div>
                  {savedFlash && <Check size={17} color={COLORS.success} />}
                </div>
                {savedFlash && (
                  <p className="text-xs" style={{ color: COLORS.success }}>
                    {t.profileSaved}
                  </p>
                )}
              </div>
            </div>

            {/* Password Card */}
            <div
              className="bac-card-shadow bac-in rounded-3xl p-5"
              style={{
                background: "rgba(255,255,255,.06)",
                border: `1px solid ${COLORS.line}`,
              }}
            >
              <p
                className="text-sm font-bold mb-3 flex items-center gap-1.5"
                style={{ color: COLORS.text }}
              >
                <KeyRound size={15} color={COLORS.accent} /> {t.changePassword}
              </p>
              <div className="flex flex-col gap-3">
                <TextField
                  icon={<Lock size={16} color={COLORS.textSoft} />}
                  type="password"
                  value={curPass}
                  onChange={setCurPass}
                  placeholder={t.currentPassword}
                  dir="ltr"
                />
                <TextField
                  icon={<Lock size={16} color={COLORS.textSoft} />}
                  type="password"
                  value={newPass}
                  onChange={setNewPass}
                  placeholder={t.newPassword}
                  dir="ltr"
                />
                <ErrorNote text={error} />
                <PrimaryButton onClick={handleChangePassword} busy={passBusy}>
                  {t.changePassword}
                </PrimaryButton>
                {passFlash && (
                  <p className="text-xs" style={{ color: COLORS.success }}>
                    {passFlash}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <BackgroundGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
        lang={lang}
      />
    </div>
  );
}
