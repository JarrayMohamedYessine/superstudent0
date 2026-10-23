import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";
import { Account, LangKey, GradeLevel } from "../types";
import { COLORS, BRANCHES, T } from "../constants";
import { applySuperAdminVerdict } from "../services/adminVerifier";
import {
  getAccountByEmail,
  getAccountByUsername,
  saveAccount,
  normEmail,
} from "../services/dataService";
import { loginWithGoogle } from "../services/firebase";
import { loginApi, registerApi } from "../services/authClient";
import { Logo, ErrorNote, Spinner } from "./Atoms";

function isAccountBanned(acc: Account | null): boolean {
  if (!acc) return false;
  if (acc.bannedUntil) return acc.bannedUntil > Date.now();
  return !!acc.banned;
}

export function AuthScreen({
  lang,
  setLang,
  isRTL,
  onAuthed,
  onGuestExplore,
}: {
  lang: LangKey;
  setLang: (l: LangKey) => void;
  isRTL: boolean;
  onAuthed: (acc: Account) => void;
  onGuestExplore?: () => void;
}) {
  const t = T[lang];
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign Up Form State
  const [signupDisplayName, setSignupDisplayName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupBranch, setSignupBranch] = useState("math");
  const [signupPassword, setSignupPassword] = useState("");

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const identifier = loginIdentifier.trim();
    const password = loginPassword;

    if (!identifier) {
      setError(
        lang === "ar"
          ? "الرجاء إدخال البريد الإلكتروني أو اسم المستخدم"
          : lang === "fr" ? "Saisissez votre adresse e-mail ou nom d’utilisateur." : "Enter your email address or username."
      );
      return;
    }
    if (!password) {
      setError(lang === "ar" ? "الرجاء إدخال كلمة المرور" : lang === "fr" ? "Saisissez votre mot de passe." : "Enter your password.");
      return;
    }

    setBusy(true);
    try {
      let targetEmail = identifier.toLowerCase();

      // If user typed a username without @, find their associated email
      if (!targetEmail.includes("@")) {
        const found = await getAccountByUsername(targetEmail);
        if (!found) {
          setError(
            lang === "ar"
              ? "اسم المستخدم غير مسجل، يمكنك إنشاء حساب جديد"
              : lang === "fr" ? "Nom d’utilisateur introuvable." : "Username not found. You can create an account."
          );
          setBusy(false);
          return;
        }
        targetEmail = found.email;
      }

      const account: Account | null = await getAccountByEmail(targetEmail);

      if (!account) {
        setError(lang === "ar" ? "الحساب غير مسجل، يمكنك إنشاء حساب جديد" : lang === "fr" ? "Compte introuvable." : "Account not found.");
        setBusy(false);
        return;
      }

      if (isAccountBanned(account)) {
        setError(lang === "ar" ? "هذا الحساب محظور حالياً" : lang === "fr" ? "Ce compte est actuellement suspendu." : "This account is currently suspended.");
        setBusy(false);
        return;
      }

      // Super-admin ("الإدارة") recognition: one request to the ggggyyr4364
      // Cloudflare Worker per email per session, verdict cached in memory.
      const verified = await applySuperAdminVerdict(account);

      onAuthed(verified);
    } catch (err: any) {
      console.error("Login exception:", err);
      setError(err.message || (lang === "ar" ? "حدث خطأ أثناء تسجيل الدخول" : lang === "fr" ? "Une erreur est survenue lors de la connexion." : "Something went wrong while signing in."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const displayName = signupDisplayName.trim();
    const username = signupUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const email = signupEmail.trim().toLowerCase();
    const branch = signupBranch;
    const password = signupPassword;

    if (!displayName) {
      setError(lang === "ar" ? "الرجاء إدخال الاسم واللقب" : lang === "fr" ? "Saisissez votre nom complet." : "Enter your full name.");
      return;
    }
    if (!username || username.length < 3) {
      setError(
        lang === "ar"
          ? "اسم المستخدم يجب أن يتكون من 3 أحرف أو أرقام إنجليزية على الأقل"
          : lang === "fr" ? "Le nom d’utilisateur doit comporter au moins 3 caractères."
          : "Username must be at least 3 characters long."
      );
      return;
    }
    if (!email || !email.includes("@")) {
      setError(lang === "ar" ? "الرجاء إدخال بريد إلكتروني صالح" : lang === "fr" ? "Adresse e-mail invalide." : "Enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError(
        lang === "ar"
          ? "كلمة المرور يجب ألا تقل عن 6 أحرف"
          : lang === "fr" ? "Le mot de passe doit comporter au moins 6 caractères."
          : "Password must be at least 6 characters long."
      );
      return;
    }

    setBusy(true);
    try {
      // Check if username already exists in Supabase
      const existingUser = await getAccountByUsername(username);
      if (existingUser) {
        setError(
          lang === "ar"
            ? "اسم المستخدم هذا محجوز مسبقاً، يرجى اختيار اسم آخر"
              : lang === "fr" ? "Ce nom d’utilisateur est déjà utilisé." : "That username is already taken."
        );
        setBusy(false);
        return;
      }

      // Check if email already registered
      const existingEmail = await getAccountByEmail(email);
      if (existingEmail) {
        setError(
          lang === "ar"
            ? "هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول مباشرة"
              : lang === "fr" ? "Cette adresse e-mail est déjà enregistrée." : "This email address is already registered."
        );
        setBusy(false);
        return;
      }

      // Every new account starts as a regular member. Super-admin status is
      // recognized only through the ggggyyr4364 Cloudflare Worker (variable `x`).
      const baseAccount: Account = {
        email: email,
        username: username,
        displayName: displayName,
        branch: branch,
        gradeLevel: "4eme_bac",
        role: "member",
        avatar: null,
        createdAt: Date.now(),
        canUpload: false,
        banned: false,
        moderatorRooms: [],
        bannedUntil: null,
      };
      const newAccount = await applySuperAdminVerdict(baseAccount);

      await saveAccount(newAccount);
      onAuthed(newAccount);
    } catch (err: any) {
      console.error("Signup exception:", err);
      setError(err.message || (lang === "ar" ? "تعذر إنشاء الحساب" : lang === "fr" ? "Impossible de créer le compte." : "Unable to create the account."));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setBusy(true);
    try {
      const res = await loginWithGoogle();
      if (res.success && res.user) {
        const verified = await applySuperAdminVerdict(res.user);
        onAuthed(verified);
      } else {
        setError(res.error || (lang === "ar" ? "فشل تسجيل الدخول بـ Google" : "Google sign in failed"));
      }
    } catch (err: any) {
      setError(err.message || "Erreur Google");
    } finally {
      setBusy(false);
    }
  }

  return (
      <div dir={isRTL ? "rtl" : "ltr"} className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-[#070A14] text-slate-100 select-none overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Language Selector in Top Corner */}
      <div className="absolute top-5 end-5 flex items-center gap-1.5 z-20">
        <Globe size={15} className="text-slate-400" />
        {(["ar", "fr", "en"] as LangKey[]).map((option) => (
          <button key={option} type="button" onClick={() => setLang(option)} aria-pressed={lang === option}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${lang === option ? "bg-indigo-600 text-white border-indigo-400" : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"}`}>
            {option === "ar" ? "عربي" : option.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <Logo size={48} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            SuperStudent <span className="text-indigo-400">.TN</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {lang === "ar"
              ? "موارد دراسية منظمة لتلاميذ الباكالوريا في تونس."
              : lang === "fr" ? "Des ressources d’étude organisées pour les élèves du baccalauréat en Tunisie."
              : "Organized study resources for Tunisian Baccalaureate students."}
          </p>
        </div>

        {/* Card Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0F172A]/90 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-black/50 space-y-5">
          {/* Tab Switcher: Login vs Sign Up */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#080D1A] border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setError("");
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === "login"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lang === "ar" ? "تسجيل الدخول" : lang === "fr" ? "Se connecter" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setError("");
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authMode === "signup"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {lang === "ar" ? "إنشاء حساب جديد" : lang === "fr" ? "Créer un compte" : "Create account"}
            </button>
          </div>

          {/* Form: Login */}
          {authMode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail size={13} className="text-indigo-400" />
                  <span>{lang === "ar" ? "البريد الإلكتروني أو اسم المستخدم" : lang === "fr" ? "E-mail ou nom d’utilisateur" : "Email or username"}</span>
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={lang === "ar" ? "مثال: student@bac.tn أو amine_math" : "ex: student@bac.tn ou amine"}
                  className="w-full bg-[#1E293B] text-white text-xs rounded-xl px-3.5 py-3 border border-slate-700 focus:outline-none focus:border-indigo-500 font-medium transition-all"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-indigo-400" />
                  <span>{lang === "ar" ? "كلمة المرور" : lang === "fr" ? "Mot de passe" : "Password"}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#1E293B] text-white text-xs rounded-xl px-3.5 py-3 border border-slate-700 focus:outline-none focus:border-indigo-500 font-medium transition-all"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <ErrorNote text={error} />

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {busy ? <Spinner size={16} /> : <ShieldCheck size={16} />}
                <span>{lang === "ar" ? "تسجيل الدخول" : lang === "fr" ? "Se connecter" : "Sign in"}</span>
              </button>
            </form>
          )}

          {/* Form: Sign Up */}
          {authMode === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User size={13} className="text-indigo-400" />
                <span>{lang === "ar" ? "الاسم واللقب" : lang === "fr" ? "Nom et prénom" : "Full name"}</span>
                </label>
                <input
                  type="text"
                  value={signupDisplayName}
                  onChange={(e) => setSignupDisplayName(e.target.value)}
                  placeholder={lang === "ar" ? "محمد بن علي" : "Mohamed Ben Ali"}
                  className="w-full bg-[#1E293B] text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User size={13} className="text-indigo-400" />
                   <span>{lang === "ar" ? "اسم المستخدم" : lang === "fr" ? "Nom d’utilisateur" : "Username"}</span>
                  </label>
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="amine_bac26"
                    className="w-full bg-[#1E293B] text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono transition-all"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-indigo-400" />
                   <span>{lang === "ar" ? "شعبة الباكالوريا" : lang === "fr" ? "Filière du Bac" : "Baccalaureate study track"}</span>
                  </label>
                  <select
                    value={signupBranch}
                    onChange={(e) => setSignupBranch(e.target.value)}
                    className="w-full bg-[#1E293B] text-white text-xs rounded-xl px-3 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name[lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail size={13} className="text-indigo-400" />
                   <span>{lang === "ar" ? "البريد الإلكتروني" : lang === "fr" ? "Adresse e-mail" : "Email address"}</span>
                </label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-[#1E293B] text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 font-medium transition-all"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-indigo-400" />
                  <span>{lang === "ar" ? "كلمة المرور" : lang === "fr" ? "Mot de passe" : "Password"}</span>
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1E293B] text-white text-xs rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500 font-medium transition-all"
                  dir="ltr"
                />
              </div>

              <ErrorNote text={error} />

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {busy ? <Spinner size={16} /> : <CheckCircle2 size={16} />}
                <span>{lang === "ar" ? "إنشاء الحساب" : lang === "fr" ? "Créer le compte" : "Create account"}</span>
              </button>
            </form>
          )}

          {/* Guest Explore Action */}
          {onGuestExplore && (
            <button
              type="button"
              onClick={onGuestExplore}
              className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {lang === "ar" ? "تصفح كزائر" : lang === "fr" ? "Explorer en tant qu’invité" : "Explore as a guest"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
