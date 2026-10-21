import React, { useState } from "react";
import { X, User, Mail, Lock, Sparkles, GraduationCap, CheckCircle } from "lucide-react";
import { LangKey, Account, GradeLevel } from "../types";
import { BRANCHES } from "../constants";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: Account) => void;
  lang: LangKey;
  isRTL?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  lang,
  isRTL = true,
}: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [branch, setBranch] = useState("math");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>("4eme_bac");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("الرجاء إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    const username = email.split("@")[0] || "student";
    const user: Account = {
      id: `usr_${Date.now()}`,
      email,
      username,
      displayName: displayName || username,
      avatar: null,
      avatarUrl: null,
      branch,
      gradeLevel,
      role: "member",
      moderatorRooms: [],
      banned: false,
      bannedUntil: null,
      createdAt: Date.now(),
    };

    onAuthSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">
                {isRegister ? "إنشاء حساب تلميذ جديد" : "تسجيل الدخول إلى SuperStudent"}
              </h3>
              <p className="text-xs text-slate-400">منصتك المجانية للنجاح والتميز</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                الاسم واللقب
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="محمد التونسي"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bac2026@student.tn"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الشعبة</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {Object.entries(BRANCHES).map(([key, b]) => (
                    <option key={key} value={key}>
                      {b.name.ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">المستوى</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="4eme_bac">4 ثانوي (باكالوريا)</option>
                  <option value="3eme_sec">3 ثانوي</option>
                  <option value="2eme_sec">2 ثانوي</option>
                  <option value="1ere_sec">1 ثانوي</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all mt-2"
          >
            {isRegister ? "إنشاء الحساب فوراً" : "تسجيل الدخول"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isRegister
                ? "لديك حساب بالفعل؟ تسجيل الدخول"
                : "ليس لديك حساب؟ إنشاء حساب مجاني الآن"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
