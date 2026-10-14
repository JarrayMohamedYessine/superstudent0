import React, { useState, useRef } from "react";
import {
  GraduationCap,
  Camera,
  Check,
  Sparkles,
  KeyRound,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Account, LangKey } from "../types";
import { BRANCHES, COLORS, GRAD, T } from "../constants";
import { saveAccount, resizeToDataURL, uploadAvatarToStorage } from "../services/dataService";
import { auth, syncUserProfileToFirestore } from "../services/firebase";
import { Avatar, ErrorNote } from "./Atoms";

interface BranchOnboardingModalProps {
  lang: LangKey;
  isRTL: boolean;
  user: Account;
  onComplete: (updatedUser: Account) => void;
}

// Helper to generate a friendly, secure memorable 6-character access code
function generateStudentAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BAC-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function BranchOnboardingModal({
  lang,
  isRTL,
  user,
  onComplete,
}: BranchOnboardingModalProps) {
  const t = T[lang];
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [selectedBranch, setSelectedBranch] = useState<string>(user.branch || "");
  const [accessCode, setAccessCode] = useState<string>(user.accessCode || generateStudentAccessCode());
  const [avatar, setAvatar] = useState<string | null>(user.avatar || null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await resizeToDataURL(file, 200, 0.75, true);
      setAvatar(dataUrl);
    } catch {
      // ignore
    }
  }

  function handleCopyCode() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleConfirmSetup() {
    setError("");

    // 1. Validate Name
    if (!displayName.trim() || displayName.trim().length < 3) {
      setError(
        lang === "ar"
          ? "الرجاء إدخال اسم التلميذ الكامل (3 أحرف على الأقل)."
          : "Veuillez saisir votre nom complet (au moins 3 caractères)."
      );
      return;
    }

    // 2. Validate Branch
    if (!selectedBranch) {
      setError(
        lang === "ar"
          ? "الرجاء اختيار شعبة البكالوريا الخاصة بك للمتابعة."
          : "Veuillez sélectionner votre section du Baccalauréat."
      );
      return;
    }

    // 3. Validate Access Code
    const cleanCode = accessCode.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 4) {
      setError(
        lang === "ar"
          ? "الرجاء تحديد كود الدخول السريع المخصص لحسابك."
          : "Veuillez définir un code d'accès valide pour votre compte."
      );
      return;
    }

    setSaving(true);
    let finalAvatar = avatar;
    if (avatar && avatar.startsWith("data:")) {
      try {
        finalAvatar = await uploadAvatarToStorage(avatar, user.username || user.email.split("@")[0]);
      } catch (err) {
        console.warn("Avatar upload warning:", err);
      }
    }

    const updated: Account = {
      ...user,
      displayName: displayName.trim().slice(0, 35),
      branch: selectedBranch,
      gradeLevel: "4eme_bac", // Baccalaureate only as specified
      accessCode: cleanCode,
      avatar: finalAvatar || null,
      needsBranchSetup: false,
    };

    try {
      await saveAccount(updated);
      if (auth.currentUser) {
        await syncUserProfileToFirestore(auth.currentUser, updated);
      }
    } catch (err) {
      console.warn("Error saving user onboarding data:", err);
    }

    setSaving(false);
    onComplete(updated);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="bac-glass bac-card-shadow relative w-full max-w-lg rounded-3xl p-5 sm:p-7 border border-indigo-500/40 shadow-2xl overflow-hidden my-auto"
        style={{
          background: "linear-gradient(135deg, rgba(20, 20, 42, 0.96), rgba(12, 12, 28, 0.98))",
        }}
      >
        {/* Top decorative ambient glow */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Header Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 mb-2 shadow-sm">
            <Sparkles size={12} className="text-emerald-400" />
            <span>
              {lang === "ar"
                ? "تم التحقق من حساب Google بنجاح."
                : lang === "fr" ? "Le compte Google a été vérifié."
                : "Google account verified."}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white text-center">
            {lang === "ar" ? "إكمال ملف طالب البكالوريا" : "Finalisation du Profil Bac"}
          </h2>
          <p className="text-xs text-slate-300 mt-1 text-center max-w-md leading-relaxed">
            {lang === "ar"
              ? "المنصة مخصصة لطلاب البكالوريا التونسية. يرجى ملء البيانات الضرورية التالية لتخصيص الدروس والمساعد الذكي وتفعيل كود الدخول الخاص بك."
              : "Plateforme dédiée exclusivement aux bacheliers. Veuillez compléter les informations obligatoires ci-dessous."}
          </p>

          <div className="w-full mt-5 space-y-4 text-left" dir={isRTL ? "rtl" : "ltr"}>
            
            {/* 1. Full Student Name (REQUIRED) */}
            <div>
              <label className="text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserIcon size={14} className="text-indigo-400" />
                  <span>{lang === "ar" ? "اسم ولقب التلميذ (إجباري):" : "Nom & Prénom de l'élève (Obligatoire) :"}</span>
                </span>
                <span className="text-[10px] text-rose-400 font-bold">* إجباري</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={lang === "ar" ? "مثال: محمد عزيز الطرابلسي" : "Ex: Mohamed Aziz Trabelsi"}
                maxLength={35}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-medium text-white transition-all outline-none focus:ring-2 focus:ring-indigo-500/50"
                style={{
                  background: COLORS.inputBg,
                  border: `1.5px solid ${displayName.trim() ? "rgba(99, 102, 241, 0.4)" : COLORS.line}`,
                }}
              />
            </div>

            {/* 2. Baccalaureate Section (REQUIRED) */}
            <div>
              <label className="text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-indigo-400" />
                  <span>{lang === "ar" ? "شعبة البكالوريا (إجباري):" : "Section du Baccalauréat (Obligatoire) :"}</span>
                </span>
                <span className="text-[10px] text-rose-400 font-bold">* إجباري</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BRANCHES.map((b) => {
                  const isSelected = selectedBranch === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBranch(b.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40 border border-indigo-400 scale-[1.02]"
                          : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{b.name[lang]}</span>
                      {isSelected && <Check size={14} className="text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Access Code for Future Fast Logins (REQUIRED) */}
            <div className="rounded-2xl p-3.5 bg-indigo-950/40 border border-indigo-500/30">
              <label className="text-xs font-bold text-indigo-200 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound size={15} className="text-amber-400" />
                  <span>{lang === "ar" ? "كود الدخول السريع الخاص بك (إجباري):" : "Votre Code d'accès rapide (Obligatoire) :"}</span>
                </span>
                <span className="text-[10px] text-amber-300 font-bold">{lang === "ar" ? "رمز الدخول للمرة القادمة" : lang === "fr" ? "Code pour votre prochaine connexion" : "Code for your next sign-in"}</span>
              </label>
              <p className="text-[11px] text-slate-300 mb-2.5">
                {lang === "ar"
                  ? "احفظ هذا الكود جيداً! سيمكنك من تسجيل الدخول بوضع بريدك الإلكتروني وهذا الكود مباشرة في أي وقت."
                  : "Conservez précieusement ce code ! Vous pourrez vous reconnecter en saisissant votre e-mail et ce code."}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder="BAC-XXXX"
                  maxLength={12}
                  className="flex-1 rounded-xl px-3.5 py-2 text-sm font-mono font-bold tracking-wider text-amber-300 text-center uppercase outline-none focus:ring-2 focus:ring-amber-500/50"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "1.5px solid rgba(245, 158, 11, 0.4)",
                  }}
                />
                
                <button
                  type="button"
                  onClick={() => setAccessCode(generateStudentAccessCode())}
                  title={lang === "ar" ? "توليد كود عشوائي جديد" : "Générer un autre code"}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/15 cursor-pointer transition-all"
                >
                  <RefreshCw size={15} />
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? (lang === "ar" ? "تم النسخ" : "Copié") : (lang === "ar" ? "نسخ" : "Copier")}</span>
                </button>
              </div>
            </div>

            {/* 4. Student Avatar / Photo (OPTIONAL) */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar
                    src={avatar}
                    name={displayName || user.displayName || "طالب"}
                    size={48}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                    className="absolute -bottom-1 -right-1 rounded-full p-1 bg-indigo-600 text-white shadow-md hover:bg-indigo-500 cursor-pointer transition-all"
                  >
                    <Camera size={11} />
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    {lang === "ar" ? "الصورة الشخصية" : "Photo de profil"}
                    <span className="text-[10px] text-slate-400 font-normal mr-1.5 ml-1.5">(اختياري)</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {lang === "ar" ? "تم جلبها من Google ويمكنك تغييرها الآن أو لاحقاً" : "Importée de Google, modifiable à tout moment"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-indigo-300 font-bold cursor-pointer transition-all shrink-0"
              >
                {lang === "ar" ? "تغيير الصورة" : lang === "fr" ? "Changer la photo" : "Change photo"}
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarPick}
              />
            </div>

          </div>

          <div className="w-full mt-4">
            <ErrorNote text={error} />
          </div>

          {/* Confirm and Enter Platform Button */}
          <button
            type="button"
            onClick={handleConfirmSetup}
            disabled={saving}
            className="bac-btn w-full mt-4 py-3.5 px-6 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: GRAD }}
          >
            <span>
              {saving
                ? (lang === "ar" ? "جارِ حفظ بياناتك وتجهيز المنصة..." : "Enregistrement du profil...")
                : (lang === "ar" ? "تأكيد البيانات والدخول إلى المنصة" : lang === "fr" ? "Confirmer et accéder à la plateforme" : "Confirm and enter the platform")}
            </span>
            {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>

          <p className="text-[10px] text-slate-400 mt-2.5 text-center flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-indigo-400 shrink-0" />
            <span>
              {lang === "ar"
                ? "بياناتك مشفرة ومحمية بالكامل وفق معايير الأمان الرسمية."
                : "Vos données sont sécurisées et chiffrées selon les standards académiques."}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
