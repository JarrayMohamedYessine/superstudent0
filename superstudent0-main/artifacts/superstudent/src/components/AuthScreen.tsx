import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  GraduationCap,
  User,
  Eye,
  EyeOff,
  Globe,
} from "lucide-react";
import { Account, LangKey } from "../types";
import { COLORS, BRANCHES, T } from "../constants";
import { Logo, ErrorNote, Spinner } from "./Atoms";

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
    // Sign-in disabled: no accounts are checked or stored anywhere.
    setError(
      lang === "ar"
        ? "تسجيل الدخول معطّل في هذا الإصدار: لا يتم تخزين أي بيانات."
        : lang === "fr" ? "La connexion est désactivée dans cette version." : "Sign-in is disabled in this version."
    );
  }

  async function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Account creation disabled: nothing is stored anywhere.
    setError(
      lang === "ar"
        ? "إنشاء الحسابات معطّل في هذا الإصدار: لا يتم تخزين أي بيانات."
        : lang === "fr" ? "La création de comptes est désactivée dans cette version." : "Account creation is disabled in this version."
    );
  }

  async function handleGoogleSignIn() {
    // Google sign-in disabled: no cloud service is contacted.
    setError(lang === "ar" ? "تسجيل الدخول بـ Google معطّل في هذا الإصدار." : lang === "fr" ? "Connexion Google désactivée dans cette version." : "Google sign-in is disabled in this version.");
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
